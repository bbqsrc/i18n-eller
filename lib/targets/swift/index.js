"use strict"

const yaml = require("js-yaml")
const { ICUParser, getKeywordOrder } = require("../..")
const debug = require("debug")("swift")
const { generateStringsFile } = require("../../support/apple")

const swiftApiHeader = `// Generated. Do not edit.
import Foundation

class Strings {
    static var languageCode: String? = nil {
        didSet {
            if let dir = Bundle.main.path(forResource: languageCode, ofType: "lproj"), let bundle = Bundle(path: dir) {
                self.bundle = bundle
            } else {
                print("No bundle found for \(languageCode ?? nil)")
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
  const args = getKeywordOrder(input).other

  if (args.length) {
    const params = args.join(": String, ") + ": String"
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
    o[`${key}.lproj/Localizable.strings`] = generateStringsFile(baseData, data[lang])
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
