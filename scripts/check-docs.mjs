import { access, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';

const ROOT = process.cwd();
const DOCS_DIR = join(ROOT, 'docs');
const INDEX_PATH = join(DOCS_DIR, 'README.md');
const REQUIRED_DOCS = [
  'ARCHITECTURE.md',
  'ASSETS.md',
  'CURRENT_HANDOFF.md',
  'DATABASE.md',
  'DATA_FLOW.md',
  'DEVELOPMENT_GUIDE.md',
  'MODULE_REFERENCE.md',
  'OPEN_SOURCE_RELEASE_PLAN.md',
  'PERFORMANCE_BUDGET.md',
  'PHASE_HISTORY.md',
  'PROJECT_CONTEXT.md',
  'QUALITY_AND_TECH_DEBT.md',
  'README.md',
  'REQUIREMENTS.md',
  'THEME_GUIDE.md',
  'UI_MAP.md',
];
const REQUIRED_ROOT_FILES = [
  'CONTRIBUTING.md',
  'LICENSE',
  'PRIVACY.md',
  'README.md',
  'SECURITY.md',
  'THIRD_PARTY_NOTICES.md',
];

const packageJson = JSON.parse(
  await readFile(join(ROOT, 'package.json'), 'utf8'),
);
const scripts = new Set(Object.keys(packageJson.scripts ?? {}));
const failures = [];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function getDocCandidates(reference, sourcePath) {
  if (isAbsolute(reference) || reference.startsWith('../')) {
    return [];
  }
  return [
    resolve(ROOT, reference),
    resolve(DOCS_DIR, reference),
    resolve(dirname(sourcePath), reference),
  ].filter((candidate) => candidate.startsWith(ROOT));
}

const indexContent = await readFile(INDEX_PATH, 'utf8');
for (const filename of REQUIRED_ROOT_FILES) {
  if (!(await exists(join(ROOT, filename)))) {
    failures.push(`缺少公开仓库文件 ${filename}`);
  }
}

for (const filename of REQUIRED_DOCS.filter((name) => name !== 'README.md')) {
  if (!indexContent.includes(`\`${filename}\``)) {
    failures.push(`文档索引缺少 ${filename}`);
  }
}

for (const filename of REQUIRED_DOCS) {
  const path = join(DOCS_DIR, filename);
  if (!(await exists(path))) {
    failures.push(`缺少必需文档 docs/${filename}`);
    continue;
  }

  const content = await readFile(path, 'utf8');
  if (!/最后更新：\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(content)) {
    failures.push(`docs/${filename} 缺少精确到最后分钟的最后更新时间`);
  }

  for (const match of content.matchAll(/`npm run ([a-z0-9:_-]+)`/gi)) {
    if (!scripts.has(match[1])) {
      failures.push(`docs/${filename} 引用了不存在的脚本 npm run ${match[1]}`);
    }
  }

  for (const match of content.matchAll(/`([^`\n]+\.md)`/g)) {
    const reference = match[1];
    const candidates = getDocCandidates(reference, path);
    let found = false;
    for (const candidate of candidates) {
      if (await exists(candidate)) {
        found = true;
        break;
      }
    }
    if (candidates.length > 0 && !found) {
      failures.push(`docs/${filename} 引用了不存在的文档 ${reference}`);
    }
  }

  for (const match of content.matchAll(/`((?:docs\/)?samples\/[^`\n]+)`/g)) {
    const reference = match[1];
    const candidates = [
      resolve(ROOT, reference),
      resolve(DOCS_DIR, reference.replace(/^docs\//, '')),
    ];
    let found = false;
    for (const candidate of candidates) {
      if (await exists(candidate)) {
        found = true;
        break;
      }
    }
    if (!found) {
      failures.push(`docs/${filename} 引用了不存在的样例 ${reference}`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL: ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Documentation checks passed (${REQUIRED_DOCS.length} docs, ${REQUIRED_ROOT_FILES.length} root files).`,
);
