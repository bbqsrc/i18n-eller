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

async function from(base, langs, normalise) {
  const out = {}

  const parseTarget = (unit) => {
    if (!unit.target) {
      return null
    }
    
    const target = unit.target[0].trim()

    if (target === "") {
      return null
    }

    return target
  }

  const normaliseKey = (key) => {
    return camelCase(key.substring(0, 32))
  }

  const baseData = await parseXml(base)

  const bases = {}

  for (const file of baseData.xliff.file) {
    const name = file.$.original.split("/").pop()
    const yamlPath = `${name}/${file.$["source-language"]}.yaml`

    const o = {}

    if (file.body == null || file.body[0] === "") {
      continue
    }

    for (const unit of file.body[0]['trans-unit']) {
      const key = normalise ? normaliseKey(unit.source[0]) : unit.source[0]
      o[key] = unit.source[0]
    }

    bases[name] = o
    out[yamlPath] = format(o, o)
  }

  for (const langFn of langs) {
    const langData = await parseXml(langFn)

    for (const file of langData.xliff.file) {
      const name = file.$.original.split("/").pop()
      const yamlPath = `${name}/${file.$["target-language"]}.yaml`

      const o = {}

      if (file.body == null || file.body[0] === "") {
        continue
      }

      for (const unit of file.body[0]['trans-unit']) {
        const target = parseTarget(unit)

        if (target != null) {
          const key = normalise ? normaliseKey(unit.source[0]) : unit.source[0]
          
          o[key] = target
        }
      }

      out[yamlPath] = format(bases[name], o)
    }
  }

  return out
}

module.exports = {
  from
}