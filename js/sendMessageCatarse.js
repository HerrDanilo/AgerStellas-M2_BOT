//#region TESTES ANTERIORES

// //#region PRIMEIRA ETAPA
// const selector_loadMore = "#load-more";
// var loadMore = document.querySelector(selector_loadMore);
// var index = 0;

// while (loadMore) {
//     // Wait some time before doing all again.
//     index++;
//     loadMore.click();
//     loadMore = document.querySelector("#load-more");
// }
// //#endregion

// //#region SEGUNDA ETAPA
// const selector_subsList = "#app > div > div.before-footer.bg-gray.section > div.w-container > div.u-marginbottom-60 > div.fontsize-small";
// var subsList = document.querySelector(selector_subsList);

// for (i = 1; i <= subsList.children.length; i++) {
//     var subStatus = CheckSubStatus(i);
//     if (subStatus.includes("Cancelada") || subStatus.includes("Inativa")) {
//         var email = GetEmailFromCatarseProfile(i);
//         // Pegar as informações do sub com o `subsList.GetSubInfo()`;
//     }
// }
// //#endregion

// function CheckSubStatus(index) {
//     const selector = `#app > div > div.before-footer.bg-gray.section > div.w-container > div.u-marginbottom-60 > div.fontsize-small > div:nth-child(${index}) > div.card.card-clickable > div > div:nth-child(6)`;
//     var subStatus = document.querySelector(selector);
//     return subStatus.innerText;
// }

// //#endregion

const fs = require('fs');

//#region SEND MESSAGE THROUGH CATARSE
async function CatarseSendMessage(page) {
    await Delay(5, enableLogs);
    var canContinue = true;
    var message = "Mensagem automatizada";
    var index = 2;

    //#region SELECTORS
    const SHOWMORE_SELECTOR = `#app > div > div.before-footer.bg-gray.section > div.w-container > div.u-marginbottom-60 > div.fontsize-small > div:nth-child(${index}) > div > div > button`;
    const WRITEMESSAGE_SELECTOR = `#app > div > div.before-footer.bg-gray.section > div.w-container > div.u-marginbottom-60 > div.fontsize-small > div:nth-child(${index}) > div.details-backed-project.card > div > div > div.w-col.w-col-5 > div:nth-child(1) > div.fontsize-smaller > a`;
    const SENDMESSAGE_SELECTOR = "#app > div > div.before-footer.bg-gray.section > div.w-container > div.u-marginbottom-60 > div.fontsize-small > div.\\.card-detailed-open > div.details-backed-project.card > div > div > div.w-col.w-col-5 > div:nth-child(1) > div.fontsize-smaller > div.modal-backdrop > div > div > div > div.modal-dialog-content > div > form > div.modal-dialog-nav-bottom > div > div";
    const EMAIL_SELECTOR = `#app > div > div.before-footer.bg-gray.section > div.w-container > div.u-marginbottom-60 > div.fontsize-small > div:nth-child(${index}) > div.details-backed-project.card > div > div > div.w-col.w-col-5 > div:nth-child(1) > div.fontsize-smaller > div:nth-child(1)`;
    //#endregion

    async function ClickCanContinue(logMessage, selector, delay) {
        if (canContinue) {
            LogThis(colors.cyan, logMessage);
            try {
                await page.click(selector);
            } catch (error) {
                console.log(error); // FIXME: Talvez botar o erro no `logging.NewError()`;
                canContinue = false;
            }
            await Delay(delay, enableLogs);
        }
    }

    await ClickCanContinue("Clicking Show More", SHOWMORE_SELECTOR, 0);

    var emailSelector = await page.waitForSelector(EMAIL_SELECTOR);
    var email = await emailSelector.evaluate(el => el.textContent);
    console.log(email);

    var sub = subsList.GetSubInfoFromEmail(email, false);
    var emailPath = path.resolve('./DONT_GIT/email.txt');
    console.log(`\n`);

    var emailFile = await fs.readFileSync(emailPath);
    var emailText = emailFile.toString();

    emailText = emailText.replace("{NOME}", sub.name);
    emailText = emailText.replace("{NOME_COMPLETO}", sub.completeName);
    emailText = emailText.replace("{ID_CATARSE}", sub.catarseId);
    emailText = emailText.replace("{TIER_ASSINATURA}", sub.subTier);
    emailText = emailText.replace("{STATUS_ASSINATURA}", sub.status);

    console.log(emailText);

    process.exit(); // TODO: Essa linha é só pra não ficar mandando email toda vez que rodar o teste.

    await ClickCanContinue("Clicking Write Message", WRITEMESSAGE_SELECTOR, 1);

    if (canContinue) {
        LogThis(colors.cyan, "Typing message");
        try {
            await page.locator('textarea').fill(message);
        } catch (error) {
            console.log(error);
            canContinue = false;
        }
        await Delay(5, enableLogs);
    }

    await ClickCanContinue("Sending Message", SENDMESSAGE_SELECTOR, 2);

    await ClickCanContinue("Clicking Show More", SHOWMORE_SELECTOR, 0);
}
//#endregion

module.exports = { CatarseSendMessage }