const {
  system,
  filesystem,
  print: { info }
} = require('gluegun')
const src = filesystem.path(__dirname, '..')

const cli = async cmd =>
  system.run('node ' + filesystem.path(src, 'bin', 'replicante') + ` ${cmd}`)

const {
  loadRecipe,
  readTemplateForRecipe,
  readTemplateFileHeader,
  readTemplateFileContent,
  deleteReplicantDirectory,
  readReplicantFileContent
} = require('../test-infrasctructure/replication')

const {
  generateReplicant,
  resolveReplicantWorkDir
} = require('../src/replication/replication-process')

describe('CLI tests', () => {
  beforeAll(() => {
    filesystem.remove(resolveReplicantWorkDir())
  })

  describe('Versioning', () => {
    const expectedVersion = '0.8.0'

    test('It should output version', async () => {
      const output = await cli('--version')
      expect(output).toContain(expectedVersion)
    })

    test('It should output help', async () => {
      // TODO improve this test
      const output = await cli('--help')
      expect(output).toContain(expectedVersion)
    })
  })

  const createReplicant = async (sampleDirectory, fixtureRecipeToUse, options?) => {
    const samplePath = filesystem.resolve(
      `./test-infrasctructure/fixtures/${sampleDirectory}`
    )
    const recipeFilePath = filesystem.resolve(
      `./test-infrasctructure/fixtures/${fixtureRecipeToUse}`
    )

    return await cli(`create ${samplePath} ${recipeFilePath} ${options}`).then(
      cliOutput => {
        const recipe = loadRecipe(recipeFilePath)
        return {
          recipe,
          output: cliOutput,
          templateFiles: readTemplateForRecipe(recipe)
        }
      }
    )
  }

  describe('Replication process', () => {

    describe('Intermediate template generation', () => {

      test('It should complete the replication without errors, showing the result path', async () => {
        const { output } = await createReplicant(
          'hello-world',
          'helloworld-to-hithere-recipe.json'
        )

        expect(output).toContain('Replication process completed')
      })

      test('Should include all expected files in the source file tree', async () => {
        const { templateFiles } = await createReplicant(
          'hello-world',
          'helloworld-to-hithere-recipe.json'
        )

        expect(templateFiles.length).toEqual(3)
      })

      test('Should use virtual path structure separated by hyphen', async () => {
        const { templateFiles } = await createReplicant(
          'hello-world',
          'helloworld-to-hithere-recipe.json'
        )

        // Hello
        // --There
        // ----World.js
        // turns into Hello-There-World.js.ejs.t
        expect(templateFiles).toContain('Hello-There-World.js.ejs.t')
      })

      test('Should ignore files marked as to be ignored', async () => {
        const { templateFiles } = await createReplicant(
          'hello-world',
          'helloworld-to-hithere-recipe.json'
        )

        expect(templateFiles).not.toContain('Bye-Guys.js.ejs.t')
      })

      test('Should calculate the destiny path at root of the new project, applying file name replacements', async () => {
        const { recipe } = await createReplicant(
          'hello-world',
          'helloworld-to-hithere-recipe.json'
        )

        const header1 = await readTemplateFileHeader(
          recipe,
          'HelloWorld.js.ejs.t'
        )
        const header2 = await readTemplateFileHeader(
          recipe,
          'Hello.World.Guys.js.ejs.t'
        )

        expect(header1.to).toEqual('<<: name :>>/HiThere.js')
        expect(header2.to).toEqual('<<: name :>>/Hi.There.Guys.js')
      })

      test('Should calculate the destiny path that restore original path structure, applying file name replacements', async () => {
        const { recipe } = await createReplicant(
          'hello-world',
          'helloworld-to-hithere-recipe.json'
        )

        const header = await readTemplateFileHeader(
          recipe,
          'Hello-There-World.js.ejs.t'
        )

        expect(header.to).toEqual('<<: name :>>/Hi/There/There.js')
      })

      test('Should apply all content replacements', async () => {
        const { recipe } = await createReplicant(
          'hello-world',
          'helloworld-to-hithere-recipe.json'
        )

        const content = readTemplateFileContent(recipe, 'HelloWorld.js.ejs.t')

        let lines = content.split('\n').map(x => x.trim())
        expect(lines[0]).toEqual("console.log('Hi My People')")
        expect(lines[1]).toEqual("console.log('Hi There!')")
        expect(lines[2]).toEqual("console.log('Just, hey world?')")
        expect(lines[3]).toEqual("console.log('Name = Special<<: name :>>')")
      })
    })

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
  })

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

  describe('Custom delimiter configuration', () => {

    test('Should use the custom delimiter from the recipeto avoid template inception, if informed', async () => {
      const { recipe } = await createReplicant(
        'hello-world',
        'helloworld-to-hithere-recipe-with-custom-delimiter.json'
      )

      let content = readTemplateFileContent(recipe, 'HelloWorld.js.ejs.t')
      let lines = content.split('\n').map(x => x.trim())
      expect(lines[3]).toEqual("console.log('Name = Special<!!! name !!!>')")

      content = readReplicantFileContent(recipe, ['HiThere.js'])
      lines = content.split('\n').map(x => x.trim())
      expect(lines[3]).toEqual("console.log('Name = SpecialHiThere')")
    })
  })

  describe('Handling template files in samples should not cause inception problems', () => {

    test('Should copy the final project into the target directory', async () => {
      const { recipe } = await createReplicant(
        'template-inception',
        'template-inception-recipe.json'
      )

      let content = readReplicantFileContent(recipe, ['template-big-mustache.t'])

      let lines = content.split('\n').map(x => x.trimEnd())
      expect(lines[0]).toEqual("This is a {{ adjective }} file inception;")
      expect(lines[1]).toEqual("")
      expect(lines[2]).toEqual("Some compliments for you:")
      expect(lines[3]).toEqual("{{#compliments}}")
      expect(lines[4]).toEqual(" - The compliment is {{.}}")
      expect(lines[5]).toEqual("{{/compliments}}")
    })
  })
})
