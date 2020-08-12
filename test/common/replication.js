const { spawn, exec } = require('child_process'); // TODO refactor to use spawn instead (less memory intensive)
const fs = require('fs');

/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
function execShellCommand(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
            }
            resolve(stdout? stdout : stderr);
        });
    });
}
   
const replicate = async function(sample, recipe) {
    return execShellCommand(`python ./src/replicate.py --sample=${sample} --recipe=${recipe}`)
}

const loadRecipe = function(recipe) {
    let rawData = fs.readFileSync(recipe);
    return JSON.parse(rawData);
}

const readTemplateForRecipe = function(recipe) {
    return fs.readdirSync(`./src/_templates/${recipe.templateName}/new`);
}

const deleteTemplateForRecipe = function(recipe) {
    return fs.rmdirSync(`./src/_templates/${recipe.templateName}`, { recursive: true });
}

module.exports = {
    replicate: replicate,
    loadRecipe: loadRecipe,
    readTemplateForRecipe: readTemplateForRecipe,
    deleteTemplateForRecipe: deleteTemplateForRecipe
}