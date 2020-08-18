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
} = require('../test-infrasctructure/replication');

const {generateReplicant, resolveReplicantWorkDir} = require('../src/replication/replication-process');

describe('CLI tests', () => {
    beforeAll(() => {
        filesystem.remove(resolveReplicantWorkDir());
    });

    describe('Versioning', () => {
        test('It should output version', async () => {
            const output = await cli('--version')
            expect(output).toContain('0.5.2')
        });

        test('It should output help', async () => {
            // TODO improve this test
            const output = await cli('--help')
            expect(output).toContain('0.5.2')
        });
    });

    const createReplicant = (done, exportResults, fixtureRecipeToUse, options?) => {
        const samplePath = filesystem.resolve('./test-infrasctructure/fixtures/hello-world');
        const recipeFilePath = filesystem.resolve(`./test-infrasctructure/fixtures/${fixtureRecipeToUse}`);

        cli(`create ${samplePath} ${recipeFilePath} ${options}`)
            .then((cliOutput) => {
                const recipe = loadRecipe(recipeFilePath);
                return {
                    recipe,
                    output: cliOutput,
                    templateFiles: readTemplateForRecipe(recipe)
                }
            })
            .then((exports) => {
                exportResults(exports);
            })
            .then(done);
    };

    describe('File name and directory tree replacements', () => {
        let recipe = null;
        let templateFiles = [];
        let output = '';

        beforeAll((done) => {
            createReplicant(done, (exports) => {
                recipe = exports.recipe;
                templateFiles = exports.templateFiles;
                output = exports.output;
            }, 'helloworld-to-hithere-recipe.json');
        });

        test('It should complete the replication without errors, showing the result path', async () => {
            expect(output).toContain('Replication process completed')
        });

        test('Should include all expected files in the source file tree', () => {
            expect(templateFiles.length).toEqual(3)
        })

        test('Should use virtual path structure separated by hyphen', () => {
            // Hello
            // --There
            // ----World.js
            // turns into Hello-There-World.js.ejs.t
            expect(templateFiles).toContain('Hello-There-World.js.ejs.t');
        });

        test('Should ignore files marked as to be ignored', () => {
            expect(templateFiles).not.toContain('Bye-Guys.js.ejs.t');
        });

        test('Should calculate the destiny path at root of the new project, applying file name replacements', async () => {
            const header1 = await readTemplateFileHeader(recipe, 'HelloWorld.js.ejs.t');
            const header2 = await readTemplateFileHeader(recipe, 'Hello.World.Guys.js.ejs.t');

            expect(header1.to).toEqual('<%= name %>/HiThere.js');
            expect(header2.to).toEqual('<%= name %>/Hi.There.Guys.js');
        });

        test('Should calculate the destiny path that restore original path structure, applying file name replacements', async () => {
            const header = await readTemplateFileHeader(recipe, 'Hello-There-World.js.ejs.t');

            expect(header.to).toEqual('<%= name %>/Hi/There/There.js');
        });

        test('Should use force option', async () => {
            const header = await readTemplateFileHeader(recipe, 'Hello-There-World.js.ejs.t');

            expect(header.force).toEqual(true);
        });

        test('Should use force option', async () => {
            const header = await readTemplateFileHeader(recipe, 'Hello-There-World.js.ejs.t');

            expect(header.force).toEqual(true);
        });

        test('Should insert alternative variables at the top of the content of each file', async () => {
            const content = await readTemplateFileContent(recipe, 'Hello-There-World.js.ejs.t', {
                ignoreVariables: false
            });
            const firstLine = content.split('\n')[0];

            expect(firstLine).toMatch(/<% /);
            expect(firstLine).toMatch(/%>/);

            const variableAssignments = firstLine
                .substr(0, firstLine.indexOf('%>') + 2)
                .replace('<%', '')
                .replace('%>', '')
                .replace(/ /g, '')
                .split(';')
                .map(x => x.trim())
                .filter(x => x != '')
                .map(x => {
                    const parts = x.split('=');
                    return { variableName: parts[0], value: parts[1] };
                });
            const expectedAssignments = [
                { variableName: 'NameUpperCase', value: 'name.toUpperCase()' },
                { variableName: 'NameLowerCase', value: 'name.toLowerCase()' },
                { variableName: 'NameLowerDasherized', value: 'h.inflection.dasherize(NameLowerCase)' },
                { variableName: 'NameCapitalized', value: 'h.inflection.capitalize(name)' }
            ];
            expect(variableAssignments.length).toEqual(expectedAssignments.length);
            for (let i = 0; i < expectedAssignments.length; i++) {
                let assignment = variableAssignments[i];
                let expectedAssignment = expectedAssignments[i];

                expect(assignment.variableName).toEqual(expectedAssignment.variableName);
                expect(assignment.value).toEqual(expectedAssignment.value);
            }
        });

        test('Should apply all content replacements', async () => {
            const content = await readTemplateFileContent(recipe, 'HelloWorld.js.ejs.t', {
                ignoreVariables: true
            });

            let lines = content.split('\n');
            expect(lines[0]).toEqual('console.log(\'Hi My People\');');
            expect(lines[1]).toEqual('console.log(\'"Hi There!"\');');
            expect(lines[2]).toEqual('console.log(\'"Just, hey world?"\');');
            expect(lines[3]).toEqual('console.log(\'Name = Special<%= name %>\');');
        });

        describe('Replicant generation', () => {
            test('Should genereate files in root, with content properly replaced', async () => {
                let content = await readReplicantFileContent(recipe, ['HiThere.js']);

                let lines = content.split('\n');
                expect(lines[0]).toEqual('console.log(\'Hi My People\');');
                expect(lines[1]).toEqual('console.log(\'"Hi There!"\');');
                expect(lines[2]).toEqual('console.log(\'"Just, hey world?"\');');
                expect(lines[3]).toEqual('console.log(\'Name = SpecialHiThere\');');

                content = await readReplicantFileContent(recipe, ['Hi.There.Guys.js']);

                lines = content.split('\n');
                expect(lines[0]).toEqual('console.log(\'Hi My People Guys\');');
            });

            test('Should genereate nested files, with content properly replaced', async () => {
                let content = await readReplicantFileContent(recipe, ['Hi', 'There', 'There.js']);

                let lines = content.split('\n');
                expect(lines[0]).toEqual('console.log(\'Hi My People\');');
                expect(lines[1]).toEqual('console.log(\'HiThere...\');');
            });
        });
    })

    describe('Target option', () => {
        let targetDirectory = filesystem.path(resolveReplicantWorkDir(), 'TargetDir');
        let recipe = null;

        beforeAll((done) => {
            const exportResults = (exports) => {
                recipe = exports.recipe;
            };
            createReplicant(done, exportResults,
                'helloworld-to-hithere-recipe-with-target.json',
                `--target="${targetDirectory}"`
            );
        });

        test('Should copy the final project into the target directory', () => {
            let targetedReplicantDir = filesystem.path(targetDirectory, recipe.replicantName);

            const replicantDirExists = !!filesystem.exists(targetedReplicantDir);
            expect(replicantDirExists).toEqual(true);

            const fileTree = filesystem.inspectTree(targetedReplicantDir);
            expect(fileTree.children.length).toBe(3);

            const filesAndFolders = fileTree.children.map(child => child.name);
            expect(filesAndFolders).toEqual(['Hi', 'Hi.There.Guys.js', 'HiThere.js']);
        });
    });
});