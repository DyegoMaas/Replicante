import { GluegunCommand, filesystem } from 'gluegun'

const command: GluegunCommand = {
  name: 'create',
  description:
    'Create a REPLICANT by applying the Recipe instructions to the Sample',
  run: async toolbox => {
    const { generateReplicant } = require('../replication/replication-process')
    const {
      parameters,
      print: { success, info, error }
    } = toolbox

    if (parameters.options.help) {
      const avaiableOptions = [
        {
          name: 'target',
          description:
            'The directory where the Replicant should be created. Default value: <USER-HOME>/.replicante/<replicant-name>'
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

    info('Replication processing starting.')
    const { recipeUsed, replicantDirectory } = await generateReplicant({
      sampleDirectory: sample,
      replicationRecipeFile: recipe
    })

    let resultDirectory = replicantDirectory
    if (parameters.options.target) {
      const fullTargetPath = filesystem.path(
        parameters.options.target,
        recipeUsed.replicantName
      )

      // TODO move operation into replication-process.js
      filesystem.move(replicantDirectory, fullTargetPath)

      resultDirectory = fullTargetPath
    }

    success(
      `Replication process completed. Replicant created at ${resultDirectory}`
    )
  }
}

module.exports = command
