#!/usr/bin/env node

"use strict"

const program = require("commander")
const fs = require("fs")
const yaml = require("js-yaml")
const { validate, format, write } = require("../lib")
const pkg = require("../package.json")

program
  .version(pkg.version)
  .usage("[options] <base> [langs...]")
  .arguments("<base> [langs...]")
  .option("-f, --format", "Format files")
  .option("-o, --output [dir]", "Desired output path")
  .action((base, langs) => {
    const data = {}

    const fns = {}

    const baseLang = base.split(".")[0]
    data[baseLang] = yaml.safeLoad(fs.readFileSync(base, "utf8"), { json: true })
    fns[baseLang] = base

    for (const lang of langs) {
      const key = lang.split(".")[0]
      data[key] = yaml.safeLoad(fs.readFileSync(lang, "utf8"), { json: true })
      fns[key] = lang
    }

    validate(baseLang, data)

    if (program.format) {
        const o = {}

        for (const key in data) {
            o[key] = format(data[baseLang], data[key])
        }

        if (program.output) {
            const ofns = {}

            for (const key in o) {
                ofns[fns[key]] = o[key]
            }

            write(program.output, ofns)
        } else {
            for (const key in o) {
                fs.writeFileSync(fns[key], o[key], "utf8")
            }
        }
    }
  })
  .parse(process.argv)

if (process.argv.length < 3) {
  program.help()
}
