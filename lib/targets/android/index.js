"use strict"
const yaml = require("js-yaml")
const { ICUParser } = require("../..")
const debug = require("debug")("swift")
const xmlbuilder = require("xmlbuilder")
const _ = require("lodash")

class KeywordOrderParser extends ICUParser {
  onBasicArgument(element) {
    const { id } = element

    if (this.values.indexOf(id) == -1) {
      this.push(id)
    }
  }
}

function cleanString(str) {
  return str.replace(/\n/g, "\\n").replace(/'/g, "\\'")
}

const invalid = [
  "continue"
]

function fixKey(key) {
  const k = _.snakeCase(key)

  if (invalid.indexOf(k) > -1) {
    return k + "_"
  }

  return k
}

class AndroidStringsGenerator extends ICUParser {
  constructor() {
    super()
    this.root = xmlbuilder.create("resources")
    this.root.att("xmlns:xliff", "urn:oasis:names:tc:xliff:document:1.2")
  }

  push() {
    throw new Error("no")
  }

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

  onMessageText(element) {
    this.element.txt(cleanString(element.value))
  }

  insert(key, baseInput, input) {
    const keywordOrder = new KeywordOrderParser().parse(baseInput)
    this.order = keywordOrder

    if (input == null) {
      console.error(`MISSING: ${baseInput}`)
      input = baseInput
    }

    this.element = this.root.ele("string", { name: fixKey(key) })
    const o = this.parse(input)
    this.element = null
  }

  insertArray(key, baseInput, input) {
    const el = this.root.ele("string-array", { name: fixKey(key) })
    for (const item of input) {
      el.ele("item").txt(cleanString(item))
    }
  }

  generate() {
    return this.root.end({ pretty: true })
  }
}

function androidStringsGenerator(baseData, data) {
  const g = new AndroidStringsGenerator()

  for (const k in baseData) {
    if (Array.isArray(baseData[k])) {
      g.insertArray(k, baseData[k], data[k])
    } else {
      g.insert(k, baseData[k], data[k])
    }
  }

  return g.generate()
}

const swiftApiHeader = `

object Strings {
    lateinit var context: ContextF

    static var locale: String? = nil {
        didSet {
            if let dir = NSBundle.mainBundle().pathForResource(locale, ofType: "lproj"), bundle = NSBundle(path: dir) {
                self.bundle = bundle
            } else {
                self.bundle = NSBundle.mainBundle()
            }
        }
    }

    static var bundle: NSBundle = NSBundle.mainBundle()

    private fun stringForKey(key: String): String {
        return bundle.localizedStringForKey(key, value: nil, table: nil)
    }

    static func stringArrayForKey(key: String, length: Int) -> [String] {
        return (0..<length).map {
            bundle.localizedStringForKey("\\(key)_\\($0)", value: nil, table: nil)
        }
    }

    `

const swiftApiFooter = `private init() {}
}
`

const swiftKeywords = [
  "continue"
]

function androidApiGenerator(baseData) {

}

function generate(baseLang, data, outputDir) {
  const baseData = data[baseLang]
  const o = {}

  for (const lang in data) {
    o[`res/values-${lang}/strings.xml`] = androidStringsGenerator(baseData, data[lang])
  }

  // o["Strings.kt"] = androidApiGenerator(baseData)

  console.log(Object.keys(o))
  return o
}

module.exports = generate
