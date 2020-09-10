const {
  system,
  filesystem,
  print: { info }
} = require('gluegun')
const src = filesystem.path(__dirname, '..')

const cli = async cmd =>
  system.run('node ' + filesystem.path(src, 'bin', 'replicante') + ` ${cmd}`)

const {
  loadRecipe,
  readTemplateForRecipe,
  readTemplateFileHeader,
  readTemplateFileContent,
  templateFileExists,
  deleteReplicantDirectory,
  readReplicantFileContent
} = require('../test-infrasctructure/replication')

const {
  generateReplicant,
  resolveReplicantWorkDir
} = require('../src/replication/replication-process')

describe('CLI tests', () => {
    describe('Versioning', () => {
    const expectedVersion = '0.10.0'

    test('It should output version', async () => {
      const output = await cli('--version')
      expect(output).toContain(expectedVersion)
    })

    test('It should output help', async () => {
      // TODO improve this test
      const output = await cli('--help')
      expect(output).toContain(expectedVersion)
    })
  })
})
