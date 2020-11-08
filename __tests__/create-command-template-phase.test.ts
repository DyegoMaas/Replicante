import {
    createReplicant,
    readTemplateFileHeader,
    readTemplateFileContent,
    templateFileExists,
    readReplicantFileContent
} from '../test-infrasctructure/replication'

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


describe('The template name is optional in the recipe', () => {

    test('If not informed, the template name will be the replicante name plus a timestamp', async () => {
        const { recipe, } = await createReplicant(
            'hello-world',
            'helloworld-to-hithere-recipe-without-template-name.json'
        )

        const fileExists = templateFileExists(
            recipe,
            'HelloWorld.js.ejs.t'
        )

        expect(fileExists).toBeTruthy()
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

    test('Should warn use that custom delimiters must be of length two', async () => {
        const { output } = await createReplicant(
            'hello-world',
            'helloworld-to-hithere-recipe-with-invalid-delimiter.json'
        )

        expect(output).toContain('An error has ocurred')
        expect(output).toContain('Custom delimiters should have length of 2')
    })
})

describe('Handling template files in samples should not cause inception problems', () => {
    test('Should copy the final project into the target directory', async () => {
        const { recipe } = await createReplicant(
            'template-inception',
            'template-inception-recipe.json'
        )

        let content = readReplicantFileContent(recipe, [
            'template-big-mustache.t'
        ])

        let lines = content.split('\n').map(x => x.trimRight())
        expect(lines[0]).toEqual('This is a {{ adjective }} file inception;')
        expect(lines[1]).toEqual('')
        expect(lines[2]).toEqual('Some compliments for you:')
        expect(lines[3]).toEqual('{{#compliments}}')
        expect(lines[4]).toEqual(' - The compliment is {{.}}')
        expect(lines[5]).toEqual('{{/compliments}}')
    })
})