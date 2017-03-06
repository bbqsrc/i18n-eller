"use strict"

const parser = require('intl-messageformat-parser')
const debug = require("debug")("strut-icu")
const fs = require("fs")
const path = require("path")
const _ = require("lodash")
const nunjucks = require("nunjucks")
const yaml = require("js-yaml")

const indentString = (str, count, indent) => str.replace(/^/mg, indent.repeat(count));

function mkdirSync(dirpath) {
  try {
    fs.mkdirSync(dirpath)
  } catch (e) {
    if (e.code !== "EEXIST") {
      throw e
    }
  }
}

function mkdirpSync(dirpath) {
  const parts = dirpath.split(path.sep)

  for (let i = 1; i <= parts.length; ++i) {
    mkdirSync(path.join.apply(null, parts.slice(0, i)))
  }
}

class StringsProcessor {
  constructor(outputPath) {
    this.outputPath = outputPath
  }

  process(inputFile) {

  }

  outputForLanguage(langCode) {

  }
}

class ICUParser {
  constructor() {
    this.reset()
  }

  reset() {
    this.o = {
      other: []
    }
  }

  onMessageText(element) {
    debug("onMessageText", element)

  }

  onArgument(element) {
    debug("onArgument")

    if (element.format == null) {
      this.onBasicArgument(element)
      return
    }

    switch (element.format.type) {
    case "dateFormat":
      this.onDateFormat(element)
      break
    case "pluralFormat":
      this.onPluralFormat(element)
    default:
      break
    }
  }

  onBasicArgument(element) {
    debug("onBasicArgument", element)
  }

  onDateFormat(element) {
    debug("onDateFormat", element)
  }

  onPluralFormat(element) {
    debug("onPluralFormat", element)

    for (const option of element.format.options) {
      if (option.type === "optionalFormatPattern") {
        const { selector, value } = option

        if (!this.o[selector]) {
          this.o[selector] = this.o.other.slice()
        }

        this.parse(value.elements, selector)
      }
    }
  }

  get values() {
    const k = this.k || "other"
    return this.o[k] || []
  }

  push(value) {
    const k = this.k || "other"
    if (!this.o[k]) {
      this.o[k] = []
    }
    this.o[k].push(value)
  }

  process(elements, curr) {
    for (const element of elements) {
      const keys = curr ? [curr] : Object.keys(this.o)

      for (const k of keys) {
        this.k = k

        switch (element.type) {
        case "messageTextElement":
          this.onMessageText(element)
          break
        case "argumentElement":
          this.onArgument(element)
          break
        default:
          console.error(`WARNING: unknown element type '${element.type}'`)
        }
      }
    }
  }

  parse(input) {
    debug(input)
    this.reset()
    this.ast = parser.parse(input)

    if (this.ast.type !== "messageFormatPattern") {
      return this.o
    }

    this.process(this.ast.elements)

    return this.o
  }
}

function write(directory, obj) {
  for (const fn in obj) {
    const p = path.join(directory, path.dirname(fn))
    mkdirpSync(p)

    fs.writeFileSync(path.join(directory, fn), obj[fn], "utf8")
  }
}

class KeywordOrderParser extends ICUParser {
  onBasicArgument(element) {
    const { id } = element

    if (this.values.indexOf(id) == -1) {
      this.push(id)
    }
  }
}

function getKeywordOrder(input) {
  return new KeywordOrderParser().parse(input)
}

const cases = {
  "camelcase": _.camelCase,
  "snakecase": _.snakeCase,
  "pascalcase": _.flow(_.camelCase, _.upperFirst)
}

function nunjucksEnvironmentWith(targetPath, filters) {
  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(targetPath), {
    throwOnUndefined: true,
    dev: { withInternals: true }
  })

  _.forEach(cases, (v, k) => {
    env.addFilter(k, v)
  })

  _.forEach(filters, (v, k) => {
    env.addFilter(k, v)
  })

  return env
}

function validate(baseKey, data) {
  const baseLang = data[baseKey]

  // Get count of base lang

  console.log(`== ${baseKey} ==`)
  console.log(`Base language contains: ${Object.keys(baseLang).length} keys\n`)
  
  for (const key in data) {
    if (key == baseKey) {
      continue
    }

    const lang = data[key]

    console.log(`== ${key} ==\n`)

    const baseLangKeys = Object.keys(baseLang)
    const langKeys = Object.keys(lang)

    baseLangKeys.sort()
    langKeys.sort()

    const onlyBaseLang = _.difference(baseLangKeys, langKeys)
    const onlyLang = _.difference(langKeys, baseLangKeys)

    if (onlyBaseLang.length) {
      console.log("Only base language:")
      console.log(`  - ${onlyBaseLang.join("\n  - ")}`)
      console.log()
    }

    if (onlyLang.length) {
      console.log("Only current language:")
      console.log(`  - ${onlyLang.join("\n  - ")}`)
      console.log()
    }
  }
}

function format(baseLang, lang) {
  const baseLangKeys = Object.keys(baseLang)
  const langKeys = Object.keys(lang)
  const allKeys = _.union(baseLangKeys, langKeys)

  baseLangKeys.sort()
  langKeys.sort()
  allKeys.sort()

  const onlyBaseLang = _.difference(baseLangKeys, langKeys)
  const onlyLang = _.difference(langKeys, baseLangKeys)

  const out = []

  for (const key of allKeys) {
    const dump = { [key]: lang[key] }

    if (baseLangKeys.includes(key) && langKeys.includes(key)) {
      out.push(indentString(`Original: ${baseLang[key]}`, 1, "# "))
      out.push(yaml.safeDump(dump))
    } else if (baseLangKeys.includes(key)) {
      out.push(indentString(`Original: ${baseLang[key]}`, 1, "# "))
      out.push(`# ${key}: UNTRANSLATED\n`)
    } else if (langKeys.includes(key)) {
      out.push(`# ORIGINAL DOES NOT EXIST`)
      out.push(yaml.safeDump(dump))
    }
  }

  return out.join("\n")
}

module.exports = {
  ICUParser,
  getKeywordOrder,
  nunjucksEnvironmentWith,
  validate,
  format,
  write
}
