#!/usr/bin/env node

"use strict"

const program = require("commander")
const fs = require("fs")
const yaml = require("js-yaml")
const { write } = require("../lib")

program
  .version("0.2.0")
  .usage("[options] <target> <base> [langs...]")
  .arguments("<target> <base> [langs...]")
  .option("-o, --output [dir]", "Desired output path")
  .action((target, base, langs) => {
    const gen = require(`${__dirname}/../lib/targets/${target}`)
    const data = {}

    const baseLang = base.split(".")[0]
    data[baseLang] = yaml.safeLoad(fs.readFileSync(base, "utf8"))

    for (const lang of langs) {
      const key = lang.split(".")[0]
      data[key] = yaml.safeLoad(fs.readFileSync(lang, "utf8"))
    }

    const out = gen(baseLang, data, program.output || ".")
    write(program.output || ".", out)
  })
  .parse(process.argv)

if (process.argv.length < 3) {
  program.help()
}
