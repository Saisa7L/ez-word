# 项目概况

最后更新：2026-10-22 21:32

## 产品信息

| 项目 | 内容 |
|---|---|
| 名称 | 易词通（Ez Word） |
| 平台 | Android |
| 用户 | 国内 Android 用户 |
| 仓库 | `https://github.com/Saisa7L/ez-word` |
| 正式版本 | `1.0.0` |
| 包名 | `com.saisa7.ezword` |
| versionCode | `3` |
| Release | `https://github.com/Saisa7L/ez-word/releases/tag/v1.0.0` |
| 开发状态 | 首版开发完成，进入稳定维护 |

产品目标是跑通“导入词库 → 每日学习 → 填空/听写 → 错题回顾 → 单词再练 → 本地存档”的单机闭环。

## 功能范围

- CSV 导入个人词库，支持中英文列名、可选例句和旧版三列格式。
- 每日任务包含认识单词、选词填空、听力测试和完成记录。
- 错题自动进入错题本，支持错题回顾、手动添加和单词再练。
- Android TTS 朗读，支持播放速度、间隔和复习范围设置。
- 日间、夜间和自定义主题，适配大字号、TalkBack 和减少动画。
- 本地 SQLite 数据库和 JSON 存档导入导出。
- 可选 DeepSeek API Key，用于补齐音标和例句。
- 关于页检查更新，支持 `ghproxy.net` 国内镜像、GitHub 回退和 App 内下载 APK。

## 技术栈

| 领域 | 技术 |
|---|---|
| App | Expo SDK 57、React Native 0.86、TypeScript 6 |
| 路由 | Expo Router |
| 数据库 | SQLite v21 |
| 朗读 | Android TTS |
| AI | DeepSeek |
| 文件 | Expo FileSystem、StorageAccessFramework |
| 安全存储 | Expo SecureStore |
| 更新安装 | Expo Intent Launcher + Android 系统安装器 |
| UI 图标 | Lucide React Native、React Native SVG |

## 数据与隐私

- 词库、学习记录、错题、设置和资料保存在本机 `vocabulary.db`。
- DeepSeek API Key 保存在 Android SecureStore，不进入 SQLite、存档、Git 或日志。
- 检查更新和下载只在用户主动操作时联网。
- 更新 APK 下载到应用缓存，由 Android 系统校验包名和签名后覆盖安装。
- 数据库没有应用层加密，依赖 Android 应用沙箱隔离。

## 已知限制

- 仅支持 Android，不提供 iOS、Web、账号登录、云同步或自建服务器。
- GitHub 和 `ghproxy.net` 均不可用时，检查更新会失败，用户需自行解决网络访问。
- App 内更新不能静默安装，必须由用户在 Android 系统页面确认。
- Expo/Metro/Router 的传递依赖审计项仍存在；禁止通过降级 Expo 做强制修复。
- 多语言、多平台和更多功能不属于 1.0.0 范围。

## 安全红线

- API Key 不写入源码、文档、Git 或聊天。
- 不提交 `.env`、keystore、密码或 GitHub 凭证。
- 正式 APK 必须继续使用相同包名和签名密钥。
- 不允许第三方镜像绕过 Android 同签名覆盖安装校验。
