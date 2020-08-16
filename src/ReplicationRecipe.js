const fs = require('fs');

module.exports = class ReplicationRecipe {
    constructor(replicantName, templateName, templateDir, fileNameReplacements, sourceCodeReplacements, ignoreArtifacts) {
        this.replicantName = replicantName;
        this.templateName = templateName;
        this.templateDir = templateDir;
        this.fileNameReplacements = fileNameReplacements;
        this.sourceCodeReplacements = sourceCodeReplacements;
        this.ignoreArtifacts = ignoreArtifacts;
    }

    static fromRecipeFile(recipeFilePath) {
        let rawData = fs.readFileSync(recipeFilePath);
        let data = JSON.parse(rawData);

        return new ReplicationRecipe(
            data.replicantName,
            data.templateName,
            `./.replicant/_templates/${data.templateName}`, // TODO review
            data.fileNameReplacements,
            data.sourceCodeReplacements,
            data.ignoreArtifacts
        );
    };
};