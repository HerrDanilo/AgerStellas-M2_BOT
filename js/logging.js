//#region IMPORTS
const fs = require("fs");
const path = require("path");
const editJsonFile = require("edit-json-file");
const { LogThis, colors, Delay, RandomInt } = require("aranha-commons");
//#endregion

//#region VARIABLES
const packageJson = editJsonFile(path.resolve("./package.json"));
const path_logsFolder = path.resolve("./logs");
var appNameVersion = `${packageJson.get("name")}-${packageJson.get("version")}`;
var configsJson = editJsonFile(path.resolve('./DONT_GIT/configs.json'));
var enableLogs = configsJson.get('enableLogs');

let key_today;
var key_runtimeAmount;
var key_errorAmount;
UpdateKeyToday(true);

let loggingJson = editJsonFile();
//#endregion

const runtimeKeys = {
	initialTime: "initialTime",
	finalTime: "finalTime",
	downloadAttempts: "downloadAttempts",
	execCode: "execCode"
};
const errorKeys = {
	time: "time",
	message: "message",
	where: "where"
}

/**
 * @param {boolean} forceUpdate Whether to force update.
 */
function UpdateKeyToday(forceUpdate) {
	var today = new Date();
	var todayDate = today.getDate();

	if (forceUpdate || today.getHours() == 0 && today.getMinutes() < 20) {
		if (enableLogs) LogThis(colors.green, "Updating key_today for logging.");
		key_today = `day${todayDate}`;
		key_runtimeAmount = `${key_today}.runtimeAmount`;
		key_errorAmount = `${key_today}.errorAmount`;
	}
}

function GetTime() {
	const date = new Date();
	var hours = TwoDigits(date.getHours());
	var minutes = TwoDigits(date.getMinutes());
	var seconds = TwoDigits(date.getSeconds());
	return `${hours}:${minutes}:${seconds}`;
}
function TwoDigits(int) {
	if (int < 10) return `0${int}`;
	else return int;
}

function ResetLogFile() {
	for (let i = 0; i < loggingJson.get(`${key_runtimeAmount}`); i++) {
		loggingJson.unset(`${key_today}.runtime${i}`);
	}
	loggingJson.set(`${key_runtimeAmount}`, 0);
	loggingJson.set(`${key_errorAmount}`, 0);
	loggingJson.save();
}

function CreateLogFile(jsonName) {
	LogThis(colors.green, `Creating log file for ${appNameVersion}`);

	if (!fs.existsSync(path_logsFolder)) {
		fs.mkdirSync(path_logsFolder);
	}

	loggingJson = editJsonFile(`${path_logsFolder}/${jsonName}`);
	ResetLogFile();
}

/** This will try to get the latest log file, if doesn't exist, create a new one. */
function GetCurrentLogFile() {
	var today = new Date();
	const jsonName = `${appNameVersion}_${today.getFullYear()}-${today.getMonth() + 1}.json`;

	var path_logFile = path.resolve(path_logsFolder, jsonName);

	if (fs.existsSync(path_logFile)) loggingJson = editJsonFile(path_logFile);
	else CreateLogFile(jsonName);
}

/** Update the json key from the current runtime.
 * @param {runtimeKeys} jsonKey key to change.
 * @param {*} value value to the key.
 */
function UpdateCurrentRuntime(jsonKey, value) {
	var currentRuntime = GetCurrentRuntime();
	var keyToChange = `${currentRuntime.key}.${jsonKey}`;

	loggingJson.set(keyToChange, value);
	loggingJson.save();
}

//#region RUNTIMES
function GetCurrentRuntime() {
	UpdateKeyToday();
	if (!loggingJson.get(`${key_runtimeAmount}`)) ResetLogFile();
	var value = loggingJson.get(key_runtimeAmount);
	var key = `${key_today}.runtime${value}`;
	return { key, value };
}

function NewRuntime() {
	var currentRuntime = GetCurrentRuntime();
	loggingJson.set(`${currentRuntime.key}.${runtimeKeys.initialTime}`, GetTime());
	loggingJson.set(`${currentRuntime.key}.${runtimeKeys.finalTime}`, "");
	loggingJson.set(`${currentRuntime.key}.${runtimeKeys.execCode}`, "");
	loggingJson.set(`${currentRuntime.key}.${runtimeKeys.downloadAttempts}`, "");
	loggingJson.save();
}

function FinishCurrentRuntime(execCode) {
	var currentRuntime = GetCurrentRuntime();

	loggingJson.set(`${currentRuntime.key}.${runtimeKeys.execCode}`, execCode ? execCode : 200);
	loggingJson.set(`${currentRuntime.key}.${runtimeKeys.finalTime}`, GetTime());
	loggingJson.set(key_runtimeAmount, ++currentRuntime.value);
	loggingJson.save();
}
//#endregion

function NewError(where, error) {
	var value_errorAmount = loggingJson.get(key_errorAmount);
	var currentRuntime = GetCurrentRuntime();
	var currentError = `${currentRuntime.key}.errors.error${value_errorAmount}`;
	var errorString = error.toString();

	loggingJson.set(`${currentError}.${errorKeys.time}`, GetTime());
	loggingJson.set(`${currentError}.${errorKeys.where}`, where ? where : "no path passed.");
	loggingJson.set(`${currentError}.${errorKeys.message}`, error ? errorString : "no error specified.");
	LogThis(colors.red, errorString);
	console.trace();
	loggingJson.set(key_errorAmount, ++value_errorAmount);
	loggingJson.save();
}

module.exports = { runtimeKeys, ResetLogFile, GetCurrentLogFile, UpdateCurrentRuntime, NewRuntime, FinishCurrentRuntime, NewError }
