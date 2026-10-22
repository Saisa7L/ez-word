import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  addCmakeVersion,
  addReleaseSigning,
}: {
  addCmakeVersion: (contents: string) => string;
  addReleaseSigning: (contents: string) => string;
} = require('../plugins/withAndroidReleaseSigning.cjs');
const appConfig = require('../app.json') as {
  expo: { android: { permissions?: string[] } };
};

const APP_GRADLE = `android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug
        }
    }
}`;

test('adds an environment-driven release signing config', () => {
  const result = addReleaseSigning(APP_GRADLE);

  assert.match(result, /ezWordReleaseSigningConfigured/);
  assert.match(
    result,
    /storeFile file\(System\.getenv\('EZ_WORD_ANDROID_KEYSTORE'\)\)/,
  );
  assert.match(result, /signingConfig signingConfigs\.release/);
  assert.doesNotMatch(result, /signingConfig signingConfigs\.debug/);
});

test('keeps release signing injection idempotent', () => {
  const once = addReleaseSigning(APP_GRADLE);
  assert.equal(addReleaseSigning(once), once);
});

test('adds the CMake version override once', () => {
  const once = addCmakeVersion('buildscript {}\n');

  assert.match(once, /withAndroidCmakeVersion/);
  assert.match(once, /externalNativeBuild\.cmake\.version = '3\.30\.5'/);
  assert.equal(addCmakeVersion(once), once);
});

test('requests permission to launch the Android package installer', () => {
  assert.ok(
    appConfig.expo.android.permissions?.includes(
      'android.permission.REQUEST_INSTALL_PACKAGES',
    ),
  );
});
