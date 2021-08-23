#!/usr/local/bin/node

const fs = require("fs")
const path = require("path")
const pug = require("pug")
const pretty = require("pretty")
const configuration = require('./configuration')
const globals = require('./globals')
const walkDirectory = require('./walk_directory')

function generate() {
  let self = initialize()
  createDirectories(self)
  writeFiles(self)
}

function initialize() {
  let self = configuration.read()
  self.globals = globals.read()
  self.filesWritten = new Set()
  return self
}

function createDirectories(self) {
  create_directory(self.source_directory)
  create_directory(self.static_content_directory)
  create_directory(self.target_directory)
}

function create_directory(path) {
  if (!fs.existsSync(path)) {
    console.log("Directory [" + path + "] not found, creating it.")
    fs.mkdirSync(path)
  }
}

function writeFiles(self) {
  generatePages(self)
  copy_static_content(self)
  if (self.delete_non_generated_files) {
    deleteNonGeneratedFiles(self)
  }
}

function generatePages(self) {
  walkDirectory(
    self.source_directory,
    directoryContext => {
      generatePage(self, directoryContext)
    }
  )
}

function generatePage(self, directoryContext) {
  const {fileName, filePath, relativeSubDirectoryPath, relativeRootPath} = directoryContext
  const pageSuffix = ".page.pug"
  if (filePath.endsWith(pageSuffix)) {
    let pugOptions = Object.assign({}, self.globals)
    let pageName = fileName.substr(0, fileName.length - pageSuffix.length)
    let pagePath = path.join(
        relativeSubDirectoryPath,
        fileName.substr(0, fileName.length - pageSuffix.length)
    )
    const dataPath = pagePath + ".json"
    if (fs.existsSync(dataPath) && fs.lstatSync(dataPath).isFile()) {
      let rawData = fs.readFileSync(dataPath)
      Object.assign(pugOptions, JSON.parse(rawData))
    }
    pugOptions.basedir = self.source_directory
    pugOptions.pageName = pageName
    pugOptions.pageDirectory = relativeSubDirectoryPath
    pugOptions.pagePath = path.join(relativeSubDirectoryPath, pageName)
    pugOptions.pageRootPath = relativeRootPath
    let rawOutput = createRawOutput(self, filePath, pugOptions)
    let formattedOutput = prettify(rawOutput)
    writeOutputFile(self, fileName, pageSuffix, relativeSubDirectoryPath, formattedOutput)
  }
}

function createRawOutput(self, filePath, pugOptions) {
  try {
    return pug.renderFile(filePath, pugOptions)
  } catch (error) {
    console.log("Error while processing [" + filePath + "]:")
    console.log(error.message)
    console.log(
        "pug base directory (source directory): [" + self.source_directory + "]"
    )
    process.exit(1)
  }
}

function prettify(rawOutput) {
  return pretty(rawOutput, {
    ocd: true
  })
}

function writeOutputFile(self, fileName, pageSuffix, relativeSubDirectoryPath, formattedOutput) {
  let outputFileName =
      fileName.substr(0, fileName.length - pageSuffix.length) + ".html"
  let outputDirectory = path.join(
      self.target_directory,
      relativeSubDirectoryPath
  )
  let outputPath = path.join(outputDirectory, outputFileName)
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, {recursive: true})
  }
  if (!fs.existsSync(outputPath) || self.overwrite_silently) {
    addFileWritten(self, outputPath)
    fs.writeFileSync(outputPath, formattedOutput)
  } else {
    throw Error("Not overwriting existing file [" + outputPath + "]")
  }
}

function copy_static_content(self) {
  walkDirectory(
    self.static_content_directory,
    directoryContext => {
      const {fileName, filePath, relativeSubDirectoryPath}  = directoryContext
      let outputDirectory = path.join(
        self.target_directory,
        relativeSubDirectoryPath
      )
      let outputPath = path.join(outputDirectory, fileName)
      if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true })
      }
      if (!fs.existsSync(outputPath) || self.overwrite_silently) {
        addFileWritten(self, outputPath)
        fs.copyFileSync(filePath, outputPath)
      } else {
        throw Error("Not overwriting existing file [" + outputPath + "]")
      }
    }
  )
}

function addFileWritten(self, path) {
  if (self.filesWritten.has(path)) {
    throw RangeError("Attempting to write output file twice: [" + path + "]")
  }
  self.filesWritten.add(path)
}

function deleteNonGeneratedFiles(self) {
  function walkSubdirectories(relativeSubDirectoryPath) {
    let subDirectory = path.join(self.target_directory, relativeSubDirectoryPath)
    let directory_content = fs.readdirSync(subDirectory)
    for (let fileName of directory_content) {
      const filePath = path.join(
        self.target_directory,
        relativeSubDirectoryPath,
        fileName
      )
      const fileInformation = fs.lstatSync(filePath)
      if (fileInformation.isFile(filePath)) {
        if (!self.filesWritten.has(filePath)) {
          fs.unlinkSync(filePath)
        }
      } else if (fileInformation.isDirectory()) {
        let subDirectoryPath = path.join(subDirectory, fileName)
        walkSubdirectories(path.join(relativeSubDirectoryPath, fileName))
        if (fs.readdirSync(subDirectoryPath).length === 0) {
          fs.rmdirSync(subDirectoryPath)
        }
      }
    }
  }
  walkSubdirectories("")
}

generate()
