#!/usr/bin/env node

const { generateReplicant } = require('./replication-process');

var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('count', 'Count the lines in a file')
    .example('$0 count -f foo.js', 'count the lines in the given file')
    .alias('s', 'sample')
    // .nargs('s', 1)
    .describe('s', 'The sample to replicate')
    .alias('r', 'recipe')
    // .nargs('r', 1)
    .describe('r', 'The recipe for replication')
    .demandOption(['s', 'r'])
    .help('h')
    .alias('h', 'help')
    // .epilog('copyright 2020')
    .argv;
console.log(`Will use ${argv.sample} as sample for replication process.`);
console.log(`Replication recipe loaded: ${argv.recipe}`);

generateReplicant({
    sampleDirectory: argv.sample,
    replicationRecipeFile: argv.recipe
});

// var fs = require('fs');
// var s = fs.createReadStream(argv.file);

// var lines = 0;
// s.on('data', function (buf) {
//     lines += buf.toString().match(/\n/g).length;
// });

// s.on('end', function () {
//     console.log(lines);
// });