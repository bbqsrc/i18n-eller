const xml2js = require("xml2js")
const fs = require("fs")
const { camelCase } = require("lodash")
const { format } = require("..")

function parseXml(fn) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(fs.readFileSync(fn, "utf8"), (err, res) => {
      if (err) {
        return reject(err)
      }
      return resolve(res)
    })
  })
}

const normaliseKey = (key) => {
  return camelCase(key.substring(0, 32))
}

async function from(base, langs, normalise) {
  const files = {}
  const baseData = await parseXml(base)

  const raw = baseData.root.data.reduce((o, x) => {
    const k = normalise ? normaliseKey(x.$.name) : x.$.name
    const v = x.value[0]
    o[k] = v

    return o
  }, {})
  
  files["base.yaml"] = format(raw, raw)

  return files
}

module.exports = {
  from
}