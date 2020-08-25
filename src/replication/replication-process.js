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

const generate = (options, toolbox) => {
  const {
    readFile,
    writeFile,
    prints: { info }
  } = toolbox
  const { template, target, view, directory } = options

  const templateContent = readFile(path.join(directory, template))
  var output = mustache.render(templateContent, view)
  info(output)
  writeFile(target, output)
}

const readTemplateFileHeader = (filePath, toolbox) => {
  const { readFile } = toolbox

  const content = readFile(filePath)
  let parts = content.split('---')
  return {
    header: yaml.safeLoad(parts[1]),
    originalText: content
  }
}

const generateReplicantFromTemplate2 = async (replicator, toolbox) => {
  const {
    listFiles,
    stringCases: { lowerCase, upperCase, kebabCase },
    prints: { info }
  } = toolbox

  await Promise.resolve()
  const {
    templateName,
    replicantName,
    templateDir
  } = replicator.replicationRecipe
  info(`Replicating sample from ${templateName}. Generating ${replicantName}.`)

  const realTemplateDir = path.join(templateDir, 'new')
  info(realTemplateDir)
  const fileList = listFiles(realTemplateDir)
  const templateFiles = fileList.map(child => child.name)

  const tempDir = path.join(templateDir, '_temp')
  info(templateFiles)
  for (let i = 0; i < templateFiles.length; i++) {
    const fileName = templateFiles[i]
    const filePath = path.join(realTemplateDir, fileName)
    info(filePath)

    const view = {
      name: replicantName,
      nameUpperCase: upperCase(replicantName),
      nameLowerCase: lowerCase(replicantName),
      nameLowerDasherized: lowerCase(kebabCase(replicantName))
    }

    // renders new template with header patched
    const partialFilePath = path.join(tempDir, fileName)
    generate(
      {
        template: fileName,
        target: partialFilePath,
        view: view,
        directory: realTemplateDir
      },
      toolbox
    )

    const { header } = readTemplateFileHeader(partialFilePath, toolbox)
    const newTarget = path.join(
      resolveReplicantWorkDir(),
      header.to.replace(/"/g, '')
    )
    generate(
      {
        template: fileName,
        target: newTarget,
        view: view,
        directory: tempDir
      },
      toolbox
    )
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
