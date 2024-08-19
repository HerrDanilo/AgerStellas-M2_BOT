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

var key_today = `day${new Date().getDate()}`;
var key_runtimeAmount = `${key_today}.runtimeAmount`;
var key_errorAmount = `${key_today}.errorAmount`;

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
	message: "message"
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
	if (!loggingJson.get(`${key_today}`)) ResetLogFile();
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

function NewError(error) {
	var value_errorAmount = loggingJson.get(key_errorAmount);
	var currentRuntime = GetCurrentRuntime();
	var currentError = `${currentRuntime.key}.errors.error${value_errorAmount}`;

	loggingJson.set(`${currentError}.${errorKeys.time}`, GetTime());
	loggingJson.set(`${currentError}.${errorKeys.message}`, error ? error : "no error specified");
	loggingJson.set(key_errorAmount, ++value_errorAmount);
	loggingJson.save();
}

module.exports = { runtimeKeys, ResetLogFile, GetCurrentLogFile, UpdateCurrentRuntime, NewRuntime, FinishCurrentRuntime, NewError }

//.catch((err) => console.error(err));

/** Exemplo de erro que pode dar com a google api
GaxiosError: Bad Request. User message: "Você está tentando convidar poddighi@yahoo.com.br. Como não há uma Conta do Google associada a esse endereço de e-mail, você precisará selecionar a caixa "Notificar pessoas" para convidar o destinatário."
	at Gaxios._request (E:\Meus_Programas\AgerStellas-M2_BOT\node_modules\gaxios\build\src\gaxios.js:140:23)       
	at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
	at async UserRefreshClient.requestAsync (E:\Meus_Programas\AgerStellas-M2_BOT\node_modules\google-auth-library\build\src\auth\oauth2client.js:382:18)
	at async ShareFolder (E:\Meus_Programas\AgerStellas-M2_BOT\js\googleDrive.js:111:14)
	at async GiveAccessToFolders (E:\Meus_Programas\AgerStellas-M2_BOT\js\googleDrive.js:180:63)
	at async BulkChangeSubsAccess (E:\Meus_Programas\AgerStellas-M2_BOT\js\googleDrive.js:157:34)
	at async Object.InitBot [as UpdateDrive] (E:\Meus_Programas\AgerStellas-M2_BOT\js\googleDrive.js:205:2)        
	at async RepeatBot (E:\Meus_Programas\AgerStellas-M2_BOT\index.js:31:5)
	at async InitBot (E:\Meus_Programas\AgerStellas-M2_BOT\index.js:22:5) {
  response: {
	config: {
	  url: 'https://www.googleapis.com/drive/v3/files/1Je80Ez4LjU8G7W9R9RBHaiTO3p8U4EeC/permissions?sendNotificationEmail=false&fields=%2A',
	  method: 'POST',
	  userAgentDirectives: [Array],
	  paramsSerializer: [Function (anonymous)],
	  data: [Object],
	  headers: [Object],
	  params: [Object],
	  validateStatus: [Function (anonymous)],
	  retry: true,
	  body: '{"role":"reader","type":"user","emailAddress":"poddighi@yahoo.com.br"}',
	  responseType: 'json',
	  retryConfig: [Object]
	},
	data: { error: [Object] },
	headers: {
	  'alt-svc': 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
	  'cache-control': 'private, max-age=0',
	  connection: 'close',
	  'content-encoding': 'gzip',
	  'content-type': 'application/json; charset=UTF-8',
	  date: 'Wed, 14 Aug 2024 16:32:38 GMT',
	  expires: 'Wed, 14 Aug 2024 16:32:38 GMT',
	  server: 'ESF',
	  'transfer-encoding': 'chunked',
	  vary: 'Origin, X-Origin',
	  'x-content-type-options': 'nosniff',
	  'x-frame-options': 'SAMEORIGIN',
	  'x-xss-protection': '0'
	},
	status: 400,
	statusText: 'Bad Request',
	request: {
	  responseURL: 'https://www.googleapis.com/drive/v3/files/1Je80Ez4LjU8G7W9R9RBHaiTO3p8U4EeC/permissions?sendNotificationEmail=false&fields=%2A'
	}
  },
  config: {
	url: 'https://www.googleapis.com/drive/v3/files/1Je80Ez4LjU8G7W9R9RBHaiTO3p8U4EeC/permissions?sendNotificationEmail=false&fields=%2A',
	method: 'POST',
	userAgentDirectives: [ [Object] ],
	paramsSerializer: [Function (anonymous)],
	data: {
	  role: 'reader',
	  type: 'user',
	  emailAddress: 'poddighi@yahoo.com.br'
	},
	headers: {
	  'x-goog-api-client': 'gdcl/6.0.4 gl-node/18.16.0',
	  'Accept-Encoding': 'gzip',
	  'User-Agent': 'google-api-nodejs-client/6.0.4 (gzip)',
	  Authorization: 'Bearer ya29.a0AcM612wVh97RL-g1bDXLicZD4fIHK1bXVL3s3ahbnGEU6b2bFKojKUGosMRWO63mk84nvwewnQwvVH6HyQgoNOd7AoEqyxTxgseqW2qQdDeVASwik_JgihwyvpJlfQDgwefa8lyI-CCOFTXVTLYov38u0xWttIhYKD6xCwaCgYKAW0SARISFQHGX2MiIRAu8FtqB1DResYyg3E3SA0173',
	  'Content-Type': 'application/json',
	  Accept: 'application/json'
	},
	params: { sendNotificationEmail: false, fields: '*' },
	validateStatus: [Function (anonymous)],
	retry: true,
	body: '{"role":"reader","type":"user","emailAddress":"poddighi@yahoo.com.br"}',
	responseType: 'json',
	retryConfig: {
	  currentRetryAttempt: 0,
	  retry: 3,
	  httpMethodsToRetry: [Array],
	  noResponseRetries: 2,
	  statusCodesToRetry: [Array]
	}
  },
  code: 400,
  errors: [
	{
	  message: 'Bad Request. User message: "Você está tentando convidar poddighi@yahoo.com.br. Como não há uma Conta do Google associada a esse endereço de e-mail, você precisará selecionar a caixa "Notificar pessoas" para convidar o destinatário."',
	  domain: 'global',
	  reason: 'invalidSharingRequest'
	}
  ]
}
 */
