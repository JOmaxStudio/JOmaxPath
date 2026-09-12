const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
let count = 0;
for (const file of fs.readdirSync('.').filter(f => f.endsWith('.js'))) {
  if (file === 'worker.js') {
    const result = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: fs.readFileSync(file), encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  } else new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
  count++;
}
for (const file of ['index.html', 'hero.html', 'pricing.html']) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const src = match[1].match(/src=["']([^"']+)/);
    if (src) {
      if (!/^https?:/.test(src[1])) assert.ok(fs.existsSync(src[1].split('?')[0]), `${file}: missing ${src[1]}`);
    } else if (!match[1].includes('ld+json')) {
      new vm.Script(match[2], { filename: file + ':inline' });
      count++;
    }
  }
}
console.log(`${count} scripts: syntax OK; local script references OK`);
