var expect  = require('chai').expect;
const { replicate, loadRecipe, readTemplateForRecipe, deleteTemplateForRecipe } = require("./common/replication");

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
});