import {
  filesystem,
} from 'gluegun'
  
  import {
    createReplicant
  } from '../test-infrasctructure/replication'
  
  const {
    resolveReplicantWorkDir
  } = require('../src/replication/replication-process')
  
describe('Target option', () => {
  let targetDirectory = ''

  beforeAll(() => {
    targetDirectory = filesystem.path(resolveReplicantWorkDir(), 'TargetDir')
  })

  test('Should copy the final project into the target directory', async () => {
    const { recipe } = await createReplicant(
        'hello-world',
        'helloworld-to-hithere-recipe.json',
        `--target="${targetDirectory}"`
    )

    let targetedReplicantDir = filesystem.path(
        targetDirectory,
        recipe.replicantName
    )

    const replicantDirExists = !!filesystem.exists(targetedReplicantDir)
    expect(replicantDirExists).toEqual(true)

    const fileTree = filesystem.inspectTree(targetedReplicantDir)
    expect(fileTree.children.length).toBe(3)

    const filesAndFolders = fileTree.children.map(child => child.name)
    expect(filesAndFolders).toEqual(['Hi', 'Hi.There.Guys.js', 'HiThere.js'])
  })
})