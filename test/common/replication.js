const { spawn, exec } = require('child_process'); // TODO refactor to use spawn instead (less memory intensive)
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const yaml = require('js-yaml');
var rimraf = require("rimraf");
const { generateReplicant } = require('../../src/replication-process');
const execa = require('execa');

const replicateCLI = async (samplePath, recipePath) => {
    try {
        const { stdout } = await execa.sync('node', ['./src/replicate.js', `--sample=${samplePath}`, `--recipe=${recipePath}`]);
        console.log(stdout);
    } catch (error) {
        console.log(error);
    }
}

const replicate = async (samplePath, recipePath) => {
    await generateReplicant({
        sampleDirectory: samplePath,
        replicationRecipeFile: recipePath
    });
    // return new Promise((resolve, error) => {
    //     try {
    //         generateReplicant({
    //             sampleDirectory: samplePath,
    //             replicationRecipeFile: recipePath
    //         });
    //         resolve();
    //     } catch (err) {
    //         error(err);
    //     }
    // });
}

const loadRecipe = (recipe) => {
    let rawData = fs.readFileSync(recipe);
    return JSON.parse(rawData);
}

const readTemplateForRecipe = (recipe) => {
    return fs.readdirSync(`./.replicant/_templates/${recipe.templateName}/new`);
}

// const deleteTemplateForRecipe = (recipe) => {
//     return new Promise((resolve, error) => {
//         rimraf(`./.replicant/_templates/${recipe.templateName}`, error);
//         resolve();
//     })
// }

const readTemplateFileHeader = async (recipe, fileName) => {
    const fileStream = fs.createReadStream(`./.replicant/_templates/${recipe.templateName}/new/${fileName}`);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let header = '';
    let dividerCount = 0;
    for await (const line of rl) {
        if (line.startsWith('---'))
            dividerCount++;
        else
            header += line + '\n';

        if (dividerCount == 2)
            break;
    }
    return yaml.safeLoad(header);
}

const readTemplateFileContent = async (recipe, fileName, options) => {
    const fileStream = fs.createReadStream(`./.replicant/_templates/${recipe.templateName}/new/${fileName}`);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let content = '';
    let dividerCount = 0;
    let isFirstLineOfContent = true;
    for await (const line of rl) {
        if (line.startsWith('---')) {
            dividerCount++;
            continue;
        }

        if (dividerCount == 2) {
            let contentLine = line;
            if (isFirstLineOfContent && options && options.ignoreVariables) {
                contentLine = line.slice(line.indexOf('%>') + 2);
            }
            content += contentLine + '\n';
            isFirstLineOfContent = false;
        }
    }
    return content;
}

// const generateReplicantFrom = async (recipe) => {
//     return execShellCommand(`cd ./src && hygen ${recipe.templateName} new ${recipe.replicantName}`)
// };

// const deleteReplicantFromRecipe = (recipe) => {
//     return new Promise((resolve, error) => {
//         rimraf(`./.replicant/_template/${recipe.replicantName}`, error);
//         resolve();
//     })
// };

const deleteReplicantDirectory = () => {
    try {
        return rimraf.sync('./.replicant');
    } catch(e) {
        console.error(e);
        return false;
    }
    // return new Promise((resolve, error) => {
    //     rimraf.sync('./.replicant', error);
    //     resolve();
    // })
}

const readReplicantFileContent = async (recipe, fileNameParts) => {
    const targetFile = path.join(...fileNameParts);
    const filePath = path.join('.replicant', recipe.replicantName, targetFile);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Replicant file ${filePath} not found.`)
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let content = '';
    for await (const line of rl) {
        content += line + '\n';
    }
    return content;
}

module.exports = {
    replicateCLI: replicateCLI,
    replicate: replicate,
    loadRecipe: loadRecipe,
    readTemplateForRecipe: readTemplateForRecipe,
    // deleteTemplateForRecipe: deleteTemplateForRecipe,
    readTemplateFileHeader: readTemplateFileHeader,
    readTemplateFileContent: readTemplateFileContent,
    // generateReplicantFrom: generateReplicantFrom,
    // deleteReplicantFromRecipe: deleteReplicantFromRecipe,
    deleteReplicantDirectory: deleteReplicantDirectory,
    readReplicantFileContent: readReplicantFileContent
}