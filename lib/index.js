"use strict"

const parser = require('intl-messageformat-parser')
const debug = require("debug")("strut-icu")
const fs = require("fs")
const path = require("path")

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

module.exports = {
  ICUParser,
  write
}
