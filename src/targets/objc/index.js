const { ICUParser, getKeywordOrder, nunjucksEnvironmentWith } = require("../..")
const { generateStringsFile } = require("../../support/apple")
const _ = require("lodash")

function variable(key, withing) {
  if (withing) {
    return `With${_.flow(_.camelCase, _.upperFirst)(key)}`
  }

  return _.camelCase(key)
}

const tmplEnv = nunjucksEnvironmentWith(__dirname, {
  parameters(args) {
    return args.map(x => `${x}: String`).join(", ")
  },

  arguments(args) {
    return args.map(_.camelCase).join(", ")
  },

  typedSelector(item) {
    const { key, args } = item

    let sel = key

    if (args != null && args.length > 0) {
      for (let i = 0; i < args.length; ++i) {
        if (i === 0) {
          sel += `${variable(args[i], true)}:(NSString* _Nonnull)${variable(args[i])}`
        } else {
          sel += ` ${variable(args[i])}:(NSString* _Nonnull)${variable(args[i])}`
        }
      }
    }

    return sel
  }
})

function generateData(baseData) {
  const o = {
    strings: [],
    stringArrays: []
  }

  for (const k in baseData) {
    if (Array.isArray(baseData[k])) {
      o.stringArrays.push({
        key: k,
        count: baseData[k].length,
        comment: baseData[k].join(", ")
      })
    } else {
      const order = getKeywordOrder(baseData[k])

      o.strings.push({
        key: k,
        args: order.other,
        comment: baseData[k]
      })
    }
  }

  return o
}

const stringsHTmpl = tmplEnv.getTemplate("Strings.h.njk")
const stringsMTmpl = tmplEnv.getTemplate("Strings.m.njk")

function generate(baseLang, data, outputDir) {
  const baseData = data[baseLang]
  const o = {}

  for (const lang in data) {
    const key = baseLang === lang ? "Base" : lang
    o[`${key}.lproj/Localizable.strings`] = generateStringsFile(baseData, data[lang])
  }

  const ast = generateData(baseData)

  o["Strings.m"] = stringsMTmpl.render(ast)
  o["Strings.h"] = stringsHTmpl.render(ast)
  
  return Promise.resolve(o)
}

module.exports = generate