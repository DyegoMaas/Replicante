// const fs = require('fs')
const path = require('path')
// const { exec } = require('child_process')
const mustache = require('mustache')
const yaml = require('js-yaml')

const Replicator = require('./Replicator')
const ReplicationRecipe = require('./ReplicationRecipe')
// const execa = require('execa')
const { homedir } = require('os')

const resolveReplicantWorkDir = () => {
  return path.join(homedir(), '.replicante').replace(/\\/g, '/')
}

// const initializeTemplatesFolder = () => {
//   const dir = resolveReplicantWorkDir()
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true })
//   }

//   const hygenIsInitialized = fs.existsSync(path.join(dir, '_templates'))
//   if (hygenIsInitialized) {
//     console.log('Skipping Hygen initialization.')
//     return
//   }
// }

const buildRecipe = replicationInstructions => {
  const { replicationRecipeFile } = replicationInstructions
  const recipe = ReplicationRecipe.fromRecipeFile(
    replicationRecipeFile,
    resolveReplicantWorkDir()
  )
  return recipe
}

const buildReplicator = recipe => {
  return new Replicator(recipe)
}

// const resetDirectory = (directory) => {
//   rimraf.sync(directory)

//   if (!fs.existsSync(directory)) {
//     fs.mkdirSync(directory, { recursive: true })
//   }
// }

// const generateReplicantTemplate = (replicator, replicationInstructions) => {
//   const { sampleDirectory } = replicationInstructions

//   // resetDirectory(replicator.replicationDirectory)
//   replicator.processRecipeFiles(sampleDirectory)
// }

// /**
//  * Executes a shell command and return it as a Promise.
//  * @param cmd {string}
//  * @return {Promise<string>}
//  */
// function execShellCommand(cmd) {
//   return new Promise((resolve, reject) => {
//     exec(cmd, { cwd: resolveReplicantWorkDir() }, (error, stdout, stderr) => {
//       if (error) {
//         console.warn(error)
//         reject(error)
//       }
//       resolve(stdout ? stdout : stderr)
//     })
//   })
// }

// const generateReplicantFromTemplate = async replicator => {
//   const { templateName, replicantName } = replicator.replicationRecipe
//   console.log(
//     `Replicating sample from ${templateName}. Generating ${replicantName}.`
//   )
//   await execShellCommand(
//     `set HYGEN_OVERWRITE=1 && npx hygen ${templateName} new ${replicantName}`
//   )
// }

const generate = (options, toolbox) => {
  const {readFile, writeFile, prints: {info}} = toolbox
  const {template, target, view, directory} = options

  const templateContent = readFile(path.join(directory, template))
  var output = mustache.render(templateContent, view);
  info(output)
  writeFile(target, output)
}

const readTemplateFileHeader = async (filePath, toolbox) => {
  const {readFile} = toolbox
  await Promise.resolve()
  // const readline = require('readline')
  // const fs = require('fs')
  // const fileStream = fs.createReadStream(filePath)
  // const rl = readline.createInterface({
  //   input: fileStream,
  //   crlfDelay: Infinity
  // })

  // let header = ''
  // let dividerCount = 0
  // for await (const line of rl) {
  //   if (line.startsWith('---')) dividerCount++
  //   else header += line + '\n'

  //   if (dividerCount == 2) break
  // }
  // fileStream.close()

  const content = readFile(filePath)

  return {
    header: yaml.safeLoad(content),
    originalText: content
  }
}

const generateReplicantFromTemplate2 = async (replicator, toolbox) => {
  const {
    listFiles,
    stringCases: {lowerCase, upperCase, kebabCase},
    prints: {info}
  } = toolbox

  await Promise.resolve()
  const { templateName, replicantName, templateDir } = replicator.replicationRecipe
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
    generate({
      template: fileName,
      target: partialFilePath,
      view: view,
      directory: realTemplateDir
    }, toolbox)
   // generate({
    //   template: fileName,
    //   target: partialFilePath,
    //   view: view,
    //   directory: realTemplateDir
    // }, toolbox)
    // renders final file

    const {header} = await readTemplateFileHeader(partialFilePath, toolbox)
    // // patching.replace(partialFilePath, originalText, '')
    info(header)
    // generate({
    //   template: fileName,
    //   target: header.to.replace(/"/g, ''),
    //   view: view,
    //   directory: tempDir
    // }, toolbox)
  }
}

const generateReplicant = async (replicationInstructions, toolbox) => {
  const {resetDirectory, makeDirectory} = toolbox

  const recipe = buildRecipe(replicationInstructions)
  const replicator = buildReplicator(recipe)

  resetDirectory(replicator.replicationDirectory)
  resetDirectory(recipe.templateDir)
  makeDirectory(path.join(recipe.templateDir, 'new'))
  makeDirectory(path.join(recipe.templateDir, '_temp'))

  // clean template directory: _templates/name/new
  // clean template directory: _templates/name/_temp
  // reset template directory: _templates/name + create /new and /_temp
  console.log(toolbox)
  // initializeTemplatesFolder()

  const { sampleDirectory } = replicationInstructions
  replicator.processRecipeFiles(sampleDirectory)

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
