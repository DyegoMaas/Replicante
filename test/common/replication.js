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
        await execa('node', ['./src/replicate.js', `--sample=${samplePath}`, `--recipe=${recipePath}`]);
    } catch (error) {
        console.log(error);
    }
}

const replicate = async (samplePath, recipePath) => {
    return new Promise((resolve, error) => {
        try {
            generateReplicant({
                sampleDirectory: samplePath,
                replicationRecipeFile: recipePath
            });
            resolve();
        } catch (err) {
            error(err);
        }
    });
}

const loadRecipe = (recipe) => {
    let rawData = fs.readFileSync(recipe);
    return JSON.parse(rawData);
}

const readTemplateForRecipe = (recipe) => {
    return fs.readdirSync(`./src/_templates/${recipe.templateName}/new`);
}

const deleteTemplateForRecipe = (recipe) => {
    return new Promise((resolve, error) => {
        rimraf(`./src/_templates/${recipe.templateName}`, error);
        resolve();
    })
}

const readTemplateFileHeader = async (recipe, fileName) => {
    const fileStream = fs.createReadStream(`./src/_templates/${recipe.templateName}/new/${fileName}`);
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
    const fileStream = fs.createReadStream(`./src/_templates/${recipe.templateName}/new/${fileName}`);
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

const generateReplicantFrom = async (recipe) => {
    return execShellCommand(`cd ./src && hygen ${recipe.templateName} new ${recipe.replicantName}`)
};

const deleteReplicantFromRecipe = (recipe) => {
    return new Promise((resolve, error) => {
        rimraf(`./src/${recipe.replicantName}`, error);
        resolve();
    })
};

const readReplicantFileContent = async (recipe, fileNameParts) => {
    const filePath = path.join(...fileNameParts);
    const fileStream = fs.createReadStream(`./src/${recipe.replicantName}/${filePath}`);
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
    deleteTemplateForRecipe: deleteTemplateForRecipe,
    readTemplateFileHeader: readTemplateFileHeader,
    readTemplateFileContent: readTemplateFileContent,
    generateReplicantFrom: generateReplicantFrom,
    deleteReplicantFromRecipe: deleteReplicantFromRecipe,
    readReplicantFileContent: readReplicantFileContent
}