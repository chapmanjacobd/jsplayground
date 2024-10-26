import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const distDir = join(process.cwd(), 'dist');

const concatenateFiles = (headerFileName, outputFileName) => {
  const headerFilePath = join(distDir, headerFileName);
  const outputFilePath = join(distDir, outputFileName);

  const headerContent = readFileSync(headerFilePath, 'utf8');
  const outputContent = readFileSync(outputFilePath, 'utf8');

  const combinedContent = `${headerContent}\n${outputContent}`;
  writeFileSync(outputFilePath, combinedContent);
};

const files = readdirSync(distDir);
files.forEach(file => {
  if (file.endsWith('-header.js')) {
    const headerFileName = file;
    const outputFileName = file.replace('-header.js', '.js');
    concatenateFiles(headerFileName, outputFileName);
  }
});
