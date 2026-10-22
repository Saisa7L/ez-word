import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  compareVersions,
  parseUpdateManifest,
} from '../src/features/updates/updateManifest';

const validManifest = {
  apkMirrorUrls: [
    'https://ghproxy.net/https://github.com/Saisa7L/ez-word/releases/download/v1.0.0/ez-word-v1.0.0.apk',
  ],
  apkUrl:
    'https://github.com/Saisa7L/ez-word/releases/download/v1.0.0/ez-word-v1.0.0.apk',
  notes: 'Release notes',
  releaseUrl: 'https://github.com/Saisa7L/ez-word/releases/tag/v1.0.0',
  sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  size: 123,
  tagName: 'v1.0.0',
  version: 'v1.0.0',
};

test('compares semantic version segments', () => {
  assert.equal(compareVersions('1.0.0', '0.1.0'), 1);
  assert.equal(compareVersions('v1.0.0', '1.0'), 0);
  assert.equal(compareVersions('0.9.9', '1.0.0'), -1);
});

test('parses a trusted update manifest', () => {
  const parsed = parseUpdateManifest(validManifest);
  assert.equal(parsed.version, '1.0.0');
  assert.equal(parsed.apkMirrorUrls.length, 1);
  assert.equal(parsed.size, 123);
});

test('rejects untrusted APK and mirror URLs', () => {
  assert.throws(() =>
    parseUpdateManifest({
      ...validManifest,
      apkMirrorUrls: ['https://example.com/fake.apk'],
      apkUrl: 'https://example.com/fake.apk',
    }),
  );
});

test('keeps the published update manifest valid', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../update/latest.json', import.meta.url), 'utf8'),
  );
  assert.equal(parseUpdateManifest(manifest).version, '0.1.0');
});
