var { system, filesystem } = require('gluegun')
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const yaml = require('js-yaml')
var rimraf = require('rimraf')
const {
  resolveReplicantWorkDir
} = require('../src/replication/replication-process')

let loadRecipe = recipe => {
  const rawData = fs.readFileSync(recipe)
  let recipeJson = JSON.parse(rawData)

  if (recipeJson.templateName === undefined) {
    // this transformation relies on the fact that default template name is {replicanteName_timestamp}
    const candidates = fs.readdirSync(`${resolveReplicantWorkDir()}/_templates`, { withFileTypes: true })
        .filter(dir => dir.isDirectory())
        .map(dir => path.basename(dir.name))
        .filter(dir => dir.startsWith(recipeJson.replicantName))
        .sort()
        .reverse()
    if (candidates) {
      recipeJson.templateName = path.basename(candidates[0])
    }
    else
      throw new Error(`Template not found for replicante ${recipeJson.replicantName} with timestamped directory`)
  }

  return recipeJson
}

const readTemplateForRecipe = recipe => {
  const templatePath = `${resolveReplicantWorkDir()}/_templates/${
    recipe.templateName
  }/new`

  if (fs.existsSync(templatePath))
    return fs.readdirSync(templatePath)
  return ''
}

const templateFileExists =  (recipe, fileName) => {
  const filePath = `${resolveReplicantWorkDir()}/_templates/${
    recipe.templateName
  }/new/${fileName}`
  return filesystem.exists(filePath)
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

const readFileDiscardingHeader = fullPath => {
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

const readReplicantFileContent = (recipe, fileNameParts) : string => {
  const targetFile = path.join(...fileNameParts)
  const filePath = path.join(
    resolveReplicantWorkDir(),
    recipe.replicantName,
    targetFile
  )
  return filesystem.read(filePath)
}

const readSampleBinaryFile = (recipe, fileNameParts) : Buffer => {
  const targetFile = path.join(...fileNameParts)
  const filePath = path.join(
    `test-infrasctructure`,
    `fixtures`,
    targetFile
  )
  const fullPath = path.resolve(filePath)
  return fs.readFileSync(fullPath, { encoding:null })
}

const readReplicantBinaryFile = (recipe, fileNameParts) : Buffer => {
  const targetFile = path.join(...fileNameParts)
  const filePath = path.join(
    resolveReplicantWorkDir(),
    recipe.replicantName,
    targetFile
  )
  return fs.readFileSync(filePath, { encoding:null })
}


let cli = cmd => {
  let src = filesystem.path(__dirname, '..')
  return system.run('node ' + filesystem.path(src, 'bin', 'replicante') + ` ${cmd}`)
}

let createReplicant = async (
  sampleDirectory,
  fixtureRecipeToUse,
  options?
) => {
  await filesystem.removeAsync(resolveReplicantWorkDir())

  let samplePath = filesystem.resolve(
    `./test-infrasctructure/fixtures/${sampleDirectory}`
  )
  let recipeFilePath = filesystem.resolve(
    `./test-infrasctructure/fixtures/${fixtureRecipeToUse}`
  )
  return await cli(`create ${samplePath} ${recipeFilePath} ${options}`).then(
    cliOutput => {
      const recipe = loadRecipe(recipeFilePath)
      return {
        recipe,
        output: cliOutput,
        templateFiles: readTemplateForRecipe(recipe)
      }
    }
  )
}

export {
  cli,
  createReplicant,
  loadRecipe,
  readTemplateForRecipe,
  readTemplateFileHeader,
  readTemplateFileContent,
  templateFileExists,
  deleteReplicantDirectory,
  readReplicantFileContent,
  readSampleBinaryFile,
  readReplicantBinaryFile
}