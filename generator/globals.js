const fs = require("fs");

function read() {
    let globalsPath = "globals.json";
    if (fs.existsSync(globalsPath)) {
        return readGlobalsFile(globalsPath);
    } else {
        return createGlobalsFile(globalsPath)
    }
}

function readGlobalsFile(globalsPath) {
    return JSON.parse(fs.readFileSync(globalsPath))
}

function createGlobalsFile(globalsPath) {
    console.log("File [" + globalsPath + "] not found, creating it.");
    let globals = {};
    fs.writeFileSync(globalsPath, JSON.stringify(globals, null, 2));
    return globals;
}

exports.read = read
