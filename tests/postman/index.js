#!/usr/bin/env node
const { program } = require('commander');
var newman = require('newman');

console.log('Traceability Interop Testing')

program.version('0.0.1');

program
    .option('-s, --service <file>', 'use the specified service provider test collection', './collections/service-providers.json')
    .option('-r, --reference <file>', 'use the specified reference VC test collection', './collections/reference-credentials.json');
// program
//     .option('-s, --service <file>', 'use the specified interop test collection', './collections/interop-credentials.json');

program
    .option('-sd, --servicedata <file>', 'use the specified service provider data collection', './data/service-providers.json')
    .option('-rd, --referencedata <file>', 'use the specified reference VC data collection', './data/reference-credentials.json');
// program
//     .option('-sd, --servicedata <file>', 'use the specified interop data collection', './data/interop-credentials.json');

program
    .option('-rd, --reportdir <folder>', 'use the specified service provider data collection', './newman');

program
    .option('-v, --verbose', 'verbose reporting', true);
program
    .option('-d, --dev', 'dev mode for advanced options', false);

program.parse();

var outputReporters = [ 'json', 'htmlextra' ]

if (program.opts().verbose) {
    outputReporters.push('cli');
}
if (program.opts().dev) {
    console.log('*** DEV MODE SET ***');
}


// first setup and run base service provider validation
newman.run({
    collection: require(program.opts().service),
    iterationData: require(program.opts().servicedata),
    reporters: outputReporters,
    reporter: {
        json: { export: program.opts().reportdir+'/service-provider-report.json' },
        htmlextra: { export: program.opts().reportdir+'/service-provider-report.html' }
    }
}, function (err) {
    if (err) { throw err; }
    console.log('Traceability Interop: Service Provider test complete');
});

// then run reference checks (this should loop each server from the service provider collection )
newman.run({
    collection: require(program.opts().reference),
    iterationData: require(program.opts().referencedata),
    reporters: outputReporters,
    reporter: {
        json: { export: program.opts().reportdir+'/reference-credentials-report.json' },
        htmlextra: { export: program.opts().reportdir+'/reference-credentials-report.html' }
    }
}, function (err) {
    if (err) { throw err; }
    console.log('Traceability Interop: Reference Credential test complete');
});