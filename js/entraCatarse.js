//#region IMPORTS
const fs = require('fs');
const path = require("path");
const puppeteer = require("puppeteer");
const { Delay, LogThis, colors} = require("aranha-commons");
const editJsonFile = require('edit-json-file');
//#endregion

//#region GLOBAL VARIABLES
const csvDownloadPath = path.resolve("./csv");
let configsJson = editJsonFile(`${__dirname}../DONT_GIT/configs.json`);
var isHeadless = configsJson.get('puppeteer.isHeadless');
//#endregion

//#region LINKS
var linkBaixarReport =
    "https://www.catarse.me/projects/159641/subscriptions_report_download";
var linkSubsReport =
    "https://www.catarse.me/projects/159641/subscriptions_report";
var linkCatarseLogin = "https://www.catarse.me/login";
//#endregion

//#region BASE PUPPETEER METHODS
async function StartBrowser() {
    LogThis(colors.magenta, "Launching browser");
    const browser = await puppeteer.launch({ headless: isHeadless });
    const page = await browser.newPage();
    return { browser, page };
}

async function OpenSite(url) {
    const { browser, page } = await StartBrowser();
    LogThis(colors.cyan, "Opening site:\n" + url);
    await page.goto(url);
    return { browser, page };
}
//#endregion

async function LoginCatarse(page) {
    LogThis(colors.magenta, "Login into Catarse");
    await page.waitForSelector('input[type="email"]');
    await page.click('input[type="email"]');
    await page.keyboard.type(_username);

    await page.click('input[type="password"]');
    await page.keyboard.type(_password);

    await page.click('input[type="submit"]');
}

async function DownloadSubsList(browser, page) {
    await SetDownloadBehaviour(page);

    await Delay(5);
    LogThis(colors.magenta, "Asking catarse to create .csv file.");
    await page.evaluate(() => {
        var baixar =
            "#app > div > div.before-footer.bg-gray.section > div.w-container > div.u-marginbottom-20 > div > div.u-text-right.w-col.w-col-3.w-col-small-3.w-col-tiny-3 > a";
        var csv =
            "#app > div > div.before-footer.bg-gray.section > div.w-container > div.u-marginbottom-20 > div > div.u-text-right.w-col.w-col-3.w-col-small-3.w-col-tiny-3 > div > a:nth-child(1)";
        var checkbox =
            "#app > div > div.modal-backdrop > div > div > div > div.modal-dialog-content > div.u-marginbottom-30 > div.w-form > form > label:nth-child(1) > input";
        var avancar =
            "#app > div > div.modal-backdrop > div > div > div > div.modal-dialog-nav-bottom > div > div.w-col.w-col-6 > a";

        var selectors = [baixar, csv, checkbox, avancar];

        function BaixarArquivo(selectorIndex) {
            var selector = document.querySelector(selectors[selectorIndex]);
            selector.click();
        }

        for (let i = 0; i < selectors.length; i++) {
            setTimeout(BaixarArquivo, 1000 * i, i);
        }
    });

    await Delay(20);
    LogThis(colors.magenta, "Trying to download latest .csv file.")
    await page.goto(linkBaixarReport);
    await page.evaluate(() => {
        const className = "btn btn-small btn-dark w-button";
        var botoes = document.getElementsByClassName(className);
        botao = botoes[0];
        botao?.click();
    });
    await Delay(60);

    var csvFolder = fs.readdirSync(csvDownloadPath);
    if (csvFolder.length > 1) {
        LogThis(colors.green, "Download done!");
        RemoveAndRenameCSVFile(csvFolder);
    }

    await page.close();

    DownloadAfterTime(browser);
}

async function RemoveAndRenameCSVFile(csvFolder) {
    // Remove older csv file.
    var csvToRemove = path.resolve(`${csvDownloadPath}/Base_de_Assinantes.csv`)
    fs.unlinkSync(csvToRemove);

    // Rename Newer csv file.
    var fileToRename = csvFolder[0];
    fs.rename(`${csvDownloadPath}/${fileToRename}`, `${csvDownloadPath}/Base_de_Assinantes.csv`, function (err) {
        if (err) LogThis(colors.red, 'ERROR: ' + err);
    });
}

async function DownloadAfterTime(browser) {
    LogThis(colors.cyan, "Sleeping... " + new Date());
    await Delay(900);
    const page = await browser.newPage();
    await page.goto(linkSubsReport);
    await Delay(10);
    if (page.url() == linkSubsReport) {
        console.log('é o msm url da página!');
    }
    await DownloadSubsList(browser, page);
}

async function SetDownloadBehaviour(page) {
    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: csvDownloadPath,
    });
    LogThis(colors.green, "Download behavior setted.");
}

async function SomethingWentWrong() {
    var screenshotName = "Error_" + new Date();
    var screenshotPath = path.resolve('./screenshots');
    LogThis(colors.red, "Algo deu errado aqui ó!");
    await page.screenshot({ path: `${screenshotPath}/${screenshotName}` });
    site.browser.close();
}

async function StopProgram() {
    await Delay(5);
    process.exit(1);
}

async function StartProgram() {
    LogThis(colors.green, "Program is starting! - " + new Date())
    var site = await OpenSite(linkCatarseLogin);
    var page = site.page;

    await LoginCatarse(page);
    await Delay(10);

    if (page.url().includes('login')) {
        await SomethingWentWrong();
        await StopProgram();
    } else {
        await page.goto(linkSubsReport);
        await DownloadSubsList(site.browser, page);
    }
}

(async () => {
    await StartProgram();
})();
