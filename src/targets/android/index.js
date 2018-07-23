"use strict"

const { ICUParser, getKeywordOrder, nunjucksEnvironmentWith } = require("../..")
const yaml = require("js-yaml")
const xmlbuilder = require("xmlbuilder")
const _ = require("lodash")
const debug = require("debug")("i18n-eller:android")

const keywords = [
  "package",
  "as",
  "typealias",
  "class",
  "this",
  "super",
  "val",
  "var",
  "fun",
  "for",
  "null",
  "true",
  "false",
  "is",
  "in",
  "throw",
  "return",
  "break",
  "continue",
  "object",
  "if",
  "try",
  "else",
  "while",
  "do",
  "when",
  "interface",
  "typeof"
]

const tmplEnv = nunjucksEnvironmentWith(__dirname, {
  fixKey(key) {
    const k = _.snakeCase(key)

    if (keywords.includes(k)) {
      return k + "_"
    }

    return k
  },

  parameters(args) {
    return args.map(x => `${x}: String`).join(", ")
  },

  arguments(args) {
    return args.join(", ")
  },

  variable(key) {
    const k = _.camelCase(key)

    if (keywords.includes(k)) {
      return "`" + k + "`"
    }

    return k
  }
})

const stringXmlTmpl = tmplEnv.getTemplate("string.xml.njk")
const stringsKtTmpl = tmplEnv.getTemplate("Strings.kt.njk")

function cleanString(str) {
  return str
    .replace(/\n/g, "\\n")
    .replace(/(['"])/g, "\\$1")
}

const xliffG = (id, order) => `<xliff:g id="${id}" example="{${id}}">%${order}$s</xliff:g>`

class AndroidXmlGenerator extends ICUParser {
  onBasicArgument(element) {
    const { id } = element

    if (id) {
      this.element.ele("xliff:g", {
        id,
        example: `{${id}}`
      }).txt(`%${this.order[this.k].indexOf(id) + 1}$s`)
    } else {
      this.element.txt(cleanString(element.value))
    }
  }

  onBasicArgument(element) {
    const { id, value } = element

    if (id) {
      const ord = this.order[this.k].indexOf(element.id) + 1

      this.push(xliffG(id, ord))
    } else {
      this.push(cleanString(value))
    }
  }

  onMessageText(element) {
    this.push(cleanString(element.value))
  }

  parse(baseInput, input) {
    this.order = getKeywordOrder(baseInput)

    if (input == null) {
      console.error(`MISSING: ${baseInput}`)
      input = baseInput
    }
    input = input.trim()

    const o = super.parse(input)

    return o.other.join("").trim()
  }
}

function generateData(baseData, data) {
  const xmlGen = new AndroidXmlGenerator()
  const o = {
    strings: [],
    stringArrays: []
  }

  for (const k in baseData) {
    if (Array.isArray(baseData[k])) {
      o.stringArrays.push({
        key: k,
        values: data[k] || baseData[k]
      })
    } else {
      const res = xmlGen.parse(baseData[k], data[k])

      o.strings.push({
        key: k,
        value: res,
        args: xmlGen.order.other
      })
    }
  }

  return o
}

function generate(baseLang, data, outputDir) {
  const baseData = data[baseLang]
  const o = {}

  for (const lang in data) {
    const ast = generateData(baseData, data[lang])

    o[`res/values-${lang}/strings.xml`] = stringXmlTmpl.render(ast)
  }

  const ast = generateData(baseData, baseData)

  o["Strings.kt"] = stringsKtTmpl.render(ast)

  return Promise.resolve(o)
}

module.exports = generate
