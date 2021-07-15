const fs = require("fs")
const path = require("path")

module.exports = (directory, handleFile) => {
    function walkSubdirectories(relativeSubDirectoryPath, relativeRootPath) {
        let subDirectory = path.join(directory, relativeSubDirectoryPath)
        let directory_content = fs.readdirSync(subDirectory)
        for (let fileName of directory_content) {
            const filePath = path.join(directory, relativeSubDirectoryPath, fileName)
            const fileInformation = fs.lstatSync(filePath)
            if (fileInformation.isFile(filePath)) {
                handleFile({
                    fileName,
                    filePath,
                    relativeSubDirectoryPath,
                    relativeRootPath
                })
            } else if (fileInformation.isDirectory()) {
                walkSubdirectories(
                    path.join(relativeSubDirectoryPath, fileName),
                    path.join(relativeRootPath, "../")
                )
            }
        }
    }
    walkSubdirectories("", "")
}
