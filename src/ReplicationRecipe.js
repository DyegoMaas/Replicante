const fs = require('fs');

module.exports = class ReplicationRecipe {
    constructor(templateName, templateDir, fileNameReplacements, sourceCodeReplacements, ignoreArtifacts) {
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
            data.templateName,
            `./src/_templates/${data.templateName}`, // TODO review
            data.fileNameReplacements,
            data.sourceCodeReplacements,
            data.ignoreArtifacts
        );
    };
};