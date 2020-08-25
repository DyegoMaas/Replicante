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
    test('It should output version', async () => {
      const output = await cli('--version')
      expect(output).toContain('0.7.2')
    })

    test('It should output help', async () => {
      // TODO improve this test
      const output = await cli('--help')
      expect(output).toContain('0.7.2')
    })
  })

  const createReplicant = async (fixtureRecipeToUse, options?) => {
    const samplePath = filesystem.resolve(
      './test-infrasctructure/fixtures/hello-world'
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
          'helloworld-to-hithere-recipe.json'
        )

        expect(output).toContain('Replication process completed')
      })

      test('Should include all expected files in the source file tree', async () => {
        const { templateFiles } = await createReplicant(
          'helloworld-to-hithere-recipe.json'
        )

        expect(templateFiles.length).toEqual(3)
      })

      test('Should use virtual path structure separated by hyphen', async () => {
        const { templateFiles } = await createReplicant(
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
          'helloworld-to-hithere-recipe.json'
        )

        expect(templateFiles).not.toContain('Bye-Guys.js.ejs.t')
      })

      test('Should calculate the destiny path at root of the new project, applying file name replacements', async () => {
        const { recipe } = await createReplicant(
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

        expect(header1.to).toEqual('{{ name }}/HiThere.js')
        expect(header2.to).toEqual('{{ name }}/Hi.There.Guys.js')
      })

      test('Should calculate the destiny path that restore original path structure, applying file name replacements', async () => {
        const { recipe } = await createReplicant(
          'helloworld-to-hithere-recipe.json'
        )

        const header = await readTemplateFileHeader(
          recipe,
          'Hello-There-World.js.ejs.t'
        )

        expect(header.to).toEqual('{{ name }}/Hi/There/There.js')
      })

      test('Should apply all content replacements', async () => {
        const { recipe } = await createReplicant(
          'helloworld-to-hithere-recipe.json'
        )

        const content = readTemplateFileContent(recipe, 'HelloWorld.js.ejs.t')

        let lines = content.split('\n').map(x => x.trim())
        expect(lines[0]).toEqual("console.log('Hi My People')")
        expect(lines[1]).toEqual("console.log('Hi There!')")
        expect(lines[2]).toEqual("console.log('Just, hey world?')")
        expect(lines[3]).toEqual("console.log('Name = Special{{ name }}')")
      })
    })

    describe('Replicant generation', () => {
      test('Should genereate files in root, with content properly replaced', async () => {
        const { recipe } = await createReplicant(
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
    })
  })

  describe('Target option', () => {
    let targetDirectory = ''

    beforeAll(() => {
      targetDirectory = filesystem.path(resolveReplicantWorkDir(), 'TargetDir')
    })

    test('Should copy the final project into the target directory', async () => {
      const { recipe } = await createReplicant(
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
})
