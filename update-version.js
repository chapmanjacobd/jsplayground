import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

function incrementVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

const packageJsonPath = join(process.cwd(), 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

const headerFilePath = join(process.cwd(), 'dist', 'hide_seen_rows-header.js');
const headerFileContent = readFileSync(headerFilePath, 'utf8');

const newVersion = incrementVersion(packageJson.version, 'patch');
packageJson.version = newVersion;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

const updatedHeaderFileContent = headerFileContent.replace(
  /(\/\/ @version\s+)\d+\.\d+\.\d+/,
  `$1${newVersion}`
);
writeFileSync(headerFilePath, updatedHeaderFileContent);

console.log(`Version updated to ${newVersion}`);
