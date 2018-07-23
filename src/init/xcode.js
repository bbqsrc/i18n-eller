const fs = require("fs")
const xcode = require("xcode")
const path = require("path")

const stringFile = (lang) => `${lang}.lproj/Localizable.strings`
const getFirstProjectSection = (proj) => proj.pbxProjectSection()[proj.getFirstProject().uuid]
const getMainGroup = (proj) => {
  const mainGroupUuid = getFirstProjectSection(proj).mainGroup
  return proj.getPBXGroupByKey(mainGroupUuid)
}
const createStringsVariantGroup = (proj, subgroupId) => {
  const tmpGroupKey = proj.pbxCreateVariantGroup("Localizable.strings")
  proj.addToPbxGroup(tmpGroupKey, subgroupId)

  const vgroup = {
    uuid: proj.generateUuid(),
    fileRef: tmpGroupKey,
    basename: "Localizable.strings"
  }

  proj.addToPbxBuildFileSection(vgroup)
  proj.addToPbxResourcesBuildPhase(vgroup)
}

function pbxVariantGroupKeyByName(proj, name) {
  const groups = proj.hash.project.objects["PBXVariantGroup"]

  for (const key in groups) {
    if (!/_comment$/.test(key)) {
      continue
    }

    if (groups[key] === name) {
      return key.split(/_comment$/)[0]
    }
  }

  return null
}

function init(projPath, langs) {
  const fullPath = `${projPath}/project.pbxproj`
  const proj = xcode.project(fullPath)
  proj.parseSync()

  if (pbxVariantGroupKeyByName(proj, "Localizable.strings") != null) {
    console.log("Localizable.strings found; aborting.")
    process.exit(1)
  }

  const mainGroup = getMainGroup(proj)
  const firstSubgroupUuid = mainGroup.children[0].value
  const subgroupPath = JSON.parse(proj.getPBXGroupByKey(firstSubgroupUuid).path)
  const srcPath = path.resolve(projPath, "..", subgroupPath)

  // Create the strings variant group
  createStringsVariantGroup(proj, firstSubgroupUuid)

  // Get the group key because node-xcode is buggy as hell
  const groupKey = pbxVariantGroupKeyByName(proj, "Localizable.strings")
  
  // Add known regions
  for (const lang of langs) {
    proj.addKnownRegion(lang)

    // Create empty strings file
    const fn = stringFile(lang)
    try {
      fs.mkdirSync(path.join(srcPath, `${lang}.lproj`))
    } catch (_) {}
    fs.writeFileSync(path.join(srcPath, fn), "")

    console.log("Adding file " + fn)
    const file = proj.addFile(fn, groupKey)
  }

  console.log("Writing project...")
  fs.writeFileSync(fullPath, proj.writeSync())
}

module.exports = init