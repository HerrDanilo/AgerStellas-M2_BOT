//#region IMPORTS
const path = require("path");
const fs = require("fs").promises;
const { google } = require("googleapis");
const editJsonFile = require("edit-json-file");
const { LogThis, colors } = require("aranha-commons");
const { authenticate } = require("@google-cloud/local-auth");
const subsList = require('./subsList.js');
//#endregion

//#region GOOGLE API VARIABLES

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/drive"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

const TOKEN_PATH = path.join(path.resolve('./DONT_GIT/token.json'));
const CREDENTIALS_PATH = path.join(path.resolve('./DONT_GIT/credentials.json'));

let authClient;
//#endregion

let subsNotificationJson = editJsonFile(path.resolve('./DONT_GIT/subsNotification.json'));
let subsJson = editJsonFile(path.resolve('./DONT_GIT/currentSubs.json'), { ignore_dots: false, });
let configsJson = editJsonFile(path.resolve('./DONT_GIT/configs.json'));
var enableLogs = configsJson.get('enableLogs');

//#region GOOGLE METHODS
async function loadSavedCredentialsIfExist() {
	try {
		const content = await fs.readFile(TOKEN_PATH);
		const credentials = JSON.parse(content);
		return google.auth.fromJSON(credentials);
	} catch (err) {
		console.log("deu erro ao carregar as credenciais existentes.");
		return null;
	}
}

async function saveCredentials(client) {
	const content = await fs.readFile(CREDENTIALS_PATH);
	const keys = JSON.parse(content);
	const key = keys.installed || keys.web;
	const payload = JSON.stringify({
		type: "authorized_user",
		client_id: key.client_id,
		client_secret: key.client_secret,
		refresh_token: client.credentials.refresh_token,
	});
	await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
	let client = await loadSavedCredentialsIfExist();
	if (client) {
		console.log("já tem o cliente.");
		return client;
	}
	client = await authenticate({
		scopes: SCOPES,
		keyfilePath: CREDENTIALS_PATH,
	});
	if (client.credentials) {
		await saveCredentials(client);
	}
	return client;
}
//#endregion

async function GetPermissionIdFromEmail(email) {
	const drive = google.drive({ version: "v2", auth: authClient });
	const res = await drive.permissions.getIdForEmail({
		email: email,
	});
	return res.data.id;
}

async function GetFileMetadataFromID(file_id) {
	const drive = google.drive({ version: "v3", auth: authClient });
	const res = await drive.permissions.list({
		fileId: file_id,
		fields: "permissions(id,role,emailAddress,displayName)",
	});
	return res.data;
}

function GetFolderIdFromSubTier(subTier) {
	var folder_id = configsJson.get(`folders.${subTier}.id`);
	return folder_id;
}

//#region SUB NOTIFICATION
function HasBeenNotified(subId) {
	if (subsNotificationJson.get(`${subId}`) != undefined) {
		return subsNotificationJson.get(`${subId}`);
	}
}
function AddToNotificationJson(subId) {
	if (subsNotificationJson.get(`${subId}`) == undefined) {
		subsNotificationJson.set(`${subId}`, false);
		subsNotificationJson.save();
	}
}
//#endregion

//#region CHANGING SUBS ACCESS
async function ShareFolder(folder_id, subInfo) {
	const drive = google.drive({ version: "v3", auth: authClient });
	const res = await drive.permissions.create({
		requestBody: {
			role: "reader",
			type: "user",
			emailAddress: subInfo.email,
		},
		fileId: folder_id,
		sendNotificationEmail: false, // TODO: Notificar somente na primeira vez que o usuário é adicionado.
		fields: "*",
	}).catch((err) => console.error(err.errors));

	if (res) {
		if (enableLogs) LogThis(colors.green, `${subInfo.name} now has access to ${folder_id}`);
	}
}

async function UnshareFolder(folder_id, email) {
	const drive = google.drive({ version: "v3", auth: authClient });
	const res = await drive.permissions.delete({
		fileId: folder_id,
		permissionId: await GetPermissionIdFromEmail(email),
	}).catch((err) => console.error(err.errors));

	if (res) {
		if (enableLogs) LogThis(colors.red, `Succesfully removed ${email}'s access to ${folder_id}`);
	}
}

async function BulkChangeSubsAccess() { // TODO: Ainda não está liberado para mudar o acesso das pastas.
	if (enableLogs) LogThis(colors.magenta, "Bulk changing access.");

	for (var sub in subsJson.read()) {
		var subInfo = subsList.GetSubInfo(sub);

		// TODO: Ainda não pode retirar o acesso as pastas!
		await RemoveAccessFromAllFolders(subInfo, subInfo.status == "Ativa");

		// TODO: Ainda não pode liberar o acesso as pastas!
		if (subInfo.status == "Ativa") await GiveAccessToFolders(subInfo);
	}
}

async function RemoveAccessFromAllFolders(subInfo, isActive) {
	var sub_permissionId = await GetPermissionIdFromEmail(subInfo.email);
	let hasAccess;
	for (var folder in configsJson.get('folders')) {
		hasAccess = false;
		var folder_ID = configsJson.get(`folders.${folder}.id`);

		if (isActive && (folder == "Recompensas Gerais" || folder == subInfo.subTier)) continue;

		var folderMetadata = (await GetFileMetadataFromID(folder_ID)).permissions;

		folderMetadata.forEach(async (permission) => {
			if (permission.id == sub_permissionId) hasAccess = true;
		});
		if (hasAccess) await UnshareFolder(folder_ID, subInfo.email);
	}
}

async function GiveAccessToFolders(subInfo) {
	var generalFolder_ID = configsJson.get('folders.Recompensas Gerais.id');
	var subTierFolder_ID = GetFolderIdFromSubTier(subInfo.subTier);

	await ShareFolder(generalFolder_ID, subInfo);
	await ShareFolder(subTierFolder_ID, subInfo);
}
//#endregion

exports.UpdateDrive = async function InitBot() {
	if (enableLogs) LogThis(colors.magenta, 'Updating google drive.');

	if (enableLogs) LogThis(colors.cyan, "Authorizing...");
	authClient = await authorize();

	if (enableLogs) LogThis(colors.cyan, "Should be autorized.");
	await BulkChangeSubsAccess();
}

exports.GoogleDriveTest = async function GoogleDriveTest() {
	authClient = await authorize();
}

//#region UNUSED METHODS
async function ListAllFoldersPermissions() {
	for (var folder in configsJson.get('folders')) {
		console.log(`\n-------${folder}:`);
		console.log((await GetFileMetadataFromID(configsJson.get(`folders.${folder}.id`))).permissions);
	}
}

async function ListFiles() {
	const drive = google.drive({ version: "v3", auth: authClient });
	const res = await drive.files.list({
		pageSize: 10,
		fields: "nextPageToken, files(id, name)",
	});
	const files = res.data.files;
	if (files.length === 0) {
		console.log("No files found.");
		return;
	}

	if (enableLogs) {
		console.log("Files:");
		files.map((file) => {
			console.log(`${file.name} (${file.id})`);
		});
	}
}
//#endregion
