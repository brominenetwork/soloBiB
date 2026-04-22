console.log('Starting...');

const fs = require('fs');
const path = require('path');

const folder = process.argv[2];
if (!folder) { console.error('Provide a folder path'); process.exit(1); }

const abs = path.resolve(folder);
console.log('Looking in:', abs);

if (!fs.existsSync(abs)) { console.error('Folder not found:', abs); process.exit(1); }

const files = fs.readdirSync(abs).filter(f => /\.html?$/i.test(f));
console.log(`Found ${files.length} HTML file(s)`);

const SIGNALS = [
  /0x[0-9a-f]{2,}/i,
  /while\s*\(\s*!!\s*\[\s*\]\s*\)/,
  /parseInt\s*\(\s*0x[0-9a-f]+\s*\)/i,
  /_0x[0-9a-f]+/i,
];

function isObfuscated(code) {
  return SIGNALS.filter(r => r.test(code)).length >= 3;
}

let total = 0;
for (const file of files) {
  const filePath = path.join(abs, file);
  const html = fs.readFileSync(filePath, 'utf8');
  let count = 0;
  const cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, match => {
    const inner = (match.match(/<script[^>]*>([\s\S]*?)<\/script>/i) || [])[1] || '';
    if (isObfuscated(inner)) { count++; return ''; }
    return match;
  });
  if (count > 0) {
    fs.writeFileSync(filePath, cleaned, 'utf8');
    console.log(`  Cleaned ${count} block(s) from: ${file}`);
    total += count;
  } else {
    console.log(`  No obfuscated scripts in: ${file}`);
  }
}
console.log(`\nDone. ${total} block(s) removed.`);
