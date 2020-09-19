
// var cli = async cmd =>
//   system.run('node ' + filesystem.path(src, 'bin', 'replicante') + ` ${cmd}`)

import {
  createReplicant,
  readReplicantFileContent
} from '../test-infrasctructure/replication'

// var createReplicant = async (
//   sampleDirectory,
//   fixtureRecipeToUse,
//   options?
// ) => {
//   await filesystem.removeAsync(resolveReplicantWorkDir())

//   let samplePath = filesystem.resolve(
//     `./test-infrasctructure/fixtures/${sampleDirectory}`
//   )
//   let recipeFilePath = filesystem.resolve(
//     `./test-infrasctructure/fixtures/${fixtureRecipeToUse}`
//   )
//   return await cli(`create ${samplePath} ${recipeFilePath} ${options}`).then(
//     cliOutput => {
//       const recipe = loadRecipe(recipeFilePath)
//       return {
//         recipe,
//         output: cliOutput,
//         templateFiles: readTemplateForRecipe(recipe)
//       }
//     }
//   )
// }

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
})