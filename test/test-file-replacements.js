var expect  = require('chai').expect;
const { replicate, loadRecipe, readTemplateForRecipe, deleteTemplateForRecipe, readTemplateFileHeader } = require("./common/replication");

describe('File name and directory tree replacements', function () {
    const recipeFilePath = './test/fixtures/helloworld-to-hithere-recipe.json';
    const recipe = loadRecipe(recipeFilePath);
    const templateFiles = [];

    before(async function () {
        const output = await replicate('./test/fixtures/hello-world', recipeFilePath);
        console.log(`Replication output: ${output}`);

        readTemplateForRecipe(recipe).map(file => templateFiles.push(file));
    });

    // after(function () {
    //     deleteTemplateForRecipe(recipe);
    // });

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
});