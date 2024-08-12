//#region IMPORTS
const fs = require('fs');
const path = require("path");
const csv = require("csvtojson");
const { Delay, LogThis, colors } = require('aranha-commons');
const editJsonFile = require('edit-json-file');
//#endregion

//#region GLOBAL VARIABLES
// Paths
const currentSubsPath = path.resolve('./DONT_GIT/currentSubs.json');
const csvFilePath = path.resolve('./csv/Base_de_Assinantes.csv');

// Json files
let subsJson = editJsonFile(currentSubsPath, { ignore_dots: false, });
let configsJson = editJsonFile(path.resolve('./DONT_GIT/configs.json'));

// Others
const csvDownloadPath = path.resolve("./csv");
var enableLogs = configsJson.get('enableLogs');
//#endregion

//#region CSV => JSON
async function CSVToJson() {
	await RemoveAndRenameCSVFile();
	await TransformCsvIntoJson();
}

async function RemoveAndRenameCSVFile() {
	if (enableLogs) LogThis(colors.magenta, 'Removing older CSV file.');
	var csvToRemove = path.resolve(`${csvDownloadPath}/Base_de_Assinantes.csv`);
	if (fs.existsSync(csvToRemove)) fs.unlinkSync(csvToRemove);

	await Delay(5, enableLogs);

	if (enableLogs) LogThis(colors.magenta, 'Renaming newer CSV file.');
	var fileToRename = fs.readdirSync(csvDownloadPath)[0];
	fs.rename(`${csvDownloadPath}/${fileToRename}`, `${csvDownloadPath}/Base_de_Assinantes.csv`, function (err) {
		if (err) LogThis(colors.red, 'ERROR: ' + err);
	});
}

async function TransformCsvIntoJson() {
	if (enableLogs) LogThis(colors.magenta, 'Transforming Csv file to Json.');
	/* FIXME: Houve um erro logo após esse `LogThis`.
	 * Message: "File does not exist. Check to make sure the file path to your csv is correct."
	 */
	let index = 0;

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
			subsJson = editJsonFile(currentSubsPath, {
				ignore_dots: false,
				autosave: true,
			});
		});
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

exports.GetSubInfo = function GetSubInfo(sub, debugShow) {
	/* 
	.Nome público (.Email perfil Catarse)
	Assinatura: .Título da recompensa 
	Status: .Status da Assinatura
	*/

	var name = subsJson.get(`${sub}.Nome público`);
	if (name === "") {
		name = subsJson.get(`${sub}.Nome completo`);
	}
	var email = subsJson.get(`${sub}.Email perfil Catarse`);
	var subTier = subsJson.get(`${sub}.Título da recompensa`);
	var status = subsJson.get(`${sub}.Status da Assinatura`);
	var catarseId = subsJson.get(`${sub}.ID do usuário`)

	var consoleMsg =
		`${name} (${email})\n` + `Assinatura: ${subTier}\n` + `Status: ${status}`;

	if (debugShow && enableLogs) {
		console.log("\n" + consoleMsg);
	}

	return { name, email, subTier, status, catarseId };
}

exports.UpdateSubsList = async function UpdateSubsList() {
	if (enableLogs) LogThis(colors.magenta, "Updating subs list.");

	// Handle CSV
	if (enableLogs) LogThis(colors.cyan, 'Transforming CSV => JSON');
	await CSVToJson();

	// Handle duplicates
	if (enableLogs) LogThis(colors.cyan, 'Checking for duplicates');
	CheckForDuplicatesSubs();
}
