import { GluegunCommand, filesystem, strings } from 'gluegun'

const readTemplateFileHeader = async (filePath) => {
  await Promise.resolve()
  // const readline = require('readline')
  const yaml = require('js-yaml')
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

  const content = filesystem.read(filePath)

  return {
    header: yaml.safeLoad(content),
    originalText: content
  }
}

const command: GluegunCommand = {
  name: 'create',
  description:
    'Create a REPLICANT by applying the Recipe instructions to the Sample',
  run: async toolbox => {
    const mustache = require('mustache')
    const fs = require('fs')
    const { generateReplicant } = require('../replication/replication-process')
    const {
      parameters,
      print: { success, info, error },
      // template,
      // patching
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

    const generate = (options) => {
      const {template, target, view, directory} = options

      const templateContent = filesystem.read(filesystem.path(directory, template))
      var output = mustache.render(templateContent, view);
      info(output)
      console.log(output)
      filesystem.write(target, output)
    }

    const generateReplicantFromTemplate = async replicator => {
      await Promise.resolve()
      const { templateName, replicantName, templateDir } = replicator.replicationRecipe
      info(`Replicating sample from ${templateName}. Generating ${replicantName}.`)

      const realTemplateDir = filesystem.path(templateDir, 'new')
      info(realTemplateDir)
      const fileTree = filesystem.inspectTree(realTemplateDir)
      const templateFiles = fileTree.children.map(child => child.name)

      const tempDir = filesystem.path(templateDir, '_temp')
      info(templateFiles)
      for (let i = 0; i < templateFiles.length; i++) {
        const fileName = templateFiles[i]
        const filePath = filesystem.path(realTemplateDir, fileName)
        info(filePath)

        const view = {
          name: replicantName,
          nameUpperCase: strings.upperCase(replicantName),
          nameLowerCase: strings.lowerCase(replicantName),
          nameLowerDasherized: strings.lowerCase(strings.kebabCase(replicantName))
        }

        filesystem.write(filesystem.path(tempDir, `banana${i}.txt`), 'banana')
        // renders new template with header patched
        const partialFilePath = filesystem.path(tempDir, fileName)
        generate({
          template: fileName,
          target: partialFilePath,
          view: view,
          directory: realTemplateDir
        })
       // generate({
        //   template: fileName,
        //   target: partialFilePath,
        //   view: view,
        //   directory: realTemplateDir
        // })
        // renders final file

        const {header} = await readTemplateFileHeader(partialFilePath)
        // // patching.replace(partialFilePath, originalText, '')
        info(header)
        // generate({
        //   template: fileName,
        //   target: header.to.replace(/"/g, ''),
        //   view: view,
        //   directory: tempDir
        // })
      }
    }

    const customToolbox = () => {
      const resetDirectory = (directory) => {
        filesystem.remove(directory)
        makeDirectory(directory)
      }

      const makeDirectory = (directory) => {
        fs.mkdirSync(directory, { recursive: true })
      }

      return {
        resetDirectory,
        makeDirectory
      }
    }

    info('Replication processing starting.')
    const replicationInstructions = {
      sampleDirectory: sample,
      replicationRecipeFile: recipe
    }
    const { recipeUsed, replicantDirectory } = await generateReplicant(
      replicationInstructions,
      generateReplicantFromTemplate,
      customToolbox()
    )

    let resultDirectory = replicantDirectory
    if (parameters.options.target) {
      const fullTargetPath = filesystem.path(
        parameters.options.target,
        recipeUsed.replicantName
      )

      // TODO move operation into replication-process.js
      filesystem.copy(replicantDirectory, fullTargetPath, {overwrite: true})

      resultDirectory = fullTargetPath
    }

    success(
      `Replication process completed. Replicant created at ${resultDirectory}`
    )
  }
}

module.exports = command
