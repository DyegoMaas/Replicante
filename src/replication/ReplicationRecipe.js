const path = require('path')

module.exports = class ReplicationRecipe {
  constructor(
    replicantName,
    templateName,
    templateDir,
    fileNameReplacements,
    sourceCodeReplacements,
    ignoreArtifacts,
    delimiters,
    customVariables
  ) {
    this.replicantName = replicantName
    this.templateName = templateName
    this.templateDir = templateDir
    this.fileNameReplacements = this._makeSyntaxCompatibleWithMustacheView(fileNameReplacements)
    this.sourceCodeReplacements = this._makeSyntaxCompatibleWithMustacheView(sourceCodeReplacements)
    this.ignoreArtifacts = ignoreArtifacts
    this.delimiters = delimiters
    this.customVariables = customVariables
  }

  _makeSyntaxCompatibleWithMustacheView(array) {
    let modifiedArray = []
    array.forEach(transformation => {
      let {from, to} = transformation
      
      let modifiedTo = to
        .replace('.toLowerCase()', 'LowerCase')
        .replace('.toUpperCase()', 'UpperCase')
        .replace('.toLowerDasherized()', 'LowerDasherized')
        .replace('.toUpperDasherized()', 'UpperDasherized')
        .replace('.toLowerUnderscored()', 'LowerUnderscored')
        .replace('.toUpperUnderscored()', 'UpperUnderscored');

      modifiedArray.push({
        from: from,
        to: modifiedTo
      })
    });
    
    return modifiedArray
  }

  static fromRecipeJson(data, replicantWorkDir) {
    const timestamp = new Date()
      .toISOString()
      .replace(/T/, '_')
      .replace(/\..+/, '')
      .replace(/:/g, '-')
    const templateName =
      data.templateName || `${data.replicantName}_${timestamp}`

    const customVariables = [
      { 'name': 'name', 'value': data.replicantName }, // kept for retro-compatibility
      { 'name': 'replicantName', 'value': data.replicantName }
    ]
    if (data.customVariables) {
      for (let i = 0; i < data.customVariables.length; i++) {
        customVariables.push(data.customVariables[i])
      }
    }
    
    return new ReplicationRecipe(
      data.replicantName,
      templateName,
      path.join(replicantWorkDir, '_templates', templateName),
      data.fileNameReplacements,
      data.sourceCodeReplacements,
      data.ignoreArtifacts || [],
      data.customDelimiters || ['<<:', ':>>'],
      customVariables
    )
  }
}
