var expect  = require('chai').expect;
const { spawn, exec } = require('child_process'); // TODO refactor to use spawn instead (less memory intensive)
const { replicate } = require("./common/replication")

describe('File name and directory tree replacements', function () {
    before(async function () {
        const output = await replicate('./test/fixtures/hello-world', './test/fixtures/helloworld-to-hithere-recipe.json');
        console.log(`Replication output: ${output}`);
    });

    it('Should replace file name sctructure', function() {
        expect('Hello World').to.equal('Hello World');
    });
});