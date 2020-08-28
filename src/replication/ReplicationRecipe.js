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

  static fromRecipeJson(data, replicantWorkDir) {
    return new ReplicationRecipe(
      data.replicantName,
      data.templateName,
      path.join(replicantWorkDir, '_templates', data.templateName),
      data.fileNameReplacements,
      data.sourceCodeReplacements,
      data.ignoreArtifacts || [],
      data.delimiters = data.customDelimiters || ['<<:', ':>>']
    )
  }
}
