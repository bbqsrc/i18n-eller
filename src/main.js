#!/usr/bin/env node

const yargs = require("yargs")
const cli = require("./cli")

yargs
  .command("generate <target> <base> [langs..]", "Generate target-specific string handlers.", (yargs) => {
    yargs
      .positional("target", {
        describe: "The target platform"
      })
      .positional("base", {
        describe: "The base language file (yaml)"
      })
      .positional("langs", {
        describe: "The other languages files (yaml)"
      })
      .option("output", {
        alias: "o",
        describe: "Desired output path",
        default: "."
      })
  }, (args) => {
    cli.generate(args.target, args.base, args.langs, args)
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err.stack)
        process.exit(1)
      })
  })
  .command("import <format> <base> [langs..]", "Import yaml files from other formats (such as XLIFF).", (yargs) => {
    yargs
      .positional("format", {
        describe: "The input format"
      })
      .positional("base", {
        describe: "The base language file"
      })
      .positional("langs", {
        describe: "The other languages files"
      })
      .option("output", {
        alias: "o",
        describe: "Desired output path",
        default: "."
      })
      .option("normalise", {
        alias: "n",
        describe: "Normalise keys to camel case format",
        type: "boolean"
      })
  }, (args) => {
    cli.convert(args.format, args.base, args.langs, args)
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err.stack)
        process.exit(1)
      })
  })
  .command("init <subcommand> ...", "Initialise localisation files for specific project types.", (yargs) => {
    yargs
      .command("xcode <project> <langs..>", "Initialises language files for Xcode projects", (yargs) => {
        yargs
          .positional("project", {
            describe: "The path to the .xcodeproj file to be initialised",
            type: "string"
          })
          .positional("langs", {
            describe: "The languages to be added to the project (starting with the base language)"
          })
      }, (args) => {
        cli.init("xcode", args.project, args.langs)
      })
      .demandCommand(1)
      .help()
  })
  .command("validate <base> [langs..]", "Validate and/or format various aspects of the yaml language files.", (yargs) => {
    yargs
      .positional("base", {
        describe: "The base language file (yaml)"
      })
      .positional("langs", {
        describe: "The other languages files (yaml)"
      })
      .option("output", {
        alias: "o",
        describe: "Desired output path",
        default: "."
      })
      .option("format", {
        alias: "f",
        describe: "Format files",
        type: "boolean"
      })
      .option("fuzzy", {
        alias: "s",
        describe: "Fuzzy match using Sørensen-Dice coefficient",
        type: "boolean"
      })
  }, (args) => {
    cli.validate(args.base, args.langs, args)
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err.stack)
        process.exit(1)
      })
  })
  .demandCommand(1)
  .help()
  .showHelpOnFail()
  .wrap(null)
  .argv
