var expect  = require('chai').expect;
const { replicate, loadRecipe, readTemplateForRecipe, deleteTemplateForRecipe, readTemplateFileHeader, readTemplateFileContent } = require("./common/replication");

describe('File name and directory tree replacements', function () {
    const recipeFilePath = './test/fixtures/helloworld-to-hithere-recipe.json';
    const recipe = loadRecipe(recipeFilePath);
    const templateFiles = [];

    before(async function () {
        const output = await replicate('./test/fixtures/hello-world', recipeFilePath);
        console.log(`Replication output: ${output}`);

        readTemplateForRecipe(recipe).map(file => templateFiles.push(file));
    });

    after(function () {
        deleteTemplateForRecipe(recipe);
    });

    it('Should include all files in the source file tree', function() {
        expect(templateFiles.length).to.equal(3);        
    });

    it('Should use virtual path structure separated by hyphen', function() {
        // Hello
        // --There
        // ----World.js
        // turns into Hello-There-World.js.ejs.t
        expect(templateFiles).to.contain('Hello-There-World.js.ejs.t');
    });

    it('Should calculate the destiny path at root of the new project, applying file name replacements', async function() {
        const header1 = await readTemplateFileHeader(recipe, 'HelloWorld.js.ejs.t');
        const header2 = await readTemplateFileHeader(recipe, 'Hello.World.Guys.js.ejs.t');
        
        expect(header1.to).to.equal('<%= name %>/HiThere.js');
        expect(header2.to).to.equal('<%= name %>/Hi.There.Guys.js');
    });

    it('Should calculate the destiny path that restore original path structure, applying file name replacements', async function() {
        const header = await readTemplateFileHeader(recipe, 'Hello-There-World.js.ejs.t');

        expect(header.to).to.equal('<%= name %>/Hi/There/There.js');
    });

    it('Should use force option', async function() {
        const header = await readTemplateFileHeader(recipe, 'Hello-There-World.js.ejs.t');

        expect(header.force).to.equal(true);
    });

    it('Should use force option', async function() {
        const header = await readTemplateFileHeader(recipe, 'Hello-There-World.js.ejs.t');

        expect(header.force).to.equal(true);
    });

    it('Should insert alternative variables at the top of the content of each file', async function() {
        const content = await readTemplateFileContent(recipe, 'Hello-There-World.js.ejs.t');
        const firstLine = content.split('\n')[0];
        
        expect(firstLine).to.have.string('<% ');
        expect(firstLine).to.have.string('%>');

        const variableAssignments = firstLine
            .substr(0, firstLine.indexOf('%>') + 2)
            .replace('<%', '')
            .replace('%>', '')
            .replace(/ /g, '')
            .split(';')
            .map(x => x.trim())
            .filter(x => x != '')
            .map(function (x) {
                const parts = x.split('=');
                return { variableName: parts[0], value: parts[1] };
            });
        const expectedAssignments = [
            { variableName: 'NameUpperCase', value: 'name.toUpperCase()' },
            { variableName: 'NameLowerCase', value: 'name.toLowerCase()' },
            { variableName: 'NameLowerDasherized', value: 'h.inflection.dasherize(NameLowerCase)' },
            { variableName: 'NameCapitalized', value: 'h.inflection.capitalize(name)' }
        ];
        expect(variableAssignments.length).to.equal(expectedAssignments.length);
        for (var i = 0; i < expectedAssignments.length; i++) {
            let assignment = variableAssignments[i];
            let expectedAssignment = expectedAssignments[i];

            expect(assignment.variableName).to.equal(expectedAssignment.variableName);
            expect(assignment.value).to.equal(expectedAssignment.value);
        }
    });

    // it('Should apply all content replacements', async function() {
    //     const header = await readTemplateFileContent(recipe, 'Hello-There-World.js.ejs.t');

    //     expect(header.force).to.equal(true);
    // });
});