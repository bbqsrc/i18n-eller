const fs = require("fs")
const path = require("path")

function walkDirectories(p, o = []) {
  const ap = path.resolve(p)

  for (const f of fs.readdirSync(ap)) {
    const af = path.join(ap, f)
    if (fs.statSync(af).isDirectory()) {
      walkDirectories(af, o)
    } else {
      o.push(af)
    }
  }

  return o
}

function findLocalizedStrings(p) {
  const suffixes = /\.[hm]$/
  const res = walkDirectories(p)
    .filter(x => suffixes.test(x))
    .map(x => {
      const ew = fs.readFileSync(x, "utf8")
      const re = /NSLocalizedString\(@"(.*?)".*\)/g
      let i
      const o = []

      while ((i = re.exec(ew)) !== null) {
        o.push(i[1])
      }

      return o
    })
    .reduce((o, x) => o.concat(x), [])
  
  const out = [...new Set(res)]

  out.sort()
  return out
}