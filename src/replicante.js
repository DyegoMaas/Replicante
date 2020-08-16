#!/usr/bin/env node

const { generateReplicant } = require('./replication-process');

var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('create', 'Creates a new project applying recipe instructions on the sample', builder => {
        builder
            .alias('s', 'from-sample').nargs('s', 1).describe('s', 'The sample to replicate')
            .alias('r', 'with-recipe').nargs('r', 1).describe('r', 'The recipe for replication, which includes detailed instructions for content replacements')
            .demandOption(['s', 'r'])
            .example('$0 create --from-sample=~/MySample --with-recipe=MyRecipe.json', 'Creates a Replicant project based on MySample, applying the replacement instructions in MyRecipe.json');
    })
    .example('$0 create --from-sample=~/MySample --with-recipe=MyRecipe.json', 'Creates a Replicant project based on MySample, applying the replacement instructions in MyRecipe.json')
    .demandCommand(1, 'You need at least one command before moving on. Try "replicante create" ;).')
    .help('h')
    .alias('h', 'help')
    .argv;
console.log(`Will use ${argv.fromSample} as sample for replication process.`);
console.log(`Replication recipe loaded: ${argv.withRecipe}`);

(async () => {
    console.log('STARTING REPLICATION PROCESS...')
    await generateReplicant({
        sampleDirectory: argv.fromSample,
        replicationRecipeFile: argv.withRecipe
    });
})().catch(e => {
    console.error(e);
});;
