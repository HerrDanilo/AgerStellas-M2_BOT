//#region IMPORTS
const editJsonFile = require('edit-json-file');
const entraCatarse = require('./js/entraCatarse.js');
const googleDrive = require('./js/googleDrive.js');
const { Delay, LogThis, colors } = require('aranha-commons');
//#endregion

//#region GLOBAL VARIABLES
var configsJson = editJsonFile(`${__dirname}/DONT_GIT/configs.json`);
var enableLogs = configsJson.get('enableLogs');
//#endregion

async function ExitProgram() {
    if (enableLogs) LogThis(colors.red, "Exiting program!");
    await Delay(5, enableLogs);
    process.exit(1);
}

async function InitBot() {
    if (enableLogs) LogThis(colors.green, "Program is starting! - " + new Date());

    var catarse = await entraCatarse.StartCatarse();
    if (enableLogs) LogThis(colors.cyan, 'Done with catarse.');

    await googleDrive.UpdateDrive();
    if (enableLogs) LogThis(colors.cyan, 'Done with google drive.');

    // await ProgramCooldown(catarse);

    process.exit(1);
}

async function ProgramCooldown(catarse) {
    if (enableLogs) LogThis(colors.cyan, "Sleeping... " + new Date());
    await Delay(900, enableLogs);
    await entraCatarse.DownloadCooldown(catarse.browser);
    await googleDrive.UpdateDrive();

    ProgramCooldown();
}

function TesteDoBot() {
    ExitProgram();
}

// TesteDoBot();
InitBot();