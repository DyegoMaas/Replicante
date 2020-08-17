const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const Replicator = require('./Replicator');
const ReplicationRecipe = require('./ReplicationRecipe');
const execa = require('execa');
const { homedir } = require('os');

const resolveReplicantWorkDir = () => {
    return path.join(homedir(), '.replicant').replace(/\\/g, '/');
}

const initializeTemplatesFolder = () => {
    try {
        const dir = resolveReplicantWorkDir();
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const hygenIsInitialized = fs.existsSync(path.join(dir, '_templates'));
        if (hygenIsInitialized) {
            console.log('Skipping Hygen initialization.');
            return;
        }

        console.log('Initializing Hygen.');
        const { stdout, stderr, failed } = execa.commandSync(
            'npx hygen init self', {
                shell: true,
                cwd: resolveReplicantWorkDir()
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
    const recipe = ReplicationRecipe.fromRecipeFile(replicationRecipeFile, resolveReplicantWorkDir());

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
        exec(cmd, { cwd: resolveReplicantWorkDir() }, (error, stdout, stderr) => {
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
            cwd: resolveReplicantWorkDir()
        });

    if (failed)
        throw new Error('Unable to complete replication: ' + stderr);
    else
        console.log('Replication process completed:', stdout);
};

const generateReplicantFromTemplate = async (replicator) => {
    const { templateName, replicantName } = replicator.replicationRecipe;
    console.log(`Replicating sample from ${templateName}. Generating ${replicantName}.`);
    return execShellCommand(`set HYGEN_OVERWRITE=1 && npx hygen ${templateName} new ${replicantName}`);
};

const generateReplicant = async (replicationInstructions) => {
    initializeTemplatesFolder();

    const replicator = buildReplicator(replicationInstructions);
    generateReplicantTemplate(replicator, replicationInstructions);

    // generateReplicantFromTemplateExperimental(replicator, replicationInstructions);
    await generateReplicantFromTemplate(replicator, replicationInstructions);
};

module.exports = { generateReplicant, resolveReplicantWorkDir };