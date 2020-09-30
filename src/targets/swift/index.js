"use strict"

const yaml = require("js-yaml")
const { getKeywordOrder, resolveLocaleTree } = require("../..")
const debug = require("debug")("swift")
const { generateStringsFile } = require("../../support/apple")

const swiftApiHeader = `// Generated. Do not edit.
import Foundation

fileprivate extension UserDefaults {
    var appleLanguages: [String] {
        return self.array(forKey: "AppleLanguages") as? [String] ??
            [Locale.autoupdatingCurrent.languageCode ?? "en"]
    }
}

fileprivate func derivedLocales(_ languageCode: String) -> [String] {
  let x = Locale(identifier: languageCode)
  var opts: [String] = []
  
  if let lang = x.languageCode {
      if let script = x.scriptCode, let region = x.regionCode {
          opts.append("\\(lang)-\\(script)-\\(region)")
      }
      
      if let script = x.scriptCode {
          opts.append("\\(lang)-\\(script)")
      }
      
      if let region = x.regionCode {
          opts.append("\\(lang)-\\(region)")
      }
      
      opts.append(lang)
  }
  
  return opts
}

class Strings {
    static var languageCode: String = UserDefaults.standard.appleLanguages[0] {
        didSet {
            if let dir = Bundle.main.path(forResource: languageCode, ofType: "lproj"), let bundle = Bundle(path: dir) {
                self.bundle = bundle
            } else {
                print("No bundle found for \\(languageCode))")
                self.bundle = Bundle.main
            }
        }
    }

    static var bundle: Bundle = Bundle.main

    internal static func string(for key: String) -> String {
        return bundle.localizedString(forKey: key, value: nil, table: nil)
    }

    internal static func stringArray(for key: String, length: Int) -> [String] {
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


function swiftApiGenerator(baseData, langs) {
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

  o.push(`\nfileprivate let localeTree = [\n    `)
  o.push(langs
    .filter(x => x !== "base")
    .map(lang => `"${lang}": ${JSON.stringify(resolveLocaleTree(lang))}`)
    .join(",\n    "))
  o.push("\n]\n")

  return o.join("")
}

function generate(baseLang, data, outputDir) {
  const baseData = data[baseLang]
  const o = {}

  for (const lang in data) {
    const key = baseLang === lang ? "Base" : lang
    o[`${key}.lproj/Localizable.strings`] = generateStringsFile(baseData, data[lang] || {})
  }

  o["Strings.swift"] = swiftApiGenerator(baseData, Object.keys(data))

  // console.log(Object.keys(o))
  return Promise.resolve(o)
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
