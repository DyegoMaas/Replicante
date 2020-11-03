import {
  createReplicant,
  readReplicantFileContent,
  readReplicantBinaryFile,
  readSampleBinaryFile
} from '../test-infrasctructure/replication'

describe('Replicant generation', () => {
  test('Should genereate files in root, with content properly replaced', async () => {
    const { recipe } = await createReplicant(
      'hello-world',
      'helloworld-to-hithere-recipe.json'
    )

    let content = readReplicantFileContent(recipe, ['HiThere.js'])

    let lines = content.split('\n').map(x => x.trim())
    expect(lines[0]).toEqual("console.log('Hi My People')")
    expect(lines[1]).toEqual("console.log('Hi There!')")
    expect(lines[2]).toEqual("console.log('Just, hey world?')")
    expect(lines[3]).toEqual("console.log('Name = SpecialHiThere')")

    content = readReplicantFileContent(recipe, ['Hi.There.Guys.js'])

    lines = content.split('\n').map(x => x.trim())
    expect(lines[0]).toEqual("console.log('Hi My People Guys')")
  })

  test('Should genereate nested files, with content properly replaced', async () => {
    const { recipe } = await createReplicant(
      'hello-world',
      'helloworld-to-hithere-recipe.json'
    )

    let content = readReplicantFileContent(recipe, [
      'Hi',
      'There',
      'There.js'
    ])

    let lines = content.split('\n').map(x => x.trim())
    expect(lines[0]).toEqual("console.log('Hi My People')")
    expect(lines[1]).toEqual("console.log('HiThere...')")
  })

  test('Should replace all default variables', async () => {
    const { recipe } = await createReplicant(
      'variables',
      'variables-recipe.json'
    )

    let content = readReplicantFileContent(recipe, ['all-the-variables.js'])

    let lines = content.split('\n').map(x => x.trim())
    expect(lines[0]).toEqual("console.log('TheTitanic')")
    expect(lines[1]).toEqual("console.log('thetitanic')")
    expect(lines[2]).toEqual("console.log('THETITANIC')")
    expect(lines[3]).toEqual("console.log('the-titanic')")
    expect(lines[4]).toEqual("console.log('THE-TITANIC')")
  })

  test('Should just copy the binary files', async () => {
    const { recipe } = await createReplicant(
      'project-with-binary-files',
      'project-with-binary-files.json'
    )

    const shouldProcessTextFilesNormally = () => {
      let content = readReplicantFileContent(recipe, ['DeckardStory.txt'])
      
      let lines = content.split('\n').map(x => x.trim())
      expect(lines[0]).toEqual("This is the story of Replicant.")
    }
    shouldProcessTextFilesNormally()

    const shouldJustCopyTheBinaryFile = (fileNameParts) => {
      let content = readSampleBinaryFile(recipe, ['project-with-binary-files', ...fileNameParts])
      let contentTwo = readReplicantBinaryFile(recipe, fileNameParts)

      expect(content).toEqual(contentTwo)
    }
    shouldJustCopyTheBinaryFile(['unicorn.jpg'])
    shouldJustCopyTheBinaryFile(['some-folder', 'deckard.jpg'])
  })
})