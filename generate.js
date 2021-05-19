#!/usr/local/bin/node

const fs = require("fs");
const path = require("path");
const pug = require("pug");
const pretty = require("pretty");

function readConfiguration() {
  let configurationPath = "configuration.json";
  if (fs.existsSync(configurationPath)) {
    const raw_configuration = fs.readFileSync(configurationPath);
    return JSON.parse(raw_configuration);
  } else {
    console.log("File [" + configurationPath + "] not found, creating it.");
    let configuration = {
      source_directory: "src",
      static_content_directory: "static",
      target_directory: "target",
      overwrite_silently: false,
      delete_non_generated_files: false,
    };
    fs.writeFileSync(configurationPath, JSON.stringify(configuration, null, 2));
    return configuration;
  }
}

const {
  source_directory,
  static_content_directory,
  target_directory,
  overwrite_silently,
  delete_non_generated_files,
} = readConfiguration();

function readGlobals() {
  let globalsPath = "globals.json";
  if (fs.existsSync(globalsPath)) {
    return JSON.parse(fs.readFileSync(globalsPath));
  } else {
    console.log("File [" + globalsPath + "] not found, creating it.");
    let globals = {};
    fs.writeFileSync(globalsPath, JSON.stringify(globals, null, 2));
    return globals;
  }
}

const globals = readGlobals();

const filesWritten = new Set();

function addFileWritten(path) {
  if (filesWritten.has(path)) {
    throw RangeError("Attempting to write output file twice: [" + path + "]");
  }
  filesWritten.add(path);
}

function walkDirectory(directory, handleFile) {
  function walkSubdirectories(relativeSubDirectoryPath, relativeRootPath) {
    let subDirectory = path.join(directory, relativeSubDirectoryPath);
    let directory_content = fs.readdirSync(subDirectory);
    for (let fileName of directory_content) {
      const filePath = path.join(directory, relativeSubDirectoryPath, fileName);
      const fileInformation = fs.lstatSync(filePath);
      if (fileInformation.isFile(filePath)) {
        handleFile(
          fileName,
          filePath,
          relativeSubDirectoryPath,
          relativeRootPath
        );
      } else if (fileInformation.isDirectory()) {
        walkSubdirectories(
          path.join(relativeSubDirectoryPath, fileName),
          path.join(relativeRootPath, "../")
        );
      }
    }
  }
  walkSubdirectories("", "");
}

function generatePages() {
  walkDirectory(
    source_directory,
    (fileName, filePath, relativeSubDirectoryPath, relativeRootPath) => {
      const pageSuffix = ".page.pug";
      if (filePath.endsWith(pageSuffix)) {
        let pugOptions = Object.assign({}, globals);
        let pageName = fileName.substr(0, fileName.length - pageSuffix.length);
        let pagePath = path.join(
          relativeSubDirectoryPath,
          fileName.substr(0, fileName.length - pageSuffix.length)
        );
        const dataPath = pagePath + ".json";
        if (fs.existsSync(dataPath) && fs.lstatSync(dataPath).isFile()) {
          let rawData = fs.readFileSync(dataPath);
          Object.assign(pugOptions, JSON.parse(rawData));
        }
        pugOptions.basedir = source_directory;
        pugOptions.pageName = pageName;
        pugOptions.pageDirectory = relativeSubDirectoryPath;
        pugOptions.pagePath = path.join(relativeSubDirectoryPath, pageName);
        pugOptions.pageRootPath = relativeRootPath;
        let prettyOptions = {
          ocd: true,
        };
        let rawOutput;
        try {
          rawOutput = pug.renderFile(filePath, pugOptions);
        } catch (error) {
          console.log("Error while processing [" + filePath + "]:");
          console.log(error.message);
          console.log(
            "pug base directory (source directory): [" + source_directory + "]"
          );
          process.exit(1);
        }
        let formattedOutput = pretty(rawOutput, prettyOptions);
        let outputFileName =
          fileName.substr(0, fileName.length - pageSuffix.length) + ".html";
        let outputDirectory = path.join(
          target_directory,
          relativeSubDirectoryPath
        );
        let outputPath = path.join(outputDirectory, outputFileName);
        if (!fs.existsSync(outputDirectory)) {
          create_directory(outputDirectory, { recursive: true });
        }
        if (!fs.existsSync(outputPath) || overwrite_silently) {
          addFileWritten(outputPath);
          fs.writeFileSync(outputPath, formattedOutput);
        } else {
          console.log("Not overwriting existing file [" + outputPath + "]");
        }
      }
    }
  );
}

function copy_static_content() {
  walkDirectory(
    static_content_directory,
    (fileName, filePath, relativeSubDirectoryPath) => {
      let outputDirectory = path.join(
        target_directory,
        relativeSubDirectoryPath
      );
      let outputPath = path.join(outputDirectory, fileName);
      if (!fs.existsSync(outputDirectory)) {
        create_directory(outputDirectory, { recursive: true });
      }
      if (!fs.existsSync(outputPath) || overwrite_silently) {
        addFileWritten(outputPath);
        fs.copyFileSync(filePath, outputPath);
      } else {
        console.log("Not overwriting existing file [" + outputPath + "]");
      }
    }
  );
}

function deleteNonGeneratedFiles() {
  function walkSubdirectories(relativeSubDirectoryPath) {
    let subDirectory = path.join(target_directory, relativeSubDirectoryPath);
    let directory_content = fs.readdirSync(subDirectory);
    for (let fileName of directory_content) {
      const filePath = path.join(
        target_directory,
        relativeSubDirectoryPath,
        fileName
      );
      const fileInformation = fs.lstatSync(filePath);
      if (fileInformation.isFile(filePath)) {
        if (!filesWritten.has(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else if (fileInformation.isDirectory()) {
        let subDirectoryPath = path.join(subDirectory, fileName);
        walkSubdirectories(path.join(relativeSubDirectoryPath, fileName));
        if (fs.readdirSync(subDirectoryPath).length == 0) {
          fs.rmdirSync(subDirectoryPath);
        }
      }
    }
  }
  walkSubdirectories("");
}

function create_directory(path) {
  if (!fs.existsSync(path)) {
    console.log("Directory [" + path + "] not found, creating it.");
    fs.mkdirSync(path);
  }
}

create_directory(source_directory);
create_directory(static_content_directory);
create_directory(target_directory);

generatePages(source_directory);
copy_static_content(static_content_directory);
if (delete_non_generated_files) {
  deleteNonGeneratedFiles();
}
