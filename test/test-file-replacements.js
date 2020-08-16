var expect  = require('chai').expect;
const {
    replicate, replicateCLI, loadRecipe,
    readTemplateForRecipe, readTemplateFileHeader, readTemplateFileContent,
    deleteReplicantDirectory,
    readReplicantFileContent } = require("./common/replication");

describe('File name and directory tree replacements', () => {
    const recipeFilePath = './test/fixtures/helloworld-to-hithere-recipe.json';
    const recipe = loadRecipe(recipeFilePath);
    const templateFiles = [];

    before(async () => {
        await deleteReplicantDirectory();

        await replicate('./test/fixtures/hello-world', recipeFilePath);
        // await replicateCLI('./test/fixtures/hello-world', recipeFilePath);

        readTemplateForRecipe(recipe).map(file => templateFiles.push(file));
    });

    it('Should include all expected files in the source file tree', () => {
        expect(templateFiles.length).to.equal(3);
    });

    it('Should use virtual path structure separated by hyphen', () => {
        // Hello
        // --There
        // ----World.js
        // turns into Hello-There-World.js.ejs.t
        expect(templateFiles).to.contain('Hello-There-World.js.ejs.t');
    });

    it('Should ignore files marked as to be ignored', () => {
        expect(templateFiles).to.not.contain('Bye-Guys.js.ejs.t');
    });

    it('Should calculate the destiny path at root of the new project, applying file name replacements', async () => {
        const header1 = await readTemplateFileHeader(recipe, 'HelloWorld.js.ejs.t');
        const header2 = await readTemplateFileHeader(recipe, 'Hello.World.Guys.js.ejs.t');

        expect(header1.to).to.equal('<%= name %>/HiThere.js');
        expect(header2.to).to.equal('<%= name %>/Hi.There.Guys.js');
    });

    it('Should calculate the destiny path that restore original path structure, applying file name replacements', async () => {
        const header = await readTemplateFileHeader(recipe, 'Hello-There-World.js.ejs.t');

        expect(header.to).to.equal('<%= name %>/Hi/There/There.js');
    });

    it('Should use force option', async () => {
        const header = await readTemplateFileHeader(recipe, 'Hello-There-World.js.ejs.t');

        expect(header.force).to.equal(true);
    });

    it('Should use force option', async () => {
        const header = await readTemplateFileHeader(recipe, 'Hello-There-World.js.ejs.t');

        expect(header.force).to.equal(true);
    });

    it('Should insert alternative variables at the top of the content of each file', async () => {
        const content = await readTemplateFileContent(recipe, 'Hello-There-World.js.ejs.t', { 
            ignoreVariables: false
        });
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
        for (let i = 0; i < expectedAssignments.length; i++) {
            let assignment = variableAssignments[i];
            let expectedAssignment = expectedAssignments[i];

            expect(assignment.variableName).to.equal(expectedAssignment.variableName);
            expect(assignment.value).to.equal(expectedAssignment.value);
        }
    });

    it('Should apply all content replacements', async () => {
        const content = await readTemplateFileContent(recipe, 'HelloWorld.js.ejs.t', {
            ignoreVariables: true
        });

        let lines = content.split('\n');
        expect(lines[0]).to.equal('console.log(\'Hi My People\');');
        expect(lines[1]).to.equal('console.log(\'"Hi There!"\');');
        expect(lines[2]).to.equal('console.log(\'"Just, hey world?"\');');
        expect(lines[3]).to.equal('console.log(\'Name = Special<%= name %>\');');
    });

    describe('Replicant generation', () => {
        it('Should genereate files in root, with content properly replaced', async () => {
            let content = await readReplicantFileContent(recipe, ['HiThere.js']);

            let lines = content.split('\n');
            expect(lines[0]).to.equal('console.log(\'Hi My People\');');
            expect(lines[1]).to.equal('console.log(\'"Hi There!"\');');
            expect(lines[2]).to.equal('console.log(\'"Just, hey world?"\');');
            expect(lines[3]).to.equal('console.log(\'Name = SpecialHiThere\');');


            content = await readReplicantFileContent(recipe, ['Hi.There.Guys.js']);

            lines = content.split('\n');
            expect(lines[0]).to.equal('console.log(\'Hi My People Guys\');');
        });

        it('Should genereate nested files, with content properly replaced', async () => {
            let content = await readReplicantFileContent(recipe, ['Hi', 'There', 'There.js']);

            let lines = content.split('\n');
            expect(lines[0]).to.equal('console.log(\'Hi My People\');');
            expect(lines[1]).to.equal('console.log(\'HiThere...\');');
        });
    });
});