# Android 发布指南

最后更新：2026-10-22 21:16

## 发布身份

| 项目 | 值 |
|---|---|
| GitHub 仓库 | `Saisa7L/ez-word` |
| Android applicationId | `com.saisa7.ezword` |
| 当前正式版 | `1.0.0` |
| 当前 versionCode | `3` |
| 当前 Release | `https://github.com/Saisa7L/ez-word/releases/tag/v1.0.0` |
| 最低 Android API | 24 |
| 目标 Android API | 36 |
| 签名证书 SHA-256 | `8B:A8:F3:83:FD:6A:F7:C6:1F:0B:FD:2F:A7:EF:65:38:48:63:F5:29:B0:B3:3A:C8:9B:D3:EF:4C:87:21:5E:AD` |

当前 Release APK 的 SHA-256：

```text
86fb3418de092cdcfd8203254e461a61c57e2f241969e02313be25980347d6b1
```

当前 Release APK 的 MD5：

```text
a7c338933829c249d0740ff2bedfb9dd
```

## 版本规则

- `versionName` 使用语义化版本，例如 `0.1.0`、`0.2.0`、`1.0.0`。
- `versionCode` 必须是正整数并单调递增，每次发布增加至少 1。
- Git 标签格式为 `vX.Y.Z`，必须与 `app.json` 的 `expo.version` 一致。
- 同一版本发布后不得替换 APK 或复用版本号。
- `0.x` 阶段允许迭代数据结构，但仍必须保留旧版数据库和存档迁移测试。

## 签名凭据

正式签名密钥不得进入仓库、聊天、日志或普通云盘。本机推荐文件：

```text
C:\Users\12642\.android\keystores\ez-word-release.jks
C:\Users\12642\.android\keystores\ez-word-release.properties
```

属性文件格式：

```properties
storeFile=C:\\Users\\12642\\.android\\keystores\\ez-word-release.jks
storePassword=本机保存的密码
keyAlias=ez-word
keyPassword=本机保存的密码
```

需要离线备份密钥和密码。密钥丢失后，已安装用户无法覆盖升级到使用新密钥签名的 APK。

## 本地构建

环境要求：

- Node.js 22.5 或更高版本
- JDK 17 或更高版本
- Android SDK platform 36
- Android build-tools 36.0.0
- NDK 27.1.12297006
- CMake 3.30.5

构建命令：

```powershell
npm ci
npm run build:android:release
```

脚本默认读取用户目录下的 `ez-word-release.properties`，也可以通过 `EZ_WORD_RELEASE_PROPERTIES` 指定其他位置。构建结果：

```text
dist/release/ez-word-v1.0.0.apk
dist/release/ez-word-v1.0.0.apk.sha256
```

默认构建四种 ABI，生成通用 APK。若只需测试指定 ABI，可以设置 `EZ_WORD_ANDROID_ARCHITECTURES`，例如 `arm64-v8a`。

项目目录包含空格时，配置插件会统一使用 CMake 3.30.5，避免 Expo modules core 使用 CMake 3.22.1 时产生 Ninja 循环。

## GitHub Actions Secrets

标签发布工作流需要以下仓库 Actions Secrets：

| Secret | 内容 |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | 签名密钥文件的 Base64 文本 |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 密码 |
| `ANDROID_KEY_ALIAS` | `ez-word` |
| `ANDROID_KEY_PASSWORD` | key 密码 |

Secrets 只保存在 GitHub 加密配置中。工作流运行时将 keystore 解码到临时目录，任务结束后删除 Runner。

## 发布步骤

1. 更新 `app.json`、`package.json` 和 `package-lock.json` 的 `version`。
2. 增加 `android.versionCode`。
3. 更新 `docs/RELEASING.md` 的当前版本信息。
4. 运行 `npm run check:release`。
5. 在真实 Android 设备安装新 APK，并验证从上一签名版本覆盖升级。
6. 提交变更并创建匹配的 Git 标签，例如 `v0.1.0`。
7. 推送标签，等待 `Release Android APK` 工作流成功。
8. 检查 GitHub Release 中的 APK、SHA-256 和自动生成说明。
9. 更新 `update/latest.json`，写入新版本、GitHub APK 地址、`ghproxy.net` 镜像地址、文件大小、SHA-256 和 MD5。

## 发布验收

- APK 包名、versionName、versionCode、minSdk 和目标 SDK 正确。
- `apksigner verify` 通过，证书指纹与本文记录一致。
- `zipalign -c 4` 通过。
- 每日任务、错题、词库、存档、AI 设置和主题主流程通过。
- 覆盖安装后 SQLite 数据和本地存档仍可读取。
- APK 与 SHA-256 文件同时上传到 Release。
- 密钥和密码没有出现在 Git、Actions 日志或 Release 附件中。

## 密钥轮换

正式发布后不应更换 applicationId 或签名密钥。若密钥泄漏或无法找回，需要明确通知用户，并评估使用新包名、卸载重装和存档迁移方案。不能把新密钥签名的 APK 作为无缝覆盖升级包发布。
