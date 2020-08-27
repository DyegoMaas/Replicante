const { homedir } = require('os')
const path = require('path')
const mustache = require('mustache')
const yaml = require('js-yaml')
const Replicator = require('./Replicator')
const ReplicationRecipe = require('./ReplicationRecipe')

const resolveReplicantWorkDir = () => {
  return path.join(homedir(), '.replicante').replace(/\\/g, '/')
}

const buildRecipe = replicationInstructions => {
  const { replicationRecipeFile } = replicationInstructions
  const recipe = ReplicationRecipe.fromRecipeFile(
    replicationRecipeFile,
    resolveReplicantWorkDir()
  )
  return recipe
}

const generateFileFromTemplate = (options, toolbox) => {
  const { readFile, writeFile } = toolbox
  const { template, target, view, directory, delimiters } = options

  const templateContent = readFile(path.join(directory, template))
  mustache.tags = delimiters
  // TODO mustache.parse() ?
  var output = mustache.render(templateContent, view)
  writeFile(target, output)
}

const decomposeTemplateFile = (filePath, toolbox) => {
  const { readFile } = toolbox

  const content = readFile(filePath)
  let parts = content.split('---\n')
  return {
    header: yaml.safeLoad(parts[1]),
    content: parts[2].trimEnd()
  }
}

const generateReplicantFromTemplate2 = async (replicator, toolbox) => {
  const {
    writeFile,
    listFiles,
    stringCases: { lowerCase, upperCase, kebabCase },
    prints: { info }
  } = toolbox

  await Promise.resolve()
  const {
    templateName,
    replicantName,
    templateDir,
    delimiters
  } = replicator.replicationRecipe
  info(`Replicating sample from ${templateName}. Generating ${replicantName}.`)

  const realTemplateDir = path.join(templateDir, 'new')
  info(realTemplateDir)
  const fileList = listFiles(realTemplateDir)
  const templateFiles = fileList.map(child => child.name)

  const view = {
    name: replicantName,
    nameUpperCase: upperCase(replicantName),
    nameLowerCase: lowerCase(replicantName),
    nameLowerDasherized: lowerCase(kebabCase(replicantName))
  }

  const tempDir = path.join(templateDir, '_temp')
  info(templateFiles)
  for (let i = 0; i < templateFiles.length; i++) {
    const fileName = templateFiles[i]

    // renders new template with header patched
    const partialFilePath = path.join(tempDir, fileName)
    generateFileFromTemplate(
      {
        template: fileName,
        target: partialFilePath,
        view: view,
        directory: realTemplateDir,
        delimiters: delimiters
      },
      toolbox
    )

    const { header, content } = decomposeTemplateFile(partialFilePath, toolbox)
    const newTarget = path.join(
      resolveReplicantWorkDir(),
      header.to.replace(/"/g, '')
    )
    writeFile(newTarget, content)
  }
}

const generateReplicant = async (replicationInstructions, toolbox) => {
  const { resetDirectory, makeDirectory } = toolbox

  const recipe = buildRecipe(replicationInstructions)
  const replicator = new Replicator(recipe, toolbox)

  resetDirectory(replicator.replicationDirectory)
  resetDirectory(recipe.templateDir)
  makeDirectory(path.join(recipe.templateDir, 'new'))
  makeDirectory(path.join(recipe.templateDir, '_temp'))

  const { sampleDirectory } = replicationInstructions
  await replicator.processRecipeFiles(sampleDirectory)

  await generateReplicantFromTemplate2(replicator, toolbox)

  return {
    recipeUsed: recipe,
    replicantDirectory: path.join(
      resolveReplicantWorkDir(),
      recipe.replicantName
    )
  }
}

module.exports = { generateReplicant, resolveReplicantWorkDir }
