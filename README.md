# Invocation

This package provides a CLI. It can be called via the package name ```at.yeoman.static-site```
from your node project after installing this package locally as a dependency.

Example assuming that ```node-static-sites``` and ```your project``` are located within the same directory:

    npm install ../node-static-sites

Inside your package.json, you can then add a script using the CLI. The script's name ```generate``` is arbitrary,
it can be named whatever you like. "nssg" is short for node static site generator:

    "scripts": {
        "generate": "nssg"
    }

Command line arguments for the CLI (see below) can be inserted after the package name:

    "scripts": {
        "generate": "nssg <arguments>"
    }

## Command Line Arguments

At the moment, no command line arguments are accepted.

# Configuration

`configuration.json` contains the following settings:

- `source_directory`: Contains the .pug, .json, and .md files from which the pages is generated into the target directory.
- `static_content_directory`: Contains static content that is copied unchanged to the target directory.
- `target_directory`: The target directory to which generated pages and static content are written.
- `overwrite_silently`: If true, files in the target directory will be overwritten.
- `delete_non_generated_files`: If true, files in the target directory not originating from generation or copying static content will be deleted. Empty directories will be removed as well.

## Risks associated with changing the configuration

When `overwrite_silently` or `delete_non_generated_files` are set to true, files on the machine running
this script will be overwritten / deleted in the target directory. Use with caution. Do not use directories containing
important data as the target directory.

Clone this project into a new, empty folder.

Do not clone this project into an existing folder containing important files.

# Generating the pages

    node generate.js

All with names ending in `.page.pug` files inside the source directory, at any level, will be generated as .html files at the same location relative to the target directory.

Files in the same location of the same name, but with names ending in `.json` instead of `.page.pug` will be read as the source of variables and configuration.

In case the pug configuration value `basedir` is specified, it will be overwritten with the source directory (by default, `./src`) before generating the output.

Example:

    src/books/giraffes.page.pug
    src/books/giraffes.json

`.pug` files not named `.page.pug` will be ignored.

A file named `giraffes.page.json` will not be associated with `giraffes.page.pug`. The suffix `.page.pug` must be replaced with `.json` in order for a configuration file to be associated with a page file.

# Markdown

Markdown is supported, using `markdown-it`.

In order to include a markdown file into a pug file, use the following syntax:

    include:markdown-it <markdown file name>

Example:

    include:markdown-it giraffes.md

# Globals

Global variables are defined in `globals.json`. These values are visible from all `.page.pug` files and their includes.

# Page information

The variables `pageName`, `pageDirectory`, `pagePath`, and `pageRootPath` are visible from all `.page.pug` files and their includes and templates they extend.

Examples:

    a/b/c/example.page.pug

is generated. The page location related values visible to `a/b/c/example.page.pug` are:

    pageName: example
    pageDirectory: a/b/c
    pagePath: a/b/c/example
    pageRootPath: ../../../

`pageRootPath` should ideally only be used when visiting a page in the browser from the local file system is crucial. Relative paths tend to be fragile, and they cause code overhead involved in the templates.
