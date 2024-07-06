const editJsonFile = require('edit-json-file');
var configsJson = editJsonFile(`${__dirname}/DONT_GIT/configs.json`);

console.log(configsJson.get('lastRuntime'));