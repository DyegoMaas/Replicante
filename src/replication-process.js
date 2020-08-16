const fs = require('fs');
const { exec } = require('child_process');
const Replicator = require('./Replicator');
const ReplicationRecipe = require('./ReplicationRecipe');
const execa = require('execa');

const initializeTemplatesFolder = () => {
    try {
        const dir = './.replicant';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        console.log('Initializing Hygen.');
        const { stdout, stderr, failed } = execa.commandSync(
            'npx hygen init self', {
                shell: true,
                cwd: '.replicant'
            });

        if (failed)
            throw new Error('Unable to initialize Hygen:' + stderr);
        else
            console.log('Hygen initialized:', stdout);
    } catch (error) {
        console.error('Unable to initialize Hygen');
        throw error;
    }
};

const buildReplicator = (replicationInstructions) => {
    const { replicationRecipeFile } = replicationInstructions;
    const recipe = ReplicationRecipe.fromRecipeFile(replicationRecipeFile);

    const replicator = new Replicator(recipe);
    return replicator;
}

const generateReplicantTemplate = (replicator, replicationInstructions) => {
    const { sampleDirectory } = replicationInstructions;

    replicator.cleanTemplateDirectory();
    replicator.processRecipeFiles(sampleDirectory)
};

/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
function execShellCommand(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd: '.replicant' }, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
                reject(error);
            }
            resolve(stdout? stdout : stderr);
        });
    });
}

const generateReplicantFromTemplateExperimental = (replicator) => {
    const { templateName, replicantName } = replicator.replicationRecipe;
    console.log(`Replicating sample from ${templateName}. Generating ${replicantName}.`);

    const { stdout, stderr, failed } = execa.commandSync(
        `npx hygen ${templateName} new ${replicantName}`, {
            shell: true,
            cwd: '.replicant'
        });

    if (failed)
        throw new Error('Unable to complete replication: ' + error);
    else
        console.log('Replication process completed:', stdout);
};

const generateReplicantFromTemplate = async (replicator) => {
    const { templateName, replicantName } = replicator.replicationRecipe;
    console.log(`Replicating sample from ${templateName}. Generating ${replicantName}.`);
    return execShellCommand(`set HYGEN_OVERWRITE=1 && npx hygen ${templateName} new ${replicantName}`);
};

const generateReplicant = async (replicationInstructions) => {
    console.log('generating something');
    initializeTemplatesFolder();

    const replicator = buildReplicator(replicationInstructions);
    generateReplicantTemplate(replicator, replicationInstructions);

    // generateReplicantFromTemplateExperimental(replicator, replicationInstructions);
    await generateReplicantFromTemplate(replicator, replicationInstructions);
};

module.exports = {
    generateReplicant: generateReplicant
};