//#region IMPORTS
const editJsonFile = require('edit-json-file');
const entraCatarse = require('./js/entraCatarse.js');
const googleDrive = require('./js/googleDrive.js');
const subsList = require('./js/subsList.js');
const { Delay, LogThis, colors } = require('aranha-commons');
//#endregion

//#region GLOBAL VARIABLES
var configsJson = editJsonFile(`${__dirname}/DONT_GIT/configs.json`);
var enableLogs = configsJson.get('enableLogs');
//#endregion

async function InitBot() {
    if (enableLogs) LogThis(colors.green, "Program is starting! - " + new Date());

    SaveLastRuntime();

    var catarse = await entraCatarse.StartCatarse();
    if (enableLogs) LogThis(colors.cyan, 'Done with catarse.');
    
    await RepeatBot();

    await ProgramCooldown(catarse);
}

async function RepeatBot() {
    await subsList.UpdateSubsList();
    if (enableLogs) LogThis(colors.cyan, 'Finished updating the subs list.');
    
    await googleDrive.UpdateDrive();
    if (enableLogs) LogThis(colors.cyan, 'Done with google drive.');
}

async function ProgramCooldown(catarse) {
    if (enableLogs) LogThis(colors.cyan, "Sleeping... " + new Date());
    await Delay(600, enableLogs);
    await entraCatarse.DownloadCooldown(catarse.browser);
    await RepeatBot();

    ProgramCooldown(catarse);
}

function SaveLastRuntime() {
    var lastRuntime = new Date();
    LogThis(colors.green, `Saving lastRuntime at ${lastRuntime}`);
    configsJson.set('lastRuntime', lastRuntime);
    configsJson.save();
}

InitBot();