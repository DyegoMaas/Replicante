import {
  GluegunCommand
} from 'gluegun'
import { generateReplicant } from '../replication/replication-process'

const command: GluegunCommand = {
  name: 'create',
  description: 'Create a REPLICANT by applying the Recipe instructions to the Sample',
  run: async toolbox => {
    const {
      parameters,
      print: { success, info, error }
    } = toolbox

    const sample = parameters.first
    const recipe = parameters.second

    if (!sample || !recipe) {
      error('Some parameters are missing.')
      info('Try "replicante create <path-to-sample> <path-to-recipe>"')
      return
    }

    info('Replication processing starting.')
    const result = await generateReplicant({
      sampleDirectory: sample,
      replicationRecipeFile: recipe
    })
    success(`Replication process completed. Replicant created at ${result.replicantDirectory}`)
  }
}

module.exports = command
