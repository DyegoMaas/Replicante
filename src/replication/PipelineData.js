module.exports = class PipelineData {
  constructor(descriptorPath, toolbox) {    
    this.descriptorPath = descriptorPath
    this.toolbox = toolbox

    this.binaryFiles = []
  }

  // saves a binary file descriptor to later copy to the right place
  pushBinaryFile(source, targetDestination) {
    this.binaryFiles.push({source, targetDestination})
  }

  saveToDisk() {
    const { writeFile } = this.toolbox
    const content = JSON.stringify(this._getBinaryFiles())
    writeFile(this.descriptorPath, content)
  }

  _getBinaryFiles() {
    return this.binaryFiles
  }
}