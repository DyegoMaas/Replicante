const { spawn, exec } = require('child_process'); // TODO refactor to use spawn instead (less memory intensive)
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const yaml = require('js-yaml')

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
   
const replicate = async (samplePath, recipePath) => {
    return execShellCommand(`python ./src/replicate.py --sample=${samplePath} --recipe=${recipePath}`)
}

const loadRecipe = (recipe) => {
    let rawData = fs.readFileSync(recipe);
    return JSON.parse(rawData);
}

const readTemplateForRecipe = (recipe) => {
    return fs.readdirSync(`./src/_templates/${recipe.templateName}/new`);
}

const deleteTemplateForRecipe = (recipe) => {
    return fs.rmdirSync(`./src/_templates/${recipe.templateName}`, { recursive: true });
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
    return fs.rmdirSync(`./src/${recipe.replicantName}`, { recursive: true });
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