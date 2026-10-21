const {
  withAppBuildGradle,
  withProjectBuildGradle,
} = require('expo/config-plugins');

const MARKER = '// @expo-plugin withAndroidReleaseSigning';
const CMAKE_MARKER = '// @expo-plugin withAndroidCmakeVersion';

const SIGNING_ENV_BLOCK = `${MARKER}
def ezWordReleaseSigningConfigured = [
    System.getenv('EZ_WORD_ANDROID_KEYSTORE'),
    System.getenv('EZ_WORD_ANDROID_KEYSTORE_PASSWORD'),
    System.getenv('EZ_WORD_ANDROID_KEY_ALIAS'),
    System.getenv('EZ_WORD_ANDROID_KEY_PASSWORD'),
].every { value -> value != null && !value.trim().isEmpty() }

`;

const SIGNING_CONFIGS_BLOCK = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (ezWordReleaseSigningConfigured) {
                storeFile file(System.getenv('EZ_WORD_ANDROID_KEYSTORE'))
                storePassword System.getenv('EZ_WORD_ANDROID_KEYSTORE_PASSWORD')
                keyAlias System.getenv('EZ_WORD_ANDROID_KEY_ALIAS')
                keyPassword System.getenv('EZ_WORD_ANDROID_KEY_PASSWORD')
            }
        }
    }

`;

const DEBUG_RELEASE_SIGNING = `// Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`;

const RELEASE_SIGNING = `${MARKER}
            signingConfig signingConfigs.release`;

const CMAKE_VERSION_BLOCK = `${CMAKE_MARKER}
subprojects { subproject ->
    ['com.android.application', 'com.android.library'].each { pluginId ->
        subproject.plugins.withId(pluginId) {
            if (subproject.extensions.findByName('android') != null) {
                subproject.android.externalNativeBuild.cmake.version = '3.30.5'
            }
        }
    }
}

`;

function addReleaseSigning(contents) {
  if (contents.includes(MARKER)) {
    return contents;
  }

  const androidBlockStart = contents.indexOf('android {');
  if (androidBlockStart < 0) {
    throw new Error('Unable to find the Android Gradle configuration block');
  }

  let result =
    contents.slice(0, androidBlockStart) +
    SIGNING_ENV_BLOCK +
    contents.slice(androidBlockStart);

  const signingStart = result.indexOf('    signingConfigs {');
  const buildTypesStart = result.indexOf('    buildTypes {', signingStart);
  if (signingStart < 0 || buildTypesStart < 0) {
    throw new Error('Unable to find Android signingConfigs or buildTypes');
  }

  result =
    result.slice(0, signingStart) +
    SIGNING_CONFIGS_BLOCK +
    result.slice(buildTypesStart);

  if (!result.includes(DEBUG_RELEASE_SIGNING)) {
    throw new Error('Unable to find the default release signing configuration');
  }

  return result.replace(DEBUG_RELEASE_SIGNING, RELEASE_SIGNING);
}

function addCmakeVersion(contents) {
  if (contents.includes(CMAKE_MARKER)) {
    return contents;
  }
  return CMAKE_VERSION_BLOCK + contents;
}

module.exports = function withAndroidReleaseSigning(config) {
  config = withProjectBuildGradle(config, (modConfig) => {
    modConfig.modResults.contents = addCmakeVersion(
      modConfig.modResults.contents,
    );
    return modConfig;
  });

  return withAppBuildGradle(config, (modConfig) => {
    modConfig.modResults.contents = addReleaseSigning(
      modConfig.modResults.contents,
    );
    return modConfig;
  });
};

module.exports.addReleaseSigning = addReleaseSigning;
module.exports.addCmakeVersion = addCmakeVersion;
