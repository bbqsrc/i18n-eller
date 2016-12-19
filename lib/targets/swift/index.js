"use strict"

const yaml = require("js-yaml")
const { ICUParser } = require("../..")
const debug = require("debug")("swift")

class KeywordOrderParser extends ICUParser {
  onBasicArgument(element) {
    const { id } = element

    if (this.values.indexOf(id) == -1) {
      this.push(id)
    }
  }
}

class SwiftStringGenerator extends ICUParser {
  onBasicArgument(element) {
    const { id } = element

    if (id) {
      this.push(`%${this.order[this.k].indexOf(element.id) + 1}$@`)
    } else {
      this.push(element.value)
    }
  }

  onMessageText(element) {
    this.push(element.value)
  }

  parse(baseInput, input) {
    const keywordOrder = new KeywordOrderParser().parse(baseInput)
    this.order = keywordOrder

    if (input == null) {
      console.error(`MISSING: ${baseInput}`)
      input = baseInput
    }
    const o = super.parse(input)

    return `${o.other.join("").replace(/"/g, '\\"').trim()}`
  }
}

function swiftStringsGenerator(baseData, data) {
  const o = []

  for (const k in baseData) {
    if (Array.isArray(baseData[k])) {
      data[k].forEach((s, i) => {
        o.push(`"${k}_${i}" = "${s}";`)
      })
      continue
    }

    const g = new SwiftStringGenerator()
    o.push(`"${k}" = "${g.parse(baseData[k], data[k])}";`)
  }

  debug("DONE")

  return o.join("\n")
}

const swiftApiHeader = `
import Foundation

class Strings {
    static var locale: String? = nil {
        didSet {
            if let dir = Bundle.main.path(forResource: locale, ofType: "lproj"), let bundle = Bundle(path: dir) {
                self.bundle = bundle
            } else {
                self.bundle = Bundle.main
            }
        }
    }

    static var bundle: Bundle = Bundle.main

    fileprivate static func string(for key: String) -> String {
        return bundle.localizedString(forKey: key, value: nil, table: nil)
    }

    fileprivate static func stringArray(for key: String, length: Int) -> [String] {
        return (0..<length).map {
            bundle.localizedString(forKey: "\\(key)_\\($0)", value: nil, table: nil)
        }
    }

    `

const swiftApiFooter = `private init() {}
}
`

const swiftKeywords = [
  "continue"
]

function swiftKeyword(word) {
  if (swiftKeywords.indexOf(word) > -1) {
    return "`" + word + "`"
  }
  return word
}

function swiftApiFuncGenerator(input, key) {
  const args = (new KeywordOrderParser().parse(input)).other

  if (args.length) {
    const params = args[0] + " " + args.join(": String, ") + ": String"
    return `
    static func ${swiftKeyword(key)}(${params}) -> String {
        let format = string(for: "${key}")
        return String(format: format, ${args.join(", ")})
    }

    `
  } else {
    return `
    static var ${swiftKeyword(key)}: String {
        return string(for: "${key}")
    }

    `
  }
}

function swiftApiStringArrayFuncGenerator(input, key) {
  return `
    static var ${swiftKeyword(key)}: [String] {
        return stringArray(for: "${key}", length: ${input.length})
    }

    `
}


function swiftApiGenerator(baseData) {
  const o = [swiftApiHeader]

  for (const k in baseData) {
    if (Array.isArray(baseData[k])) {
      o.push(`/** ${baseData[k].join(", ")} */`)
      o.push(swiftApiStringArrayFuncGenerator(baseData[k], k))
      continue
    }

    o.push(`/** ${baseData[k].trim()} */`)
    o.push(swiftApiFuncGenerator(baseData[k], k))
  }

  o.push(swiftApiFooter)

  return o.join("")
}

function generate(baseLang, data, outputDir) {
  const baseData = data[baseLang]
  const o = {}

  for (const lang in data) {
    const key = baseLang === lang ? "Base" : lang
    console.log(lang)
    o[`${key}.lproj/Localizable.strings`] = swiftStringsGenerator(baseData, data[lang])
  }

  o["Strings.swift"] = swiftApiGenerator(baseData)

  console.log(Object.keys(o))
  return o
}

module.exports = generate

// TODO VALIDATE

// Eg check that:
//  en: this is sentence.
//  es: this is setence
// That should cry a warning about a sudden change in punctuation

/*
const data = yaml.safeLoad(require("fs").readFileSync("./input.yaml", "utf8"))

console.log(Object.keys(generate("en", {en: data}, ".")))
*/
