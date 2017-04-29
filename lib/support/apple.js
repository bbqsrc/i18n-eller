const { ICUParser, getKeywordOrder } = require("..")

class CocoaStringGenerator extends ICUParser {
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
    this.order = getKeywordOrder(baseInput)

    if (input == null) {
      console.error(`MISSING: ${baseInput}`)
      input = baseInput
    }
    const o = super.parse(input)

    return `${o.other.join("").replace(/"/g, '\\"').trim()}`
  }
}

function generateStringsFile(baseData, data) {
  const o = []

  for (const k in baseData) {
    if (Array.isArray(baseData[k])) {
      data[k].forEach((s, i) => {
        o.push(`"${k}_${i}" = "${s}";`)
      })
      continue
    }

    const g = new CocoaStringGenerator()
    o.push(`"${k}" = "${g.parse(baseData[k], data[k])}";`)
  }

  return o.join("\n")
}

module.exports = {
  generateStringsFile
}