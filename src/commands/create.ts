import { GluegunCommand } from 'gluegun'
import { generateReplicant } from '../replication/replication-process'

const command: GluegunCommand = {
  name: 'create',
  run: async toolbox => {
    const {
      parameters,
      print: { success }
    } = toolbox

    const sample = parameters.first
    const recipe = parameters.second
    await generateReplicant({
      sampleDirectory: sample,
      replicationRecipeFile: recipe
    })
    success(`Replication process completed.`)
  }
}

module.exports = command
