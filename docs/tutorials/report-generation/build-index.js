/* eslint-disable no-unused-expressions */
/* eslint-disable function-paren-newline */
const path = require('path');
const fs = require('fs');
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

  files.sort((a, b) =>
    // eslint-disable-next-line implicit-arrow-linebreak
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  );

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

const buildReportsIndex = () => {
  const reports = readFilesSync(path.join(__dirname, '../../reports'))
    .filter((f) => f.name !== 'index' && ['.json', '.html'].includes(f.ext))
    // blocked by https://github.com/perma-id/w3id.org/pull/2620
    // .map((f) => `https://w3id.org/traceability/interoperability/reports/${f.name + f.ext}`);
    .map((f) => `https://w3c-ccg.github.io/traceability-interop/reports/${f.name + f.ext}`);

  fs.writeFileSync(path.join(__dirname, '../../reports/index.json'), JSON.stringify({ items: reports }, null, 2));
};

(() => {
  cleanAndMoveReports('./newman');
  buildReportsIndex();
  // consider removing reports older than 1 month / 1 year...
})();
