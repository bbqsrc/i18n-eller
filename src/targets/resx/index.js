const xml2js = require("xml2js")
const fs = require("fs")
const _ = require("lodash")
const { ICUParser, getKeywordOrder } = require("../..")

class ResxStringGenerator extends ICUParser {
  onBasicArgument(element) {
    const { id } = element

    if (id) {
      this.push(`{${this.order[this.k].indexOf(element.id)}}`)
    } else {
      this.push(element.value)
    }
  }

  onMessageText(element) {
    this.push(element.value)
  }

  parse(baseInput, input) {
    this.order = getKeywordOrder(baseInput)

    if (input == null) {
      console.error(`MISSING: ${baseInput}`)
      input = baseInput
    }
    const o = super.parse(input)

    return `${o.other.join("").replace(/"/g, '\\"').trim()}`
  }
}

function loadBase() {
  return new Promise((resolve, reject) => {
    xml2js.parseString(fs.readFileSync(`${__dirname}/base.xml`, "utf8"), (err, result) => {
      if (err) {
        return reject(err)
      }
      
      resolve(result)
    })
  })    
}

function createData(key, value) {
  return {
    $: { name: _.upperFirst(_.camelCase(key)), "xml:space": "preserve" },
    value
  }
}

async function generateStringsFile(baseData, data) {
  const tree = await loadBase()
  tree.root.data = []

  for (const k in baseData) {
    if (Array.isArray(baseData[k])) {
      continue
    }

    const value = new ResxStringGenerator().parse(baseData[k], data[k])

    tree.root.data.push(createData(k, value))
  }

  return new xml2js.Builder().buildObject(tree)
}

async function generate(baseLang, data, outputDir) {
  const baseData = data[baseLang]
  const o = {}

  for (const lang in data) {

    const key = baseLang === lang ? "Strings" : `Strings.${lang}`
    o[`${key}.resx`] = await generateStringsFile(baseData, data[lang] || {})
  }

  // console.log(Object.keys(o))
  return o
}

module.exports = generate