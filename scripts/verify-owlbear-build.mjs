import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const outputDirectory = resolve('dist');
const requiredAssets = [
  'manifest.json',
  'manifest-dev.json',
  'owlbear.html',
  'owlbear.js',
  'owlbear.css',
  'owlbear-icon.svg'
];

for (const asset of requiredAssets) {
  await access(resolve(outputDirectory, asset));
}

const manifest = JSON.parse(await readFile(resolve(outputDirectory, 'manifest.json'), 'utf8'));
if (manifest.manifest_version !== 1 || !manifest.name || !manifest.action?.popover || !manifest.action?.icon) {
  throw new Error('dist/manifest.json is not a valid Owlbear Rodeo extension manifest');
}

console.log('Owlbear extension assets verified in dist/');
