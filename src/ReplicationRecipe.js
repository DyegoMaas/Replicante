const fs = require('fs');

module.exports = class ReplicationRecipe {
    constructor(templateName, templateDir, fileNameReplacements, sourceCodeReplacements, directoriesToIgnore) {
        this.templateName = templateName;
        this.templateDir = templateDir;
        this.fileNameReplacements = fileNameReplacements;
        this.sourceCodeReplacements = sourceCodeReplacements;
        this.directoriesToIgnore = directoriesToIgnore;
    }

    static fromRecipeFile(recipeFilePath) {
        let rawData = fs.readFileSync(recipeFilePath);
        let data = JSON.parse(rawData);

        return new ReplicationRecipe(
            data.templateName,
            `./src/_templates/${data.templateName}`, // TODO review
            data.file_name_replacements,
            data.sourceCodeReplacements,
            data.ignoreDirectories
        );
    };
};