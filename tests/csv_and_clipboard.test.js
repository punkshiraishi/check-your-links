const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function loadUtils() {
  const code = fs.readFileSync('extension/lib/utils.js', 'utf8');
  const sandbox = { window: {}, document: {}, Utils: undefined };
  // Provide minimal DOM shims used by exportToCSV (not used in pure builders)
  sandbox.document.createElement = () => ({ click() {}, href: '', download: '' });
  sandbox.URL = { createObjectURL: () => '' };
  vm.createContext(sandbox);
  // Execute library code, then expose the global lexical 'Utils' binding to sandbox
  vm.runInContext(code + '\n;this.__UTILS__ = (typeof Utils !== "undefined" ? Utils : undefined);', sandbox, { filename: 'utils.js' });
  return sandbox.__UTILS__;
}

const Utils = loadUtils();

// CSV build tests
(function testCsvBuildBasic() {
  const rows = [
    { url: 'https://a.com', status: 200, statusText: 'OK', responseTime: 10, location: 'div.a' },
    { url: 'https://b.com', status: 404, statusText: 'Not Found', responseTime: 20, location: 'div.b' }
  ];
  const csv = Utils.buildCSVFromResults(rows);
  const lines = csv.split('\r\n');
  assert.strictEqual(lines.length, 3);
  assert.strictEqual(lines[0], 'URL,Status,Status Text,Response Time (ms),Location');
  assert.ok(lines[1].startsWith('https://a.com,200,OK,10,'));
  assert.ok(lines[2].startsWith('https://b.com,404,Not Found,20,'));
})();

(function testCsvEscaping() {
  const rows = [
    { url: 'https://a.com/?q=1,2', status: 200, statusText: 'OK', responseTime: 10, location: 'div, a' },
    { url: 'https://b.com/"quote"', status: 200, statusText: 'OK', responseTime: 10, location: 'line\nwrap' }
  ];
  const csv = Utils.buildCSVFromResults(rows);
  const lines = csv.split('\r\n');
  assert.ok(/"https:\/\/a\.com\/\?q=1,2"/.test(lines[1]));
  assert.ok(/"https:\/\/b\.com\/""quote"""/.test(lines[2]));
  assert.ok(/"div, a"$/.test(lines[1]));
  assert.ok(/"line\nwrap"$/.test(lines[2]));
})();

// Clipboard TSV build tests (5 columns, no Error)
(function testTsvBuild() {
  const headers = ['URL', 'Status', 'Status Text', 'Response Time (ms)', 'Location'];
  const rows = [
    ['https://a.com', '200', 'OK', '10', 'div.a'],
    ['https://b.com', '404', 'Not Found', '20', 'div.b']
  ];
  const tsv = Utils.buildTSV(headers, rows);
  const lines = tsv.split('\n');
  assert.strictEqual(lines[0], headers.join('\t'));
  assert.strictEqual(lines[1], rows[0].join('\t'));
  assert.strictEqual(lines[2], rows[1].join('\t'));
})();

console.log('All tests passed');
