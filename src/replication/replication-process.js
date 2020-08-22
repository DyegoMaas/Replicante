const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
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

const generateReplicantTemplate = (replicator, replicationInstructions) => {
  const { sampleDirectory } = replicationInstructions

  // resetDirectory(replicator.replicationDirectory)
  replicator.processRecipeFiles(sampleDirectory)
}

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

const generateReplicant = async (replicationInstructions, generateReplicantFromTemplate, toolbox) => {
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

  generateReplicantTemplate(replicator, replicationInstructions)
  await generateReplicantFromTemplate(replicator)

  return {
    recipeUsed: recipe,
    replicantDirectory: path.join(
      resolveReplicantWorkDir(),
      recipe.replicantName
    )
  }
}

module.exports = { generateReplicant, resolveReplicantWorkDir }
