#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const yargs = require('yargs/yargs');
const reportCleaner = require('./newman-json-sanitizer');

const readFilesSync = (dir) => {
  const files = [];
  fs.readdirSync(dir).forEach((filename) => {
    const { name, ext } = path.parse(filename);

    const filepath = path.resolve(dir, filename);
    const stat = fs.statSync(filepath);
    const isFile = stat.isFile();
    if (isFile) {
      files.push({
        filepath,
        name,
        ext,
        stat,
        content: fs.readFileSync(filepath).toString(),
      });
    }
  });

  const sortArgs = {
    numeric: true,
    sensitivity: 'base',
  };

  files.sort((a, b) => a.name.localeCompare(b.name, undefined, sortArgs));
  return files;
};

const cleanAndMoveReports = (relativePath) => {
  readFilesSync(path.join(process.cwd(), relativePath)).map((f) => {
    const cleanerName = (f.name + f.ext).replace('newman-run-report-', '');
    let { content } = f;
    if (f.ext === '.json') {
      content = JSON.stringify(reportCleaner(JSON.parse(content)), null, 2);
    }
    fs.writeFileSync(path.join(__dirname, `../../reports/${cleanerName}`), content);
    return cleanerName;
  });
};

const buildReportsIndex = (folder) => {
  const reports = readFilesSync(path.join(__dirname, '../../reports'))
    .filter((f) => f.name !== 'index' && ['.json', '.html'].includes(f.ext))
    .map((f) => `https://w3id.org/traceability/interoperability/reports/${folder}/${f.name + f.ext}`);
  fs.writeFileSync(path.join(__dirname, '../../reports/index.json'), JSON.stringify({ items: reports }, null, 2));
};

(() => {
  const { argv } = yargs(process.argv.slice(2))
    .option('index', {
      default: true,
      describe: 'Generate index.json, negate with --no-index.',
      type: 'boolean',
    })
    .option('sanitize', {
      default: true,
      describe: 'Sanitize and collect test output, negate with --no-sanitize.',
      type: 'boolean',
    })
    .option('folder', {
      describe: 'Subfolder to use when generating index.json links. Required unless --no-index is specified.',
      type: 'string',
      choices: ['interoperability', 'conformance'],
      alias: 'f',
    })
    .check((args, _) => {
      if (args.index && !args.folder) {
        throw new Error('Missing required argument: folder');
      }
      return true;
    });

  if (argv.sanitize) {
    try {
      cleanAndMoveReports('./newman');
    } catch (e) {
      console.log(e);
      console.log('No newman reports to clean');
    }
  }

  if (argv.index) {
    buildReportsIndex(argv.folder);
  }

  // consider removing reports older than 1 month / 1 year...
})();
