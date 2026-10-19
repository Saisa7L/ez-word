# 项目上下文

最后更新：2026-10-19 22:43

## 产品

| 项目 | 内容 |
|---|---|
| 名称 | 易词通（Ez Word） |
| 用户 | 第一版仅本人使用 |
| 平台 | Android |
| 测试设备 | 一加 Ace 2，Android 16 |
| 路径 | `F:\English vocabulary app\Project\vocab-app` |
| 分支 | `main` |
| 当前阶段 | P6 已完成；下一轮重构方案已由用户准备，尚未开始 |

产品目标是跑通“导入词库 → 每日学习 → 填空/听写 → 错题回顾 → 单词再练 → 本地存档”的单机闭环。

## 技术栈

| 领域 | 技术 |
|---|---|
| App | Expo SDK 57、React Native 0.86、TypeScript 6 |
| 路由 | Expo Router |
| 数据库 | SQLite v17 |
| 朗读 | Android TTS |
| AI | DeepSeek，仅设置页批量生成例句 |
| 文件 | Expo FileSystem、DocumentPicker/File、StorageAccessFramework |
| 安全存储 | Expo SecureStore |
| UI 图标 | Lucide React Native、React Native SVG |

## 当前状态

- F1-F10 已完成并通过真机验收。
- P1-P5 已完成，P5 由用户按当前实现收口。
- P6 已完成架构、数据流、数据库文档、文档合并、资源重组、页面拆分和数据测试。
- 当前没有进行中的阶段任务；新窗口需要先读取用户准备的重构方案。
- P6 不包含打包、签名、APK 和发布。

## 文档入口

- 总索引：`docs/README.md`
- 需求：`docs/REQUIREMENTS.md`
- 架构：`docs/ARCHITECTURE.md`
- 模块接口：`docs/MODULE_REFERENCE.md`
- 数据流：`docs/DATA_FLOW.md`
- 数据库：`docs/DATABASE.md`
- 质量与技术债：`docs/QUALITY_AND_TECH_DEBT.md`
- UI：`docs/UI_MAP.md`
- 资源：`docs/ASSETS.md`
- 主题：`docs/THEME_GUIDE.md`
- 开发：`docs/DEVELOPMENT_GUIDE.md`
- 阶段历史：`docs/PHASE_HISTORY.md`
- 当前交接：`docs/CURRENT_HANDOFF.md`
- P6 进度：`docs/P6_PROGRESS.md`

## 已知风险

- `npm audit` 会报告 Expo 工具链依赖问题，禁止执行 `npm audit fix --force`。
- 不要把 Expo 降级到审计建议的旧版本。
- React Native DevTools 曾出现缓存跨磁盘移动错误，但 App 打包正常。
- 浏览器调试不能覆盖 SQLite 原生行为、图片裁剪、SAF、TTS 和截图。
- 项目早期存在阶段状态文档重复，P6 正在收敛为单一主文档。

## 安全红线

- API Key 不写入源码、文档、Git 或聊天。
- 不提交 `.env`、密码、验证码、签名文件和 GitHub 凭证。
- Android Keystore 和签名密码必须单独备份。
