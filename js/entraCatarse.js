//#region IMPORTS
const fs = require('fs');
const path = require("path");
const puppeteer = require("puppeteer");
const editJsonFile = require('edit-json-file');
const { Delay, LogThis, colors } = require("aranha-commons");
//#endregion

//#region GLOBAL VARIABLES
const csvDownloadPath = path.resolve("./csv");
let configsJson = editJsonFile(path.resolve('./DONT_GIT/configs.json'));
var isHeadless = configsJson.get('puppeteer.headless');
var enableLogs = configsJson.get('enableLogs');
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
    if (enableLogs) LogThis(colors.magenta, "Launching browser");
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    return { browser, page };
}

async function OpenSite(url) {
    const { browser, page } = await StartBrowser();
    if (enableLogs) LogThis(colors.cyan, "Opening site:\n" + url);
    await page.goto(url);
    return { browser, page };
}
//#endregion

async function LoginCatarse(page) {
    if (enableLogs) LogThis(colors.magenta, "Login into Catarse");
    await page.waitForSelector('input[type="email"]');
    await page.click('input[type="email"]');
    await page.keyboard.type(configsJson.get('catarse.email'));

    await page.click('input[type="password"]');
    await page.keyboard.type(configsJson.get('catarse.password'));

    await page.click('input[type="submit"]');
}

async function DownloadSubsList(page) {
    await SetDownloadBehaviour(page);

    await Delay(5, enableLogs);
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

    if (enableLogs) LogThis(colors.magenta, "Requesting newer list.");
    await Delay(20, enableLogs);
    await page.goto(linkBaixarReport);

    // TODO: A lista baixada não está ordenada pelos nomes dos assinantes, mas parece q pelo id de usuário.
    var csvFolder = fs.readdirSync(csvDownloadPath);
    let downloadAttempts = 0;

    while (csvFolder.length <= 1) {
        downloadAttempts++;
        if (enableLogs) LogThis(colors.magenta, downloadAttempts + ".Trying to download latest .csv file.");
        await TryToDownloadListFile(page);
        csvFolder = fs.readdirSync(csvDownloadPath); // Read the folder contents again.
        if (downloadAttempts >= 5) break;
    }

    if (enableLogs) LogThis(colors.green, "Download done!");

    await page.close();
}

async function TryToDownloadListFile(page) {
    await page.evaluate(() => {
        const className = "btn btn-small btn-dark w-button";
        var botoes = document.getElementsByClassName(className);
        botao = botoes[0];
        botao?.click();
    });
    await Delay(30, enableLogs);
}

exports.DownloadCooldown = async function DownloadCooldown(browser) {
    const page = await browser.newPage();
    await page.goto(linkSubsReport);
    await Delay(10, enableLogs);
    if (page.url() == linkSubsReport) {
        await DownloadSubsList(page);
    }
    else LogThis(colors.red, "Algo deu errado ao sair do cooldown. \nLink da página: " + page.url());
}

async function SetDownloadBehaviour(page) {
    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: csvDownloadPath,
    });
    if (enableLogs) LogThis(colors.green, "Download behavior setted.");
}

async function SomethingWentWrong(browser) {
    var screenshotName = "Error_" + new Date();
    var screenshotPath = path.resolve('../screenshots');
    LogThis(colors.red, "Algo deu errado aqui ó!");
    await page.screenshot({ path: `${screenshotPath}/${screenshotName}` });
    browser.close();
}

async function StopProgram() {
    // TODO: Ter um jeito de avisar que o programa deu erro, seja no discord, email ou seja lá qual forma for.
    await Delay(5, enableLogs);
    process.exit(1);
}

exports.StartCatarse = async function StartProgram() {
    var site = await OpenSite(linkCatarseLogin);
    var page = site.page;
    var browser = site.browser;

    await LoginCatarse(page);
    if (enableLogs) LogThis(colors.cyan, 'Waiting to verify page url.');
    await Delay(10, enableLogs);

    if (page.url().includes('login')) {
        await SomethingWentWrong(browser);
        await StopProgram();
    } 
    else if (page.url() == "https://www.catarse.me/") {
        if (enableLogs) LogThis(colors.green, 'Page url is correct.');
        let status = page.goto(linkSubsReport);
        //console.log(status.status());
        await Delay(10, enableLogs);
        console.log(page.url());
        // await DownloadSubsList(page);
    }
    return { browser };
}
