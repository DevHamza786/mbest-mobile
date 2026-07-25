const fs = require('fs');
const path = require('path');

const settingsPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'gradle-plugin',
  'settings.gradle.kts',
);

if (!fs.existsSync(settingsPath)) {
  process.exit(0);
}

const content = fs.readFileSync(settingsPath, 'utf8');
const patched = content.replace(
  'foojay-resolver-convention").version("0.5.0")',
  'foojay-resolver-convention").version("1.0.0")',
);

if (patched !== content) {
  fs.writeFileSync(settingsPath, patched);
  console.log('Patched @react-native/gradle-plugin for Gradle 9 compatibility.');
}
