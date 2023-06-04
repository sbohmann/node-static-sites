#!/usr/bin/env node

if (process.argv.length > 2) {
    console.error("Currently, no command line arguments are supported. Arguments found: ", process.argv.slice(2))
    process.exit(1)
}

const generate = require('./generator/generate')

generate.generate()
