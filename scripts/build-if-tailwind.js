const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('Running JS build: node build.js');
  execSync('node build.js', { stdio: 'inherit' });
} catch (e) {
  console.error('JS build failed:', e && e.message);
  process.exit(1);
}

const cssInput = 'src/styles/tailwind.css';
if (fs.existsSync(cssInput)) {
  console.log(`Found ${cssInput} — running npm run build:css`);
  try {
    execSync('npm run build:css', { stdio: 'inherit' });
  } catch (e) {
    console.error('build:css failed:', e && e.message);
    process.exit(1);
  }
} else {
  console.log(`${cssInput} not found — skipping build:css (CI-safe)`);
}
