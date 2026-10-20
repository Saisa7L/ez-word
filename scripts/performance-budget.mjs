import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const ASSETS_DIR = join(ROOT, 'assets');
const ANDROID_BUNDLE_DIR = join(
  ROOT,
  '.expo',
  'check',
  '_expo',
  'static',
  'js',
  'android',
);

const BUDGETS = {
  androidBundleBytes: 6 * 1024 * 1024,
  assetCount: 24,
  largestAssetBytes: 512 * 1024,
  totalAssetBytes: 1024 * 1024,
};

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path)));
    } else {
      files.push(path);
    }
  }

  return files;
}

function formatBytes(bytes) {
  return `${bytes.toLocaleString('en-US')} B (${(bytes / 1024).toFixed(1)} KB)`;
}

const failures = [];
const assetPaths = await listFiles(ASSETS_DIR);
const assetSizes = await Promise.all(
  assetPaths.map(async (path) => ({
    bytes: (await stat(path)).size,
    path,
  })),
);
const totalAssetBytes = assetSizes.reduce((sum, asset) => sum + asset.bytes, 0);
const largestAsset = assetSizes.sort(
  (left, right) => right.bytes - left.bytes,
)[0];

const bundlePaths = await listFiles(ANDROID_BUNDLE_DIR).catch(() => []);
const bundleFiles = bundlePaths.filter((path) => path.endsWith('.hbc'));
const bundleBytes = (
  await Promise.all(bundleFiles.map(async (path) => (await stat(path)).size))
).reduce((sum, bytes) => sum + bytes, 0);

console.log(
  `Assets: ${assetPaths.length} files, ${formatBytes(totalAssetBytes)}`,
);
if (largestAsset) {
  console.log(
    `Largest asset: ${relative(ROOT, largestAsset.path)}, ${formatBytes(largestAsset.bytes)}`,
  );
}
if (bundleFiles.length > 0) {
  console.log(`Android HBC: ${formatBytes(bundleBytes)}`);
} else {
  console.log('Android HBC: not built');
  failures.push('缺少 Android 导出产物，请先运行 expo export');
}

if (assetPaths.length > BUDGETS.assetCount) {
  failures.push(
    `资源文件数 ${assetPaths.length} 超过预算 ${BUDGETS.assetCount}`,
  );
}
if (totalAssetBytes > BUDGETS.totalAssetBytes) {
  failures.push(
    `资源总量 ${formatBytes(totalAssetBytes)} 超过预算 ${formatBytes(BUDGETS.totalAssetBytes)}`,
  );
}
if (largestAsset && largestAsset.bytes > BUDGETS.largestAssetBytes) {
  failures.push(
    `单资源 ${relative(ROOT, largestAsset.path)} 为 ${formatBytes(largestAsset.bytes)}，超过预算 ${formatBytes(BUDGETS.largestAssetBytes)}`,
  );
}
if (bundleBytes > BUDGETS.androidBundleBytes) {
  failures.push(
    `Android HBC ${formatBytes(bundleBytes)} 超过预算 ${formatBytes(BUDGETS.androidBundleBytes)}`,
  );
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL: ${failure}`);
  }
  process.exit(1);
}

console.log('Performance budget passed.');
