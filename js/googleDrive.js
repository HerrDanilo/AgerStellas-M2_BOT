//#region IMPORTS
const path = require("path");
const fs = require("fs").promises;
const logging = require('./logging.js');
const { google } = require("googleapis");
const subsList = require('./subsList.js');
const editJsonFile = require("edit-json-file");
const { LogThis, colors } = require("aranha-commons");
const { authenticate } = require("@google-cloud/local-auth");
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
async function ShareFolder(folder_id, subInfo, folderName) {
	const drive = google.drive({ version: "v3", auth: authClient });
	const res = await drive.permissions.create({
		requestBody: {
			role: "reader",
			type: "user",
			emailAddress: subInfo.email,
		},
		fileId: folder_id,
		sendNotificationEmail: true,
		fields: "*",
	}).catch((err) => logging.NewError("googleDrive.js > ShareFolder()", err.errors));

	if (res) {
		if (enableLogs) LogThis(colors.green, `${subInfo.email} now has access to ${folderName} (${folder_id})`);
	}
}

async function UnshareFolder(folder_id, subInfo, folderName) {
	const drive = google.drive({ version: "v3", auth: authClient });
	const res = await drive.permissions.delete({
		fileId: folder_id,
		permissionId: await GetPermissionIdFromEmail(subInfo.email),
	}).catch((err) => logging.NewError("googleDrive.js > UnshareFolder()", err.errors));

	if (res) {
		if (enableLogs) LogThis(colors.red, `Succesfully removed ${subInfo.email}'s access to ${folderName} (${folder_id})`);
	}
}

async function BulkChangeSubsAccess() {
	if (enableLogs) LogThis(colors.magenta, "Bulk changing access.");

	for (var sub in subsJson.read()) {
		var subInfo = subsList.GetSubInfo(sub);

		await RemoveAccessFromAllFolders(subInfo, subInfo.status == "Ativa");

		if (subInfo.status == "Ativa") await GiveAccessToFolders(subInfo);
	}
	await UpdateSubsTxtFile();
}

async function RemoveAccessFromAllFolders(subInfo, isActive) {
	for (var folder in configsJson.get('folders')) {
		var folder_ID = configsJson.get(`folders.${folder}.id`);

		if (isActive && (folder == "Recompensas Gerais" ||
						 folder == subInfo.subTier ||
						 folder_ID == configsJson.get(`folders.${subInfo.subTier}.id`)
						)) continue;

		var hasAccess = await UserHasAccessToFolder(subInfo, folder_ID);

		if (hasAccess) await UnshareFolder(folder_ID, subInfo, folder);
	}
}

async function GiveAccessToFolders(subInfo) {
	var generalFolder_ID = configsJson.get('folders.Recompensas Gerais.id');
	var subTierFolder_ID = GetFolderIdFromSubTier(subInfo.subTier);

	if (!await UserHasAccessToFolder(subInfo, generalFolder_ID)) await ShareFolder(generalFolder_ID, subInfo, "Recompensas Gerais");
	if (!await UserHasAccessToFolder(subInfo, subTierFolder_ID)) await ShareFolder(subTierFolder_ID, subInfo, subInfo.subTier);
}

async function UserHasAccessToFolder(subInfo, folder_ID) {
	var sub_permissionId = await GetPermissionIdFromEmail(subInfo.email);
	var hasAccess = false;

	var folderMetadata = (await GetFileMetadataFromID(folder_ID)).permissions;

	folderMetadata.forEach(async (permission) => {
		if (permission.id == sub_permissionId) hasAccess = true;
	});

	return hasAccess;
}
//#endregion

async function UpdateSubsTxtFile() {
	if (enableLogs) LogThis(colors.cyan, "Updating 'Assinantes.txt'...");
	subsList.UpdateSubTxtFile();
	var fileId = configsJson.get("apoiadores.fileId");
	var filePath = path.resolve('./DONT_GIT/Apoiadores.txt');

	const drive = google.drive({ version: "v3", auth: authClient });
	const res = await drive.files.update({
		fileId: `${fileId}`,
		media: {
			mimeType: "text/plain",
			body: (await fs.readFile(filePath)).toString(),
		}
	}).catch((err) => logging.NewError("googleDrive.js > UpdateSubsTxtFile()", err.errors));

	if (res) {
		if (enableLogs) LogThis(colors.green, "Success");
	}
}

exports.UpdateDrive = async function InitBot() {
	if (enableLogs) LogThis(colors.magenta, 'Updating google drive.');

	if (enableLogs) LogThis(colors.cyan, "Authorizing...");
	authClient = await authorize();

	if (enableLogs) LogThis(colors.cyan, "Should be authorized.");
	await BulkChangeSubsAccess();
}

exports.GoogleDriveTest = async function GoogleDriveTest() {
	authClient = await authorize();
	await UpdateSubsTxtFile();
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
	/**
	 * To learn more about the parameters on files.list:
	 * https://developers.google.com/drive/api/guides/search-files#node.js = query parameter
	 */
	const res = await drive.files.list({
		pageSize: 10,
		fields: "nextPageToken, files(id, name)",
		q: "mimeType = 'application/vnd.google-apps.folder'" // Query only folders
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
