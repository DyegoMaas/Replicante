const fs = require('fs');
const path = require('path');
var rimraf = require("rimraf");
const { Console } = require('console');

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
                const relativePath = path.relative(rootPath, fullPath);
                const middlePath = relativePath.replace(path.basename(relativePath), '');
                const virtualPath = path.join(middlePath, file).replace(/\\/g, '-').replace(/\//g, '-');
                console.log('RELATIVITY', fullPath, rootPath, 'BASENAME', path.basename(relativePath), 'RELATIVE_PATH', relativePath, 'MIDDLE_PATH', middlePath, 'VIRTUAL_PATH', virtualPath);

                this.#toTemplate(fullPath, path.join(this.replicationRecipe.templateDir, 'new', virtualPath), relativePath);
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
        const fullPathSrc = path.resolve(src);
        const fullPathDest = path.resolve(`${dest}.ejs.t`);
        console.log(`Generating template from ${fullPathSrc} to ${fullPathDest}`);

        const destDir = path.dirname(fullPathDest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(fullPathSrc, fullPathDest) // merge two parts
        // removeBom(fullPathDest) // TODO verify if it is necessary

        let targetPath = relativePath.replace(/\\/g, '/');
        targetPath = this.#replaceTermsInText(targetPath, this.replicationRecipe.fileNameReplacements);
        let frontmatter = [
            '---',
            `to: <%= name %>/${targetPath}`,
            'force: true',
            '---'
        ];
        let variables = '<% '
            + 'NameUpperCase = name.toUpperCase();'
            + 'NameLowerCase = name.toLowerCase();'
            + 'NameLowerDasherized = h.inflection.dasherize(NameLowerCase);'
            + 'NameCapitalized = h.inflection.capitalize(name); %>';
            // TODO take other variables Hygen prompt
        this.#prepareFile(fullPathDest, frontmatter, variables, this.replicationRecipe.sourceCodeReplacements);
    }

    #replaceTermsInText = (text, replacements) => {
        let originalText = text;
        replacements.forEach(replacement => {
            const {from, to} = replacement;
            text = text.split(from).join(to);
        });
        console.log('ORIGINAL_TEXT=', originalText, 'WITH_REPLACEMENTS', replacements, 'GENERATED ->', text);
        return text;
    };

    #prepareFile = (filePath, linesToPrepend, variables, sourceCodeReplacements) => {
        let originalContent = fs.readFileSync(filePath).toString();

        var writeStream = fs.createWriteStream(filePath, { flags: 'w' });
        linesToPrepend.forEach(line => {
            writeStream.write(`${line}\n`);
        });
        writeStream.write(variables.trimLeft());

        let adjustedContent = this.#replaceTermsInText(originalContent, sourceCodeReplacements);
        writeStream.write(adjustedContent);
    };
};