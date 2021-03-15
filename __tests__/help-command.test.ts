let { cli } = require('../test-infrasctructure/replication')
const semverRegex = require('semver-regex')

describe('Versioning', () => {

  test('It should output version', async () => {
    let output = await cli('--version')
    output = output.trim().replace('[0m', '').replace('[0m', '');

    const printedVersion = semverRegex().exec(output.trim())

    const isSemVer = semverRegex().test(printedVersion);
    expect(isSemVer).toEqual(true)
  })

  test('It should output help', async () => {
    // TODO improve this test
    const output = await cli('--help')
    
    const printedVersion = semverRegex().exec(output.trim())

    const isSemVer = semverRegex().test(printedVersion);
    expect(isSemVer).toEqual(true)
  })
})
