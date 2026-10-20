# ADR-0001 Android-only

- 状态：已接受
- 日期：2026-10-20

## 背景

项目依赖 SQLite、SecureStore、相册、文件选择、TTS、截图和 Android 返回键。Web/iOS 入口可以启动部分界面，但不能提供等价的原生能力，容易被误认为跨平台支持。

## 决策

项目只正式支持 Android：

- 不提供 `ios` 和 `web` npm 启动脚本。
- 不维护 iOS/Web `app.json` 平台配置。
- 不提供 Web 调试入口和 favicon。
- Expo Router 必需的 `expo-linking` 保留，但 Web peer 依赖不作为直接依赖。

## 后果

- 所有验收以 Android Expo Go 和后续 APK 为准。
- 如果未来支持 Web/iOS，需要重新评估 SAF、文件系统、截图、TTS 和安全存储。
- 文档不得把可启动 Web 误写为支持 Web。

## 替代方案

- 同时支持多平台：需要为原生能力提供替代实现和独立验收矩阵，当前成本过高。
- 隐藏入口但保留配置：仍会造成维护和测试歧义，已否决。
