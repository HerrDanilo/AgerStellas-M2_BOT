const fs = require("fs");
const path = require("path");
const logging = require("./logging");
const { LogThis, colors } = require("aranha-commons");

const folders = ["csv", "DONT_GIT", "logs"];

function VerifyFolders() {
    var canContinue = true;
    folders.forEach(folder => {
        const exist = fs.existsSync(path.resolve(folder));
        console.log(`${folder}: ${exist}`);
        if (!exist) {
            switch (folder) {
                case "DONT_GIT":
                    logging.NewError("Folder `DONT_GIT` doesn't exist.");
                    canContinue = false;
                    break;
                default:
                    LogThis(colors.yellow, "Creating folders that were missing.");
                    fs.mkdirSync(path.resolve(folder));
                    break;
            }
        }
    });
    return canContinue;
}

module.exports = { VerifyFolders }