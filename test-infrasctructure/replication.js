const { filesystem } = require('gluegun')
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const yaml = require('js-yaml')
var rimraf = require('rimraf')
const {
  // generateReplicant,
  resolveReplicantWorkDir
} = require('../src/replication/replication-process')

// const replicate = async (samplePath, recipePath) => {
//   await generateReplicant({
//     sampleDirectory: samplePath,
//     replicationRecipeFile: recipePath
//   })
// }

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

const readTemplateFileContent = (recipe, fileName /*, options*/) => {
  const filePath = `${resolveReplicantWorkDir()}/_templates/${
    recipe.templateName
  }/new/${fileName}`
  const fullContent = filesystem.read(filePath)
  const parts = fullContent.split('---\n')
  const templateContent = parts[2]
  return templateContent

  // const fileStream = fs.createReadStream(filePath)
  // const rl = readline.createInterface({
  //   input: fileStream,
  //   crlfDelay: Infinity
  // })

  // let content = ''
  // let dividerCount = 0
  // let isFirstLineOfContent = true
  // for await (const line of rl) {
  //   if (line.startsWith('---')) {
  //     dividerCount++
  //     continue
  //   }

  //   if (dividerCount == 2) {
  //     let contentLine = line
  //     // if (isFirstLineOfContent && options && options.ignoreVariables) {
  //     //   contentLine = line.slice(line.indexOf('%>') + 2)
  //     // }
  //     content += contentLine + '\n'
  //     isFirstLineOfContent = false
  //   }
  // }
  // fileStream.close()
  // return content
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
  const fullContent = filesystem.read(filePath)
  const parts = fullContent.split('---\n')
  const templateContent = parts[2]
  return templateContent

  // if (!fs.existsSync(filePath)) {
  //   throw new Error(`Replicant file ${filePath} not found.`)
  // }

  // const fileStream = fs.createReadStream(filePath)
  // const rl = readline.createInterface({
  //   input: fileStream,
  //   crlfDelay: Infinity
  // })

  // let content = ''
  // for await (const line of rl) {
  //   content += line + '\n'
  // }
  // fileStream.close()
  // return content
}

module.exports = {
  loadRecipe: loadRecipe,
  readTemplateForRecipe: readTemplateForRecipe,
  readTemplateFileHeader: readTemplateFileHeader,
  readTemplateFileContent: readTemplateFileContent,
  deleteReplicantDirectory: deleteReplicantDirectory,
  readReplicantFileContent: readReplicantFileContent
}
