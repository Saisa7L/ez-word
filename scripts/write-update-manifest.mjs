import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

const [apkPath, rawTag] = process.argv.slice(2);
const tag = rawTag?.startsWith('v') ? rawTag : `v${rawTag ?? ''}`;
const version = tag.replace(/^v/, '');

if (!apkPath || !/^v\d+\.\d+\.\d+$/.test(tag)) {
  throw new Error(
    'Usage: node scripts/write-update-manifest.mjs <apk> <vX.Y.Z>',
  );
}

const apkInfo = await stat(apkPath);
const sha256 = createHash('sha256');
const md5 = createHash('md5');

for await (const chunk of createReadStream(apkPath)) {
  sha256.update(chunk);
  md5.update(chunk);
}

const releaseUrl = `https://github.com/Saisa7L/ez-word/releases/tag/${tag}`;
const apkUrl = `https://github.com/Saisa7L/ez-word/releases/download/${tag}/${basename(apkPath)}`;
const releaseNotesPath = join('docs', 'releases', `${tag}.md`);
const releaseNotes = await readFile(releaseNotesPath, 'utf8').catch(() => '');
const notes =
  releaseNotes
    .replace(/^#+\s*/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500) || `易词通 ${tag} 正式版本。`;

const manifest = {
  version,
  tagName: tag,
  releaseUrl,
  apkUrl,
  apkMirrorUrls: [`https://ghproxy.net/${apkUrl}`],
  sha256: sha256.digest('hex'),
  md5: md5.digest('hex'),
  size: apkInfo.size,
  publishedAt: new Date().toISOString(),
  notes,
};

await writeFile(
  join('update', 'latest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

console.log(`Wrote update/latest.json for ${tag}`);
