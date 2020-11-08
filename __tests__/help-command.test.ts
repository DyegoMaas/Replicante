let { cli } = require('../test-infrasctructure/replication')

describe('Versioning', () => {
  const expectedVersion = '1.0.0'

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
