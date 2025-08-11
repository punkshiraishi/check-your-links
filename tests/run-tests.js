const { execSync } = require('child_process');
const fs = require('fs');

function runNodeTest(file) {
  console.log('Running', file);
  execSync(`node ${file}`, { stdio: 'inherit' });
}

const testFiles = fs.readdirSync('tests').filter(f => f.endsWith('.test.js'));
for (const f of testFiles) {
  runNodeTest(`tests/${f}`);
}
