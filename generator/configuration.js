const fs = require("fs")

const configurationPath = "configuration.json"

function read() {
    if (fs.existsSync(configurationPath)) {
        return readConfigurationFile()
    } else {
        return createConfigurationFile()
    }
}

function readConfigurationFile() {
    const raw_configuration = fs.readFileSync(configurationPath)
    return JSON.parse(raw_configuration)
}

function createConfigurationFile() {
    console.log("File [" + configurationPath + "] not found, creating it.")
    let configuration = freshConfiguration()
    fs.writeFileSync(configurationPath, JSON.stringify(configuration, null, 2))
    return configuration
}

function freshConfiguration() {
    return {
        source_directory: "src",
        static_content_directory: "static",
        target_directory: "target",
        overwrite_silently: false,
        delete_non_generated_files: false
    }
}

exports.read = read
