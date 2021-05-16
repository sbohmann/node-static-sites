#!/usr/local/bin/node

const fs = require("fs");
const path = require("path");
const pug = require("pug");
const pretty = require("pretty");

function read_configuration() {
  const raw_configuration = fs.readFileSync("configuration.json");
  return JSON.parse(raw_configuration);
}

const {
  source_directory,
  static_content_directory,
  target_directory,
  overwrite_silently,
  delete_non_generated_files,
} = read_configuration();

const globals = JSON.parse(fs.readFileSync("globals.json"));

const filesWritten = new Set();

function addFileWritten(path) {
  if (filesWritten.has(path)) {
    throw RangeError("Attempting to write output file twice: [" + path + "]");
  }
  filesWritten.add(path);
}

function walkDirectory(directory, handleFile) {
  function walkSubdirectories(relativeSubDirectoryPath) {
    let subDirectory = path.join(directory, relativeSubDirectoryPath);
    let directory_content = fs.readdirSync(subDirectory);
    console.log(directory_content);
    for (let fileName of directory_content) {
      const filePath = path.join(directory, relativeSubDirectoryPath, fileName);
      const fileInformation = fs.lstatSync(filePath);
      if (fileInformation.isFile(filePath)) {
        handleFile(fileName, filePath, relativeSubDirectoryPath);
      } else if (fileInformation.isDirectory()) {
        walkSubdirectories(path.join(relativeSubDirectoryPath, fileName));
      }
    }
  }
  walkSubdirectories("");
}

function generatePages() {
  walkDirectory(
    source_directory,
    (fileName, filePath, relativeSubDirectoryPath) => {
      const pageSuffix = ".page.pug";
      if (filePath.endsWith(pageSuffix)) {
        let pugOptions = Object.assign({}, globals);
        let pageName = filePath.substr(0, filePath.length - pageSuffix.length);
        const dataPath = pageName + ".json";
        if (fs.existsSync(dataPath) && fs.lstatSync(dataPath).isFile()) {
          let rawData = fs.readFileSync(dataPath);
          Object.assign(pugOptions, JSON.parse(rawData));
        }
        pugOptions.basedir = source_directory;
        pugOptions.pageName = pageName;
        pugOptions.pageDirectory = relativeSubDirectoryPath;
        pugOptions.pagePath = path.join(relativeSubDirectoryPath, pageName);
        let prettyOptions = {
          ocd: true,
        };
        let rawOutput = pug.renderFile(filePath, pugOptions);
        let formattedOutput = pretty(rawOutput, prettyOptions);
        let outputFileName =
          fileName.substr(0, fileName.length - pageSuffix.length) + ".html";
        let outputDirectory = path.join(
          target_directory,
          relativeSubDirectoryPath
        );
        let outputPath = path.join(outputDirectory, outputFileName);
        if (!fs.existsSync(outputDirectory)) {
          fs.mkdirSync(outputDirectory, { recursive: true });
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
        fs.mkdirSync(outputDirectory, { recursive: true });
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
    console.log(directory_content);
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
