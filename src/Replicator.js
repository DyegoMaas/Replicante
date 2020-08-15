const fs = require('fs');
const path = require('path');
var rimraf = require("rimraf");

module.exports = class Replicator {
    constructor(replicationRecipe) {
        this.replicationRecipe = replicationRecipe;
        console.log('my recipe is', replicationRecipe);
    }

    cleanTemplateDirectory() {
        const templateDir = this.replicationRecipe.templateDir;
        if (!fs.existsSync(templateDir)) {
            fs.mkdirSync(templateDir);
        }

        const newCommandDir = path.join(templateDir, 'new');
        rimraf.sync(newCommandDir);

        if (!fs.existsSync(newCommandDir)) {
            fs.mkdirSync(newCommandDir);
        }
    }

    processRecipeFiles(sampleDirectory) {
        this.#processFilesInDirectoryRecursive(sampleDirectory, sampleDirectory);
    }

    #processFilesInDirectoryRecursive = (currentPath, rootPath) => {
        console.log('Processing directory', currentPath, fs.readdirSync(currentPath));

        fs.readdirSync(currentPath).forEach(file => {
            const fullPath = path.join(currentPath, file);

            if (fs.lstatSync(fullPath).isFile()) {
                const relativePath = path.relative(fullPath, rootPath);
                const middlePath = relativePath.replace(path.basename(relativePath), '');
                const virtualPath = path.join(middlePath, file).replace('\\', '-').replace('/', '-');

                this.#toTemplate(fullPath, `${this.replicationRecipe.templateDir}/new/${virtualPath}`, relativePath);
                return;
            }

            const directory = file;
            if (this.replicationRecipe.directoriesToIgnore.indexOf(directory) > -1) {
                console.log('Ignoring directory', directory);
                return;
            }

            this.#processFilesInDirectoryRecursive(fullPath, rootPath);
        });
    };

    #toTemplate = (src, dest, relativePath) => {
        console.log('toTemplate', src, dest, relativePath);
    }
};