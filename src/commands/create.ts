import { GluegunCommand, filesystem, strings } from 'gluegun'

const command: GluegunCommand = {
  name: 'create',
  description:
    'Create a REPLICANT by applying the Recipe instructions to the Sample',
  run: async toolbox => {
    const fs = require('fs')
    const path = require('path')
    const { generateReplicant } = require('../replication/replication-process')
    const {
      parameters,
      print: { success, info, error },
      // template,
      patching
    } = toolbox

    if (parameters.options.help) {
      const avaiableOptions = [
        {
          name: 'target',
          description:
            'The directory where the Replicant should be created. ' +
            'Default value: <USER-HOME>/.replicante/<replicant-name>'
        }
      ]
      info('Avaiable options:')
      avaiableOptions.forEach(option => {
        const { name, description } = option
        info(`  --${name}\t${description}`)
      })
      return
    }

    const sample = parameters.first
    const recipe = parameters.second
    if (!sample || !recipe) {
      error('Some parameters are missing.')
      info(
        'Try "replicante create <path-to-sample> <path-to-recipe> [options]"'
      )
      info('To see avaialbe options, try "replicante create --help"')
      return
    }

    if (parameters.options.target) {
      if (
        filesystem.exists(parameters.options.target) &&
        !filesystem.isDirectory(parameters.options.target)
      ) {
        error('Option --target must be a directory')
        return
      }
    }

    const gluegunCustomToolbox = () => {
      const resetDirectory = (directory) => {
        filesystem.remove(directory)
        makeDirectory(directory)
      }

      const makeDirectory = (directory) => {
        fs.mkdirSync(directory, { recursive: true })
      }

      const listFiles = (directory) => {
        let tree = filesystem.inspectTree(directory)
        if (!tree.children)
          return []
        return tree.children
          .filter(file => file.type == 'file')
          .map(file => {
            return {
              type: file.type,
              name: file.name
            }
          })
      }

      const readFile = (filePath) => {
        return filesystem.read(filePath)
      }

      const writeFile = (filePath, content) => {
        filesystem.write(filePath, content)
      }

      const copyFile = (src, dest) => {
        const destDirectory = path.dirname(dest)
        const sourceBaseName = path.basename(src)
        const destBaseName = path.basename(dest)
        makeDirectory(destDirectory)

        const x = filesystem.path(destDirectory, sourceBaseName)
        filesystem.copy(src, x, {overwrite: true})

        if (sourceBaseName != destBaseName) {
          filesystem.rename(x, destBaseName)
        }
      }

      const prependToFileAsync = async (filePath, contentToPrepend) => {
        return await patching.prepend(filePath, contentToPrepend) // TODO await...
      }

      return {
        resetDirectory,
        makeDirectory,
        listFiles,
        readFile,
        writeFile,
        copyFile,
        prependToFileAsync,
        stringCases: {
          kebabCase: strings.kebabCase,
          lowerCase: strings.lowerCase,
          upperCase: strings.upperCase,
        },
        prints: { info, error, success }
      }
    }

    const customToolbox = gluegunCustomToolbox()
    info('Replication processing starting.')
    const replicationInstructions = {
      sampleDirectory: sample,
      replicationRecipeFile: recipe
    }
    const { recipeUsed, replicantDirectory } = await generateReplicant(
      replicationInstructions,
      customToolbox
    )

    let resultDirectory = replicantDirectory
    if (parameters.options.target) {
      const fullTargetPath = filesystem.path(
        parameters.options.target,
        recipeUsed.replicantName
      )

      // TODO move operation into replication-process.js
      customToolbox.makeDirectory(fullTargetPath)
      filesystem.copy(replicantDirectory, fullTargetPath, {overwrite: true})

      resultDirectory = fullTargetPath
    }

    success(
      `Replication process completed. Replicant created at ${resultDirectory}`
    )
  }
}

module.exports = command
