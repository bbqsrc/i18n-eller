const xliff = require("./xliff")

function from(format, baseLang, data, options = {}) {
  if (format === "xliff") {
    return xliff.from(baseLang, data, options.normalise)
  }
}

function getSupport() {
  return {
    from: ["xliff"]
  }
}

module.exports = {
  getSupport,
  from
}