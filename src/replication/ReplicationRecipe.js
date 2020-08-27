const fs = require('fs')
const path = require('path')

module.exports = class ReplicationRecipe {
  constructor(
    replicantName,
    templateName,
    templateDir,
    fileNameReplacements,
    sourceCodeReplacements,
    ignoreArtifacts,
    delimiters
  ) {
    this.replicantName = replicantName
    this.templateName = templateName
    this.templateDir = templateDir
    this.fileNameReplacements = fileNameReplacements
    this.sourceCodeReplacements = sourceCodeReplacements
    this.ignoreArtifacts = ignoreArtifacts
    this.delimiters = delimiters
  }

  static fromRecipeFile(recipeFilePath, replicantWorkDir) {
    let rawData = fs.readFileSync(recipeFilePath)
    let data = JSON.parse(rawData)

    return new ReplicationRecipe(
      data.replicantName,
      data.templateName,
      path.join(replicantWorkDir, '_templates', data.templateName),
      data.fileNameReplacements,
      data.sourceCodeReplacements,
      data.ignoreArtifacts,
      data.delimiters = data.customDelimiters || ['<<:', ':>>'] // TODO validate delimiters
    )
  }
}
