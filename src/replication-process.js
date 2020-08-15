const Replicator = require('./Replicator');
const ReplicationRecipe = require('./ReplicationRecipe');

const update_template = (replicationInstructions) => { // TODO rename
    const { sampleDirectory, replicationRecipeFile } = replicationInstructions;
    const recipe = ReplicationRecipe.fromRecipeFile(replicationRecipeFile);

    const replicator = new Replicator(recipe);
    replicator.cleanTemplateDirectory();
    replicator.processRecipeFiles(sampleDirectory)
};

module.exports = {
    generateReplicant: update_template
};