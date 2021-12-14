#!/usr/bin/env node
import { program, Option } from 'commander';
import https from 'https';
import newman from 'newman';
import isUrl from 'is-url-superb';
import ky from 'ky-universal';
import fs from 'fs';

console.log('Traceability Interop Testing');

program.version('0.0.1');
program.name('trace-interop-test');

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

program.option('-rd, --reportdir <folder>', 'use the specified service provider data collection', './newman');
program.addOption(
    new Option('-t, --tests <all...>', 'use the specified tests, "none" is provided as an option for dev purposes')
        .choices(['all', 'service', 'reference', 'interop', 'none'])
        .default(['all'])
);
program.addOption(
    new Option('-d, --dids <key, web, all...>', 'use the specified did methods')
        // .choices(['key', 'web', 'all'])
        .default(['key'])
);
program.addOption(
    new Option('-n, --names <all...>', 'test only the service provider as identified by name')
        .default(['all'])
);

program
    .option('-v, --verbose', 'verbose reporting')
    .option('-dev, --dev', 'dev mode for advanced options');

program.parse();

const outputReporters = ['json', 'htmlextra'];

if (program.opts().verbose) {
    outputReporters.push('cli');
}
if (program.opts().dev) {
    console.log('*** DEV MODE SET ***');
}

const serviceCollection = JSON.parse(fs.readFileSync(program.opts().service, 'utf8'));
const serviceData = JSON.parse(fs.readFileSync(program.opts().servicedata, 'utf8'));
const referenceCollection = JSON.parse(fs.readFileSync(program.opts().reference, 'utf8'));
const referenceData = JSON.parse(fs.readFileSync(program.opts().referencedata, 'utf8'));

function getServiceIdx(name) {
    return serviceData.findIndex(((obj) => obj.name == name));
}

const urlExist = async (url) => {
	if (typeof url !== 'string') {
        // console.log(url, 'not string!');
		throw new TypeError(`Expected a string, got ${typeof url}`);
	}

	if (!isUrl(url)) {
        // console.log(url, 'not url!');
		return false;
	}

	const response = await ky.head(url, {
		throwHttpErrors: false
	});

    // console.log(url, 'response:', response.status);
    // return response !== undefined && (response.status < 400 || response.status >= 500)
	return response !== undefined && response.status < 500; // using lt 500 to work around some issues on .well-known
};

// run a base sanity check...
async function livenessCheck() {
    console.log('Quick liveness tests on service providers...');
    for (const serv of serviceData) {
        if (program.opts().names.includes(serv.name) || program.opts().names.includes('all')) {
            console.log('Checking', serv.name);
            const spExists = await urlExist(serv.serviceProvider.provider.url);
            const didExists = await urlExist(`https://${serv.serviceProvider.baseURL}/.well-known/did-configuration.json`);
            console.log('\t', serv.serviceProvider.provider.url, spExists);
            console.log('\t', `https://${serv.serviceProvider.baseURL}/.well-known/did-configuration.json`, didExists);
            if (spExists && didExists) {
                serviceData[getServiceIdx(serv.name)].live = true;
                console.log(' *', serv.name, 'is alive.');
            } else {
                serviceData[getServiceIdx(serv.name)].live = false;
                console.log(' * ERR:', serv.name, 'is not alive!');
            }
        } else {
            console.log('Skipping', serv.name, 'due to config');
        }
    }
}

// TODO: set reporter templates for htmlextra

// first setup and run base service provider validation
// TODO: add collection check to skip iter data if server is not alive since we know it will fail
async function spCheck() {
    if (program.opts().tests.includes('all') || program.opts().tests.includes('service')) {
        newman.run({
            collection: serviceCollection,
            iterationData: serviceData,
            reporters: outputReporters,
            reporter: {
                json: { export: `${program.opts().reportdir}/service-provider-report.json` },
                htmlextra: { export: `${program.opts().reportdir}/service-provider-report.html` }
            }
        }, (err) => {
            if (err) { throw err; }
            console.log('Traceability Interop: Service Provider test complete');
        });
    }
}

async function testServiceProviderReference(serv) {
    if (program.opts().verbose) console.log(serv);
    if (!serviceData[getServiceIdx(serv.name)].live) {
        console.log('Skipping', serv.name);
        return;
    }

    // get did from .well-known
    const didConfigURL = `https://${serv.serviceProvider.baseURL}/.well-known/did-configuration.json`;
    if (program.opts().verbose) console.log('Testing did-config:', didConfigURL);

    https.get(didConfigURL, (res) => {
        let body = '';

        res.on('data', (chunk) => {
            body += chunk;
        });

        res.on('end', () => {
            try {
                const didConfig = JSON.parse(body);
                if (program.opts().verbose) console.log(didConfig);
                // loop each provided did
                for (const did of didConfig.linked_dids) {
                    const didMethod = did.issuer.split(':')[1];

                    if (!program.opts().dids.includes(didMethod)) {
                        if (!program.opts().dids.includes('all')) {
                            continue;
                        }
                    }

                    const jsonReportFile = `${program.opts().reportdir}/${serv.serviceProvider.baseURL}/${didMethod}-reference-credentials-report.json`;
                    const htmlReportFile = `${program.opts().reportdir}/${serv.serviceProvider.baseURL}/${didMethod}-reference-credentials-report.html`;

                    newman.run({
                        collection: referenceCollection,
                        iterationData: referenceData,
                        reporters: outputReporters,
                        reporter: {
                            json: { export: jsonReportFile },
                            htmlextra: { export: htmlReportFile }
                        },
                        envVar: [
                            { key: 'name', value: serv.name },
                            { key: 'server', value: serv.serviceProvider.baseURL },
                            { key: 'prefix', value: serv.serviceProvider.vcPrefix },
                            { key: 'did', value: did.issuer },
                        ]
                    }, (err) => {
                        if (err) { throw err; }
                    });
                    console.log('Traceability Interop: Reference Credential test complete:', serv.name, '  did:', didMethod);
                }
            } catch (error) {
                console.error(error.message);
                serviceData[getServiceIdx(serv.name)].live = false;
            }
        });
    }).on('error', (error) => {
        console.error(error.message);
        serviceData[getServiceIdx(serv.name)].live = false;
    });
}

// then run reference checks (this should loop each server from the service provider collection )
async function refChecks() {
    if (program.opts().tests.includes('all') || program.opts().tests.includes('reference')) {
        // loop each service provider
        for (const serv of serviceData) {
            await testServiceProviderReference(serv);
        }
        console.log('Traceability Interop: Reference Credential tests complete');
    }
}

// actually run the tests
(async () => {
    console.log('Liveness check starting...');
    livenessCheck().then(async () => {
        console.log('Liveness check complete.\n');
        const spCheckResult = spCheck();
        const refCheckResult = refChecks();
        const result = await Promise.all([spCheckResult, refCheckResult]);
    });
})();
