const csv = require("csv")
const { union } = require("lodash")

function csvConvertor(baseLang, data) {
  const baseData = data[baseLang]
  const keys = Object.keys(baseData)

  const out = []

  for (const langKey in data) {
    if (langKey === baseLang) {
      continue
    }

    const columns = ["Key", baseLang, langKey, "Comment"]
    const o = []
    const lang = data[langKey]

    for (const k of keys) {
      o.push({
        Key: k,
        [baseLang]: baseData[k],
        [langKey]: lang[k],
        Comment: ""
      })
    }

    out.push(new Promise((resolve, reject) => {
      csv.stringify(o, {
        columns,
        header: true
      }, (err, res) => {
        if (err) {
          reject(err)
          return
        }
        
        resolve([langKey, res])
      })
    }))
  }

  return Promise.all(out).then(res => {
    return res.reduce((o, r) => {
      const [langKey, data] = r

      o[langKey] = data

      return o
    }, {})
  })
}