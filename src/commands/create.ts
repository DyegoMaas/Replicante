import { GluegunCommand, filesystem, strings } from 'gluegun'

const printHelp = toolbox => {
  const {
    print: { info, table }
  } = toolbox

  const printInstructionLines = instructions => {
    instructions.forEach(instructionLine => info(instructionLine))
  }

  printInstructionLines([
    'You can run "replicante create <path-to-sample> <path-to-recipe> [options]" to create your replicant.',
    '',
    'These are the available options:'
  ])

  table(
    [
      ['Option', 'Description'],
      [
        '--target',
        'The directory where the Replicant should be created. Default value: <USER-HOME>/.replicante/<replicant-name>'
      ]
    ],
    { format: 'markdown' }
  )

  printInstructionLines([
    '',
    'A quick glossary:',
    '- sample: the project folder you want to replicate, with some adjustments',
    '- recipe: contains instructions on which terms from recipe files to replace by new terms',
    '- replicant: the resulting project, with all terms defined in the recipe replaced',
    '',
    'Some common use cases  you may find "replicante" useful for:',
    '- Replacing import paths in Python or Javascript projects',
    '- Ajusting C# namespaces or Java packages',
    '- Replacing the project name, that repeats itself in many ways in configuration files',
    '',
    'For more information on how to use "replicante", visit: https://github.com/DyegoMaas/Replicante'
  ])
}

const command: GluegunCommand = {
  name: 'create',
  description:
    'Create a REPLICANT by applying the RECIPE instructions to the SAMPLE',
  run: async toolbox => {
    const fs = require('fs')
    const path = require('path')
    const { isBinary } = require('istextorbinary')
    const { generateReplicant } = require('../replication/replication-process')
    const {
      parameters,
      print: { success, info, error },
      patching
    } = toolbox

    if (parameters.options.help) {
      printHelp(toolbox)
      return
    }

    const sample = parameters.first
    const recipe = parameters.second
    if (!sample || !recipe) {
      error('Some parameters are missing.')
      info(
        'Try "replicante create <path-to-sample> <path-to-recipe> [options]"'
      )
      info('To see available options, try "replicante create --help"')
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
      const resetDirectory = directory => {
        filesystem.remove(directory)
        makeDirectory(directory)
      }

      const makeDirectory = directory => {
        fs.mkdirSync(directory, { recursive: true })
      }

      const listFiles = directory => {
        let tree = filesystem.inspectTree(directory)
        if (!tree.children) return []
        return tree.children
          .filter(file => file.type === 'file')
          .map(file => {
            return {
              type: file.type,
              name: file.name
            }
          })
      }

      const readFile = filePath => {
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

        const finalPath = filesystem.path(destDirectory, sourceBaseName)
        filesystem.copy(src, finalPath, { overwrite: true })

        if (sourceBaseName !== destBaseName) {
          filesystem.rename(finalPath, destBaseName)
        }
      }

      const prependToFileAsync = async (filePath, contentToPrepend) => {
        return patching.prepend(filePath, contentToPrepend)
      }

      const isBinaryFile = fullPath => {
        const fileName = path.basename(fullPath)
        const buffer = fs.readFileSync(fullPath, { encoding: null })
        return isBinary(fileName, buffer)
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
          upperCase: strings.upperCase
        },
        prints: { info, error, success },
        isBinaryFile
      }
    }

    const customToolbox = gluegunCustomToolbox()
    info('Replication processing starting.')
    const replicationInstructions = {
      sampleDirectory: sample,
      replicationRecipeFile: recipe
    }

    try {
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
        filesystem.copy(replicantDirectory, fullTargetPath, { overwrite: true })

        resultDirectory = fullTargetPath
      }

      success(
        `Replication process completed. Replicant created at ${resultDirectory}`
      )
    } catch (err) {
      error('An error has ocurred:')
      error(err)
    }
  }
}

module.exports = command
