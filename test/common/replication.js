const { spawn, exec } = require("child_process"); // TODO refactor to use spawn instead (less memory intensive)

/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
function execShellCommand(cmd) {
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
            }
            resolve(stdout? stdout : stderr);
        });
    });
}
   
const replicate = async function(sample, recipe) {
    return execShellCommand(`python ./src/replicate.py --sample=${sample} --recipe=${recipe}`)
    // var x = 'lalala';
    // exec(`python ./src/replicate.py --sample=${sample} --recipe=${recipe}`, (error, stdout, stderr) => {
    //     if (error) {
    //         console.log(`error: ${error.message}`);
    //         done();
    //         return;
    //     }
    //     if (stderr) {
    //         console.log(`stderr: ${stderr}`);
    //         done();
    //         return;
    //     }
    //     console.log(`stdout: ${stdout}`);
    //     x = x + 'lu';
    //     done();
    // });
    // return x;
}

module.exports = {
    replicate: replicate
}