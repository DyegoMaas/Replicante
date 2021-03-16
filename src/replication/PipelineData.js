module.exports = class PipelineData {
  constructor(descriptorPath, toolbox) {
    this.descriptorPath = descriptorPath
    this.toolbox = toolbox

    this.binaryFiles = []
  }

  // saves a binary file descriptor to later copy to the right place
  pushBinaryFile(source, targetDestination) {
    this.binaryFiles.push({
      from: source,
      to: targetDestination
    })
  }

  saveToDisk() {
    const { writeFile } = this.toolbox
    const content = JSON.stringify(this.getBinaryFiles())
    writeFile(this.descriptorPath, content)
  }

  loadFromDisk() {
    const { readFile } = this.toolbox
    return JSON.parse(readFile(this.descriptorPath))
  }

  getBinaryFiles() {
    return this.binaryFiles
  }
}
