//#region IMPORTS
const path = require("path");
const csv = require("csvtojson");
const fs = require("fs").promises;
const process = require("process");
const { google } = require("googleapis");
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

const TOKEN_PATH = path.join(process.cwd(), "DONT_GIT/token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "DONT_GIT/credentials.json");

let authClient;
//#endregion

let subsJson = editJsonFile(path.resolve('./DONT_GIT/currentSubs.json'), { ignore_dots: false, });
let configsJson = editJsonFile(path.resolve('./DONT_GIT/configs.json'));

//#region GOOGLE METHODS
async function loadSavedCredentialsIfExist() {
	try {
		const content = await fs.readFile(TOKEN_PATH);
		const credentials = JSON.parse(content);
		return google.auth.fromJSON(credentials);
	} catch (err) {
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
	console.log(res.data);
}

async function TransformCsvIntoJson() {
	LogThis(colors.magenta, 'Transforming Csv file to Json.');
	let index = 0;
	const csvFilePath = path.resolve('./csv/Base_de_Assinantes.csv');

	subsJson.empty();

	await csv(
		{
			flatKeys: true,
		},
		{
			objectMode: true,
		}
	)
		.fromFile(csvFilePath)
		.on("data", (data) => {
			subsJson.set(`Assinante${index++}`, data);
			subsJson.save();
			subsJson = editJsonFile(path.resolve('./DONT_GIT/currentSubs.json'), {
				ignore_dots: false,
				autosave: true,
			});
		});
}

function GetSubInfo(jsonKey, debugShow) {
	/* 
	.Nome público (.Email perfil Catarse)
	Assinatura: .Título da recompensa 
	Status: .Status da Assinatura
	*/

	var name = subsJson.get(`${jsonKey}.Nome público`);
	if (name === "") {
		name = subsJson.get(`${jsonKey}.Nome completo`);
	}
	var email = subsJson.get(`${jsonKey}.Email perfil Catarse`);
	var subTier = subsJson.get(`${jsonKey}.Título da recompensa`);
	var status = subsJson.get(`${jsonKey}.Status da Assinatura`);

	var consoleMsg =
		`${name} (${email})\n` + `Assinatura: ${subTier}\n` + `Status: ${status}`;

	if (debugShow) {
		console.log("\n" + consoleMsg);
	}

	return { name, email, subTier, status };
}

function GetFolderIdFromSubTier(subTier) {
	var folder_id = configsJson.get(`folders.${subTier}.id`);
	return folder_id;
}

//#region CHANGING SUBS ACCESS
async function ShareFolder(folder_id, email) {
	const drive = google.drive({ version: "v3", auth: authClient });
	const res = await drive.permissions
		.create({
			requestBody: {
				role: "reader",
				type: "user",
				emailAddress: email,
			},
			fileId: folder_id,
			sendNotificationEmail: false, // TODO: Notificar somente na primeira vez que o usuário é adicionado.
			fields: "*",
		})
		.catch((err) => LogThis(colors.red, err.errors));
	if (res) console.log(`${email} now has access to ${folder_id}`);
}

async function UnshareFolder(folder_id, email) {
	const drive = google.drive({ version: "v3", auth: authClient });
	const emailID = await GetPermissionIdFromEmail(email);
	const res = await drive.permissions.delete({
		fileId: folder_id,
		permissionId: emailID,
	});
	if (res) console.log(`Succesfully deleted ${email}'s access to ${folder_id}`);
}

function ShareOrUnshareFolderToSubs() {
	LogThis(colors.magenta, "Changing sub's access.");
	// TODO: Ainda não está liberando o acesso as pastas certas
	let subInfo;
	let folder_id;
	let subCount = 0;
	let activeCount = 0;
	let inactiveCount = 0;
	let otherCount = 0;
	
	for (var sub in subsJson.read()) {
		subCount++;
		subInfo = GetSubInfo(sub);
		folder_id = GetFolderIdFromSubTier(subInfo.subTier);
		if (subInfo.status == "Ativa") {
			activeCount++;
			LogThis(colors.green, `Giving access of ${folder_id} to ${subInfo.name} (${subInfo.email}) !\n`);
			//ShareFolder(folder_id, subInfo.email); // TODO: Ainda não está liberado para dar o acesso aos assinantes.
		} else if (subInfo.status == "Inativa" || subInfo.status == "Cancelada") {
			inactiveCount++;
			LogThis(colors.red, `Removing access of ${folder_id} from ${subInfo.name} (${subInfo.email}) !\n`);
			//UnshareFolder(folder_id, subInfo.email); // TODO: Ainda não está liberado para retirar o acesso dos assinantes.
		} else {
			otherCount++;
			LogThis(colors.yellow, `!${subInfo.email} has status ${subInfo.status}!\n`);
		}
	}
	console.log("\x1b[0m");
	console.log(`Lifetime sub count: ${subCount}`);
	console.log(`Current active subs: ${activeCount}`);
	console.log(`Inactive subs: ${inactiveCount}`);
	console.log(`Other subs: ${otherCount}`);
}
//#endregion

//#region DUPLICATES
function CheckForDuplicatesSubs() {
	const stringUserID = 'ID do usuário';

	var subsCount = Object.keys(subsJson.toObject()).length;

	for (let i = 0; i < subsCount; i++) {
		var sub1 = `Assinante${i}`;

		for (let j = 0; j < subsCount; j++) {
			var sub2 = `Assinante${j}`;

			if (i == j) { continue; }
			else if (subsJson.get(sub1))

				if (subsJson.get(`${sub1}.${stringUserID}`) == subsJson.get(`${sub2}.${stringUserID}`)) {
					RemoveInactiveSub(sub1, sub2);
				}
		}
	}
	LogThis(colors.cyan, "Duplicates check done!");
}

function RemoveInactiveSub(sub1, sub2) {
	const stringSubStatus = "Status da Assinatura";
	let inactiveSub;

	if (subsJson.get(`${sub1}.${stringSubStatus}`) != "Ativa") {
		inactiveSub = sub1;
	}
	if (subsJson.get(`${sub2}.${stringSubStatus}`) != "Ativa") {
		inactiveSub = sub2;
	}
	// FIXME: E se os dois forem inativos?

	subsJson.unset(`${inactiveSub}`);
	subsJson.save();
	subsJson = editJsonFile(path.resolve('./DONT_GIT/currentSubs.json'), {
		autosave: true,
	});

	LogThis(colors.cyan, `Removed ${inactiveSub} (Duplicate)`);
}
//#endregion

// TODO: Pessoas que trocam de tier mas mantem a assinatura, recebem acesso a pasta nova, mas mantém o acesso a pasta do tier anterior.
// Logo preciso retirar o acesso de todos a todas as pastas, e adicionar depois.
// TODO: Ao adicionar o acesso pros assinantes, adicionar ou retirar o acesso a pasta de recompensas gerais.

exports.UpdateDrive = async function InitBot() {
	LogThis(colors.magenta, 'Updating google drive.');
	await TransformCsvIntoJson();

	LogThis(colors.cyan, 'Checking for duplicates');
	CheckForDuplicatesSubs();

	LogThis(colors.magenta, "Authorizing...");
	authClient = await authorize();
	LogThis(colors.cyan, "Should be autorized.");
	ShareOrUnshareFolderToSubs();
}

//#region UNUSED METHODS
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

	console.log("Files:");
	files.map((file) => {
		console.log(`${file.name} (${file.id})`);
	});
}
//#endregion
