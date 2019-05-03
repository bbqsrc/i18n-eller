const { getSupport, from } = require("./convertors")
const { format, write } = require("./index")
const validateFile = require("./index").validate
const yaml = require("js-yaml")
const xcodeInit = require("./init/xcode")
const path = require("path")
const fs = require("fs")

async function generate(target, base, langs, options) {
  const gen = require(`./targets/${target}`)
  const data = {}

  const baseLang = base.split("/").pop().split(".")[0]
  data[baseLang] = yaml.safeLoad(fs.readFileSync(base, "utf8"))

  for (const lang of langs) {
    const key = lang.split("/").pop().split(".")[0]
    data[key] = yaml.safeLoad(fs.readFileSync(lang, "utf8"))
  }

  try {
    const out = await gen(baseLang, data, options.output || ".")
    write(options.output || ".", out)
  } catch(err) {
    console.error(err.stack)
    process.exit(1)
  }
}

async function convert(format, base, langs, options) {
  if (!getSupport().from.includes(format)) {
    console.error(`Format ${format} not supported.`)
    console.error(`Supported formats: ${supported.join(", ")}`)
    return
  }

  try {
    const files = await from(format, base, langs, options)
    write(options.output || ".", files)
  } catch(err) {
    console.error(err.stack)
    process.exit(1)
  }
}

function init(target, projectPath, langs) {
  switch (target) {
  case "xcode":
    xcodeInit(projectPath, langs)
    break
  default:
    console.error(`No target found: ${target}`)
    process.exit(1)
  }
}

async function validate(base, langs, options) {
  const data = {}
  const fns = {}

  const baseLang = path.basename(base).split(".")[0]
  data[baseLang] = yaml.safeLoad(fs.readFileSync(path.resolve(base), "utf8"), { json: true }) || {}
  fns[baseLang] = path.resolve(base)

  for (const lang of langs) {
    const key = path.basename(lang).split(".")[0]
    try {
      data[key] = yaml.safeLoad(fs.readFileSync(path.resolve(lang), "utf8"), { json: true }) || {}
    } catch (err) {
      console.error(`Error while processing: ${path.resolve(lang)}`)
      throw err
    }
    fns[key] = path.resolve(lang)
  }

  validateFile(baseLang, data, {
    useSorensenDice: options.fuzzy
  })

  if (options.format) {
    const o = {}

    for (const key in data) {
      o[key] = format(data[baseLang], data[key])
    }

    if (options.output) {
      const ofns = {}

      for (const key in o) {
        ofns[fns[key]] = o[key]
      }

      write(options.output, ofns)
    } else {
      for (const key in o) {
        fs.writeFileSync(fns[key], o[key], "utf8")
      }
    }
  }
}

module.exports = {
  generate,
  convert,
  init,
  validate
}