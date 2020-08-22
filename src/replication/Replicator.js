const fs = require('fs')
const path = require('path')
var rimraf = require('rimraf')

module.exports = class Replicator {
  constructor(replicationRecipe) {
    this.replicationRecipe = replicationRecipe
    this.replicationDirectory = path.join(replicationRecipe.templateDir, 'new') // TODO inject via constructor
  }

  cleanTemplateDirectory() {
    const templateDir = this.replicationDirectory
    rimraf.sync(templateDir)

    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true })
    }
  }

  processRecipeFiles(sampleDirectory) {
    this.#processFilesInDirectoryRecursive(sampleDirectory, sampleDirectory)
  }

  #processFilesInDirectoryRecursive = (currentPath, rootPath) => {
    console.log('Processing directory', currentPath)

    fs.readdirSync(currentPath).forEach(file => {
      const fullPath = path.join(currentPath, file)

      if (this.replicationRecipe.ignoreArtifacts.indexOf(file) > -1) {
        return
      }

      if (fs.lstatSync(fullPath).isFile()) {
        const relativePath = path.relative(rootPath, fullPath)
        const middlePath = relativePath.replace(path.basename(relativePath), '')
        const virtualPath = path
          .join(middlePath, file)
          .replace(/\\/g, '-')
          .replace(/\//g, '-')

        this.#toTemplate(
          fullPath,
          path.join(this.replicationDirectory, virtualPath),
          relativePath
        )
        return
      }

      this.#processFilesInDirectoryRecursive(fullPath, rootPath)
    })
  }

  #toTemplate = (src, dest, relativePath) => {
    const fullPathSrc = path.resolve(src)
    const fullPathDest = path.resolve(`${dest}.ejs.t`)
    console.log(`Generating template from ${fullPathSrc} to ${fullPathDest}`)

    const destDir = path.dirname(fullPathDest)
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }
    fs.copyFileSync(fullPathSrc, fullPathDest) // merge two parts

    let targetPath = relativePath.replace(/\\/g, '/')
    targetPath = this.#replaceTermsInText(
      targetPath,
      this.replicationRecipe.fileNameReplacements
    )
    let frontmatter = [
      '---',
      `to: "{{ props.name }}/${targetPath}"`,
      '---'
    ]
    this.#prepareFile(
      fullPathDest,
      frontmatter,
      this.replicationRecipe.sourceCodeReplacements
    )
  }

  #replaceTermsInText = (text, replacements) => {
    replacements.forEach(replacement => {
      const { from, to } = replacement
      text = text.split(from).join(to)
    })
    return text
  }

  // TODO rename to prepareFiles
  #prepareFile = (
    filePath,
    metadataLines,
    sourceCodeReplacements
  ) => {
    let originalContent = fs.readFileSync(filePath).toString()

    //metadata file
    // let writes = 0
    let writeStream = fs.createWriteStream(filePath, { flags: 'w' })
    metadataLines.forEach(line => {
      line = this.#replaceTermsInText(line, sourceCodeReplacements) // why?
      // writeStream.cork()
      writeStream.write(`${line}\n`)
      // writes++
    })

    let adjustedContent = this.#replaceTermsInText(
      originalContent,
      sourceCodeReplacements
    )
    // writeStream.cork()
    writeStream.write(adjustedContent)
    // writes++

    // for(let i = 0; i < writes; i++)
    //   writeStream.uncork()
    // writeStream.destroy()
    writeStream.end()
  }
}
