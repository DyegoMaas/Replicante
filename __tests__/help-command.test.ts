var {
  system,
  filesystem,
  print: { info }
} = require('gluegun')
var src = filesystem.path(__dirname, '..')

var cli = async cmd =>
  system.run('node ' + filesystem.path(src, 'bin', 'replicante') + ` ${cmd}`)

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
