//#region IMPORTS
const fs = require('fs');
const path = require("path");
const csv = require("csvtojson");
const logging = require('./logging.js');
const { Delay, LogThis, colors } = require('aranha-commons');
const editJsonFile = require('edit-json-file');
//#endregion

//#region GLOBAL VARIABLES
// Paths
const currentSubsPath = path.resolve('./DONT_GIT/currentSubs.json');
const csvFilePath = path.resolve('./csv/Base_de_Assinantes.csv');
const txtFilePath = path.resolve('./DONT_GIT/Apoiadores.txt');

// Json files
let subsJson = editJsonFile(currentSubsPath, { ignore_dots: false, });
let configsJson = editJsonFile(path.resolve('./DONT_GIT/configs.json'));

// Others
const csvDownloadPath = path.resolve("./csv");
var enableLogs = configsJson.get('enableLogs');
//#endregion

//#region CSV => JSON
async function CSVToJson() {
	await RemoveOldCSV();
	await Delay(2.5, enableLogs);
	RenameCSV();

	await TransformCsvIntoJson();
}

function RenameCSV() {
	if (!fs.existsSync(`${csvDownloadPath}/Base_de_Assinantes.csv`)) {
		if (enableLogs) LogThis(colors.magenta, 'Renaming newer CSV file.');
		var fileToRename = fs.readdirSync(csvDownloadPath)[0];
		fs.rename(`${csvDownloadPath}/${fileToRename}`, `${csvDownloadPath}/Base_de_Assinantes.csv`, function (error) {
			if (error) logging.NewError("subsList.js > RenameCSV()", error);
		});
	}
}

async function RemoveOldCSV() {
	var csvFolder = fs.readdirSync(csvDownloadPath);
	if (csvFolder.length > 1) {
		if (enableLogs) LogThis(colors.magenta, 'Removing older CSV file.');
		var csvToRemove = path.resolve(`${csvDownloadPath}/Base_de_Assinantes.csv`);
		if (fs.existsSync(csvToRemove)) fs.unlinkSync(csvToRemove);
	}
}

async function TransformCsvIntoJson() {
	if (enableLogs) LogThis(colors.magenta, 'Transforming Csv file to Json.');
	
	let index = 0;

	subsJson.empty();

	try {
		await csv(
			{ flatKeys: true, },
			{ objectMode: true, }
		)
			.fromFile(csvFilePath)
			.on("data", (data) => {
				subsJson.set(`Assinante${index++}`, data);
				subsJson.save();
				subsJson = editJsonFile(currentSubsPath, {
					ignore_dots: false,
					autosave: true,
				});
			});
	} catch (error) { logging.NewError("subsList.js > TransformCsvIntoJson()", error); }
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
	if (enableLogs) LogThis(colors.cyan, "Duplicates check done!");
}

function RemoveInactiveSub(sub1, sub2) {
	const stringSubStatus = "Status da Assinatura";
	let inactiveSub;

	if (subsJson.get(`${sub1}.${stringSubStatus}`) != "Ativa") inactiveSub = sub1;
	if (subsJson.get(`${sub2}.${stringSubStatus}`) != "Ativa") inactiveSub = sub2;

	// Se as duas entradas forem inativas, deixa aquela com o último pagamento mais recente.
	if (subsJson.get(`${sub1}.${stringSubStatus}`) != "Ativa" && subsJson.get(`${sub2}.${stringSubStatus}`) != "Ativa") {
		var sub1Payment = GetLastPayment(sub1);
		var sub2Payment = GetLastPayment(sub2);

		if (sub1Payment < sub2Payment) inactiveSub = sub1;
		if (sub2Payment < sub1Payment) inactiveSub = sub2;
	}

	subsJson.unset(`${inactiveSub}`);
	subsJson.save();
	subsJson = editJsonFile(currentSubsPath, {
		autosave: true,
	});

	if (enableLogs) LogThis(colors.cyan, `Removed ${inactiveSub} (Duplicate)`);
}

function GetLastPayment(sub) {
	const lastPaymentKey = "Data de confirmação da última cobrança";

	var subPayment = subsJson.get(`${sub}.${lastPaymentKey}`);
	var subData = subPayment.split(' ');
	subData = subData[0].split('/');
	var dia = subData[0], mes = subData[1], ano = subData[2];
	var lastPaymentDate = new Date(ano, --mes, dia);

	return lastPaymentDate;
}
//#endregion

function GetSubInfo(sub, debugShow) {
	/* 
	.Nome público (.Email perfil Catarse)
	Assinatura: .Título da recompensa 
	Status: .Status da Assinatura
	*/

	var publicName = subsJson.get(`${sub}.Nome público`);
	var completeName = subsJson.get(`${sub}.Nome completo`);
	if (publicName === "") publicName = completeName;
	var email = subsJson.get(`${sub}.Email perfil Catarse`);
	var subTier = subsJson.get(`${sub}.Título da recompensa`);
	var status = subsJson.get(`${sub}.Status da Assinatura`);
	var catarseId = subsJson.get(`${sub}.ID do usuário`);
	var isAnonymous = subsJson.get(`${sub}.Anônimo`);
	if (isAnonymous == "não") isAnonymous = false;
	else if (isAnonymous == "sim") isAnonymous = true;

	var consoleMsg =
		`${publicName} (${email})\n` + `Assinatura: ${subTier}\n` + `Status: ${status}`;

	if (debugShow && enableLogs) {
		console.log("\n" + consoleMsg);
	}

	return { name: publicName, completeName, email, subTier, status, catarseId, isAnonymous };
}

async function UpdateSubsList() {
	if (enableLogs) LogThis(colors.magenta, "Updating subs list.");

	// Handle CSV
	if (enableLogs) LogThis(colors.cyan, 'Transforming CSV => JSON');
	await CSVToJson();

	// Handle duplicates
	if (enableLogs) LogThis(colors.cyan, 'Checking for duplicates');
	CheckForDuplicatesSubs();
}

async function UpdateSubTxtFile() {
	let txtContent = [];
	for (const sub in subsJson.read()) {
		let subInfo = GetSubInfo(sub);
		if (subInfo.status != "Ativa") continue;
		var name = `${subInfo.completeName.toUpperCase()}`;

		if (subInfo.isAnonymous) name += '_';
		if (subInfo.subTier == "Braço de Ouro" || subInfo.subTier == "Braço Mágico") {
			name += '*';
		}
		txtContent.push(name);
	}
	txtContent = txtContent.sort().join('\n');

	fs.writeFileSync(txtFilePath, txtContent.toString());
}

module.exports = { GetSubInfo, UpdateSubsList, UpdateSubTxtFile }