const xliff = require("./xliff")
const resx = require("./resx")

function from(format, baseLang, data, options = {}) {
  if (format === "xliff") {
    return xliff.from(baseLang, data, options.normalise)
  } else if (format === "resx") {
    return resx.from(baseLang, data, options.normalise)
  }
}

function getSupport() {
  return {
    from: ["xliff", "resx"]
  }
}

module.exports = {
  getSupport,
  from
}