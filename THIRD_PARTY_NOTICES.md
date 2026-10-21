# 第三方依赖声明

本项目使用 npm 管理和打包第三方依赖。第三方代码继续遵循其各自许可证，项目自身的 [MIT License](LICENSE) 不覆盖第三方代码。

具体安装版本以 `package-lock.json` 为准。以下列出当前直接运行时和构建期依赖的主要许可证。

## 运行时依赖

| 依赖 | 许可证 |
|---|---|
| `expo`、`expo-constants`、`expo-file-system`、`expo-image-picker`、`expo-linking`、`expo-router`、`expo-secure-store`、`expo-speech`、`expo-splash-screen`、`expo-sqlite`、`expo-status-bar` | MIT |
| `react`、`react-native`、`react-native-safe-area-context`、`react-native-screens`、`react-native-svg`、`react-native-view-shot` | MIT |
| `papaparse` | MIT |
| `lucide-react-native` | ISC |

## 构建期依赖

| 依赖 | 许可证 |
|---|---|
| `@types/node`、`@types/papaparse`、`@types/react` | MIT |
| `eslint`、`eslint-config-expo`、`prettier`、`tsx` | MIT |
| `typescript` | Apache-2.0 |

## 说明

- npm 依赖包通常会随安装内容保留各自的许可证文件。
- 传递依赖的版本和许可证信息记录在 `package-lock.json` 及对应 npm 包中。
- 发布正式 APK 或调整依赖前，应重新核对依赖树和许可证变化。
- 项目不主张拥有第三方商标、图标、许可证文本或上游项目版权。

如果你认为本声明遗漏了需要保留的归属信息，请通过 GitHub Issues 联系维护者。
