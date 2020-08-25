const { filesystem } = require('gluegun')
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const yaml = require('js-yaml')
var rimraf = require('rimraf')
const {resolveReplicantWorkDir} = require('../src/replication/replication-process')

const loadRecipe = recipe => {
  let rawData = fs.readFileSync(recipe)
  return JSON.parse(rawData)
}

const readTemplateForRecipe = recipe => {
  return fs.readdirSync(
    `${resolveReplicantWorkDir()}/_templates/${recipe.templateName}/new`
  )
}

const readTemplateFileHeader = async (recipe, fileName) => {
  const fileStream = fs.createReadStream(
    `${resolveReplicantWorkDir()}/_templates/${
      recipe.templateName
    }/new/${fileName}`
  )
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  let header = ''
  let dividerCount = 0
  for await (const line of rl) {
    if (line.startsWith('---')) dividerCount++
    else header += line + '\n'

    if (dividerCount == 2) break
  }
  fileStream.close()
  return yaml.safeLoad(header)
}

const readFileDiscardingHeader = (fullPath) => {
  const fullContent = filesystem.read(fullPath)
  const parts = fullContent.split('---\n')
  const templateContent = parts[2]
  return templateContent
}

const readTemplateFileContent = (recipe, fileName /*, options*/) => {
  const filePath = `${resolveReplicantWorkDir()}/_templates/${
    recipe.templateName
  }/new/${fileName}`
  return readFileDiscardingHeader(filePath)
}

const deleteReplicantDirectory = () => {
  try {
    return rimraf.sync(resolveReplicantWorkDir())
  } catch (e) {
    console.error(e)
    return false
  }
}

const readReplicantFileContent = (recipe, fileNameParts) => {
  const targetFile = path.join(...fileNameParts)
  const filePath = path.join(
    resolveReplicantWorkDir(),
    recipe.replicantName,
    targetFile
  )
  return readFileDiscardingHeader(filePath)
}

module.exports = {
  loadRecipe: loadRecipe,
  readTemplateForRecipe: readTemplateForRecipe,
  readTemplateFileHeader: readTemplateFileHeader,
  readTemplateFileContent: readTemplateFileContent,
  deleteReplicantDirectory: deleteReplicantDirectory,
  readReplicantFileContent: readReplicantFileContent
}
