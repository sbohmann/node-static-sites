# Setup

    npm install

# Configuration

`configuration.json` contains the following settings:

- `source_directory`: contains the .pug, .json, and .md files from which the pages is generated into the target directory
- `static_content_directory`: contains static content that is copied unchanged to the target directory
- `target_directory`: the target directory to which the generated pages and static are written
- `overwrite_silently`: if true, files in the target directory will be overwritten
- `delete_non_generated_files`: if true, files in the target directory not originating from generation or copying static content

## Risks associated with changing the configuration

When `overwrite_silently` or `delete_non_generated_files` are set to true, files on the machine running
this script will be overwritten / deleted in the target directory. Use with caution. Do not use directories containing
important data as the target directory.

Clone this project into a new, empty folder.

Do not clone this project into an existing folder containing important files.

# Generating the pages

    node generate.js
