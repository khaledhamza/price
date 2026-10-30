// Checks that form-data-writer.js (what the admin page saves with) reproduces form-data.js
// exactly, so a save only ever changes the numbers that were edited.
// Usage: node tools/check-form-data.js

const fs = require('fs');
const path = require('path');
const W = require('../form-data-writer.js');

const file = path.resolve(__dirname, '..', 'form-data.js');
const source = fs.readFileSync(file, 'utf8');
const rendered = W.renderFormData(W.loadFormData(source).form);
if (rendered !== source) {
  const a = source.split('\n');
  const b = rendered.split('\n');
  const i = a.findIndex((line, n) => line !== b[n]);
  console.error('form-data.js and the writer differ at line ' + (i + 1) + ':\n  file:   ' + a[i] + '\n  writer: ' + b[i]);
  process.exit(1);
}
console.log('form-data.js round-trips through the writer unchanged');
