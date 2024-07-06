const editJsonFile = require('edit-json-file');
var configsJson = editJsonFile(`${__dirname}/DONT_GIT/configs.json`);
var lastRuntime = configsJson.get('lastRuntime');

console.log("Last runtime => " + lastRuntime);