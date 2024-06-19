//#region IMPORTS
const editJsonFile = require('edit-json-file');
const entraCatarse = require('./js/entraCatarse.js');
const googleDrive = require('./js/googleDrive.js');
const { Delay, LogThis, colors } = require('aranha-commons');
//#endregion

//#region GLOBAL VARIABLES
var configsJson = editJsonFile(`${__dirname}/DONT_GIT/configs.json`);
//#endregion

async function ExitProgram() {
    LogThis(colors.red, "Exiting program!");
    await Delay(5);
    process.exit(1);
}

async function InitBot() {
    LogThis(colors.green, "Program is starting! - " + new Date());

    // var catarse = await entraCatarse.StartCatarse();
    // LogThis(colors.cyan, 'Done with catarse.');

    await googleDrive.UpdateDrive();
    LogThis(colors.cyan, 'Done with google drive.');

    // await ProgramCooldown(catarse);

    process.exit(1);
}

async function ProgramCooldown(catarse) {
    LogThis(colors.cyan, "Sleeping... " + new Date());
    await Delay(900);
    await entraCatarse.DownloadCooldown(catarse.browser);
    await googleDrive.UpdateDrive();

    ProgramCooldown();
}

function TesteDoBot() {
    ExitProgram();
}

// TesteDoBot();
InitBot();