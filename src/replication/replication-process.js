const { homedir } = require('os')
const path = require('path')
const mustache = require('mustache')
const yaml = require('js-yaml')
const Replicator = require('./Replicator')
const ReplicationRecipe = require('./ReplicationRecipe')

const resolveReplicantWorkDir = () => {
  return path.join(homedir(), '.replicante').replace(/\\/g, '/')
}

const buildRecipe = (replicationInstructions, toolbox) => {
  const { replicationRecipeFile } = replicationInstructions
  const { readFile } = toolbox

  let rawData = readFile(replicationRecipeFile)
  let data = JSON.parse(rawData)

  if (data.customDelimiters && data.customDelimiters.length !== 2)
    throw new Error(
      "Custom delimiters should have length of 2. Example: ['{{', '}}']"
    )

  const recipe = ReplicationRecipe.fromRecipeJson(
    data,
    resolveReplicantWorkDir()
  )
  return recipe
}

const generateFileFromTemplate = (options, toolbox) => {
  const { readFile, writeFile } = toolbox
  const { template, target, view, directory } = options

  const templateContent = readFile(path.join(directory, template))
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

const generateReplicantFromTemplate = (replicator, recipe, toolbox) => {
  const {
    writeFile,
    listFiles,
    stringCases: { lowerCase, kebabCase },
    prints: { info },
    isBinaryFile
  } = toolbox

  const {
    templateName,
    replicantName,
    templateDir,
    delimiters
  } = replicator.replicationRecipe
  info(`Replicating sample from ${templateName}. Generating ${replicantName}.`)

  const realTemplateDir = path.join(templateDir, 'new')
  const fileList = listFiles(realTemplateDir)
  const templateFiles = fileList.map(child => child.name)

  const view = Object.create({
    name: replicantName,
    nameUpperCase: replicantName.toUpperCase(),
    nameLowerCase: replicantName.toLowerCase(),
    nameLowerDasherized: kebabCase(lowerCase(replicantName)),
    nameUpperDasherized: kebabCase(lowerCase(replicantName)).toUpperCase()
  })
  for (let i = 0; i < recipe.customVariables.length; i++) {
    const {name, value} = recipe.customVariables[i];

    view[name] = value
    view[`${name}UpperCase`] = value.toUpperCase()
    view[`${name}LowerCase`] = value.toLowerCase()
    view[`${name}LowerDasherized`] = kebabCase(lowerCase(replicantName))
    view[`${name}UpperDasherized`] = kebabCase(lowerCase(replicantName)).toUpperCase()
  }

  mustache.tags = delimiters
  const tempDir = path.join(templateDir, '_temp')
  for (let i = 0; i < templateFiles.length; i++) {
    const fileName = templateFiles[i]

    const partialFilePath = path.join(tempDir, fileName)
    if (isBinaryFile(path.join(realTemplateDir, fileName))) {
      continue
    } 

    // renders new template with header patched
    generateFileFromTemplate(
      {
        template: fileName,
        target: partialFilePath,
        view: view,
        directory: realTemplateDir
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

  const binaryFiles = replicator.pipelineData.loadFromDisk()
  prepareAndCopyBinaryFiles(binaryFiles, view, toolbox)
}

const prepareAndCopyBinaryFiles = (binaryFiles, view, toolbox) => {
  const { copyFile } = toolbox

  for(let i = 0; i < binaryFiles.length; i++) {
    const { from, to } = binaryFiles[i]
   
    var targetPath = path.join(
      resolveReplicantWorkDir(),
      mustache.render(to, view)
    )
    copyFile(from, targetPath)
  }
};

const generateReplicant = async (replicationInstructions, toolbox) => {
  const { resetDirectory, makeDirectory } = toolbox

  const recipe = buildRecipe(replicationInstructions, toolbox)
  const replicator = new Replicator(recipe, toolbox)

  resetDirectory(replicator.replicationDirectory)
  resetDirectory(recipe.templateDir)
  makeDirectory(path.join(recipe.templateDir, 'new'))
  makeDirectory(path.join(recipe.templateDir, '_temp'))

  const { sampleDirectory } = replicationInstructions
  await replicator.processRecipeFiles(sampleDirectory)

  generateReplicantFromTemplate(replicator, recipe, toolbox)

  return {
    recipeUsed: recipe,
    replicantDirectory: path.join(
      resolveReplicantWorkDir(),
      recipe.replicantName
    )
  }
}

module.exports = { generateReplicant, resolveReplicantWorkDir }
