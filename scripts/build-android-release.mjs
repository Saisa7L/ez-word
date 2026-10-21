import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';

const root = process.cwd();
const propertiesPath =
  process.env.EZ_WORD_RELEASE_PROPERTIES ??
  join(homedir(), '.android', 'keystores', 'ez-word-release.properties');
const javaHome =
  process.env.JAVA_HOME ?? join(homedir(), '.jdks', 'openjdk-23.0.1');
const androidHome =
  process.env.ANDROID_HOME ?? join(homedir(), '.android', 'sdk');
const pathDelimiter = process.platform === 'win32' ? ';' : ':';

function fail(message) {
  console.error(`\nRelease build failed: ${message}`);
  process.exit(1);
}

function parseProperties(contents) {
  const values = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
      continue;
    }
    const separator = trimmed.indexOf('=');
    if (separator < 1) {
      continue;
    }
    values[trimmed.slice(0, separator).trim()] = trimmed
      .slice(separator + 1)
      .trim();
  }
  return values;
}

function quoteWindowsArgument(argument) {
  return `"${String(argument).replaceAll('"', '\\"')}"`;
}

function run(command, args, cwd = root) {
  const isWindowsBatch =
    process.platform === 'win32' && command.toLowerCase().endsWith('.bat');
  const executable = isWindowsBatch
    ? (process.env.ComSpec ?? 'cmd.exe')
    : command;
  const commandArgs = isWindowsBatch
    ? [
        '/d',
        '/s',
        '/c',
        `call ${quoteWindowsArgument(command)} ${args
          .map(quoteWindowsArgument)
          .join(' ')}`,
      ]
    : args;
  const result = spawnSync(executable, commandArgs, {
    cwd,
    env: buildEnv,
    stdio: 'inherit',
    windowsVerbatimArguments: isWindowsBatch,
  });
  if (result.error) {
    fail(result.error.message);
  }
  if (result.status !== 0) {
    fail(`${command} exited with code ${result.status}`);
  }
}

if (
  !existsSync(
    join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'),
  )
) {
  fail(`JAVA_HOME does not contain a Java runtime: ${javaHome}`);
}

if (!existsSync(join(androidHome, 'platform-tools'))) {
  fail(`Android SDK not found at ${androidHome}`);
}

const environmentSigning = {
  storeFile: process.env.EZ_WORD_ANDROID_KEYSTORE,
  storePassword: process.env.EZ_WORD_ANDROID_KEYSTORE_PASSWORD,
  keyAlias: process.env.EZ_WORD_ANDROID_KEY_ALIAS,
  keyPassword: process.env.EZ_WORD_ANDROID_KEY_PASSWORD,
};
const hasEnvironmentSigning = Object.values(environmentSigning).every(
  (value) => typeof value === 'string' && value.trim().length > 0,
);

if (!hasEnvironmentSigning && !existsSync(propertiesPath)) {
  fail(
    `Signing credentials are missing. Set the EZ_WORD_ANDROID_* environment variables or provide ${propertiesPath}.`,
  );
}

const signing = hasEnvironmentSigning
  ? environmentSigning
  : parseProperties(readFileSync(propertiesPath, 'utf8'));
const requiredKeys = ['storeFile', 'storePassword', 'keyAlias', 'keyPassword'];
for (const key of requiredKeys) {
  if (!signing[key]) {
    fail(`Missing ${key} in ${propertiesPath}`);
  }
}

const buildEnv = {
  ...process.env,
  ANDROID_HOME: androidHome,
  ANDROID_SDK_ROOT: androidHome,
  CMAKE_VERSION: '3.30.5',
  EZ_WORD_ANDROID_KEYSTORE: signing.storeFile.replace(/\\\\/g, '\\'),
  EZ_WORD_ANDROID_KEYSTORE_PASSWORD: signing.storePassword,
  EZ_WORD_ANDROID_KEY_ALIAS: signing.keyAlias,
  EZ_WORD_ANDROID_KEY_PASSWORD: signing.keyPassword,
  GRADLE_OPTS: '-Xmx4096m -XX:MaxMetaspaceSize=1024m',
  JAVA_HOME: javaHome,
  NODE_ENV: 'production',
  PATH: `${join(javaHome, 'bin')}${pathDelimiter}${process.env.PATH ?? ''}`,
};

const expoCli = join(root, 'node_modules', 'expo', 'bin', 'cli');
run(process.execPath, [
  expoCli,
  'prebuild',
  '--platform',
  'android',
  '--no-install',
]);

const gradlew =
  process.platform === 'win32'
    ? join(root, 'android', 'gradlew.bat')
    : join(root, 'android', 'gradlew');
const gradleArguments = ['assembleRelease', '--no-daemon'];
if (process.env.EZ_WORD_ANDROID_ARCHITECTURES) {
  gradleArguments.push(
    `-PreactNativeArchitectures=${process.env.EZ_WORD_ANDROID_ARCHITECTURES}`,
  );
}
run(gradlew, gradleArguments, join(root, 'android'));

const sourceApk = join(
  root,
  'android',
  'app',
  'build',
  'outputs',
  'apk',
  'release',
  'app-release.apk',
);
if (!existsSync(sourceApk)) {
  fail(`Gradle did not produce ${sourceApk}`);
}

const appConfig = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'));
const version = appConfig.expo.version;
const outputDirectory = join(root, 'dist', 'release');
const outputApk = join(outputDirectory, `ez-word-v${version}.apk`);
mkdirSync(outputDirectory, { recursive: true });
copyFileSync(sourceApk, outputApk);

const digest = createHash('sha256')
  .update(readFileSync(outputApk))
  .digest('hex');
const checksum = `${digest}  ${basename(outputApk)}\n`;
writeFileSync(`${outputApk}.sha256`, checksum, 'utf8');

console.log(`\nSigned APK: ${outputApk}`);
console.log(`SHA-256: ${digest}`);
