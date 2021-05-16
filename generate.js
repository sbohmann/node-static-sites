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

const filesWritten = new Set();

function walkDirectory(directory, handleFile) {
  function walkSubdirectories(relativePath) {
    let subDirectory = path.join(directory, relativePath);
    let directory_content = fs.readdirSync(subDirectory);
    console.log(directory_content);
    for (let file of directory_content) {
      const filePath = path.join(directory, relativePath, file);
      const fileInformation = fs.lstatSync(filePath);
      if (fileInformation.isFile(file)) {
        handleFile(filePath, relativePath);
      } else if (fileInformation.isDirectory(file)) {
        walkSubdirectories(path.join(relativePath, file));
      }
    }
  }
  walkSubdirectories("");
}

function generatePages() {
  walkDirectory(source_directory, (filePath, subDirectory) => {
    const pageSuffix = ".page.pug";
    if (filePath.endsWith(pageSuffix)) {
      console.log(
        "Rendering source file [" +
          filePath +
          "] in sub-directory [" +
          subDirectory +
          "]"
      );
      let pugOptions = {};
      const dataPath =
        filePath.substr(0, filePath.length - pageSuffix.length) + ".json";
      if (fs.existsSync(dataPath) && fs.lstatSync(dataPath).isFile()) {
        let rawData = fs.readFileSync(dataPath);
        pugOptions = JSON.parse(rawData);
      }
      pugOptions.basedir = source_directory;
      let prettyOptions = {
        ocd: true,
      };
      console.log(pretty(pug.renderFile(filePath, pugOptions), prettyOptions));
    }
  });
}

function copy_static_content(path) {
  console.log(fs.readdirSync(path));
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
