#!/usr/bin/env node

"use strict"

const program = require("commander")
const fs = require("fs")
const yaml = require("js-yaml")
const { validate, format, write } = require("../lib")
const path = require("path")
const pkg = require("../package.json")

program
  .version(pkg.version)
  .usage("[options] <base> [langs...]")
  .arguments("<base> [langs...]")
  .option("-f, --format", "Format files")
  .option("-o, --output [dir]", "Desired output path")
  .option("-s, --fuzzy", "Fuzzy match using Sørensen-Dice coefficient")
  .action((base, langs) => {
    const data = {}

    const fns = {}

    const baseLang = base.split(".")[0]
    data[baseLang] = yaml.safeLoad(fs.readFileSync(path.resolve(base), "utf8"), { json: true }) || {}
    fns[baseLang] = path.resolve(base)

    for (const lang of langs) {
      const key = lang.split(".")[0]
      data[key] = yaml.safeLoad(fs.readFileSync(path.resolve(lang), "utf8"), { json: true }) || {}
      fns[key] = path.resolve(lang)
    }

    validate(baseLang, data, {
        useSørensenDice: program.fuzzy
    })

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
