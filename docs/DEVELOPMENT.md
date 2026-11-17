# 开发指南

最后更新：2026-11-17 13:11

## 1. 环境

| 项目 | 要求 | 检查命令 |
|---|---|---|
| 操作系统 | Windows / macOS / Linux（验收以 Windows 11 + Android 真机为准） | — |
| 运行时 | Node.js ≥ 22.5 | `node -v` |
| 包管理器 | npm | `npm -v` |
| 数据库 | 无外部服务（SQLite 内嵌，测试跑 Node 内置 SQLite） | — |
| 设备/模拟器 | Android 真机 + Expo Go（基线：一加 Ace 2 / Android 16） | — |

## 2. 安装

工作目录：项目根

```text
npm ci
```

预期结果：依赖安装成功，锁文件不变。加新依赖一律 `npx expo install <package>`（解析 SDK 兼容版本）；禁止 `npm install` 强加原生依赖。

## 3. 启动/开发

```text
npx expo start --lan
```

预期结果：终端出现二维码；手机与电脑同一 Wi-Fi，用 Expo Go 扫码加载。

## 4. 质量门禁

| 检查 | 命令 | 何时必须跑 | 失败怎么办 |
|---|---|---|---|
| 格式 | `npm run format:check` | 提交前 | `npm run format` |
| 文档 | `npm run docs:check` | 改文档后 | 按报错补"最后更新"/修链接 |
| 类型 | `npm run typecheck` | 每次改动后 | 修类型错误 |
| Lint | `npm run lint` | 每次改动后 | 修 lint 报错 |
| 测试 | `npm run test:coverage` | 提交前（阈值：行/分支/函数 ≥80%） | 修测试或补覆盖 |
| Doctor | `npm run doctor` | 依赖变化后 | 按 expo-doctor 建议修 |
| 导出+预算 | `npm run check:release` | 发版前 | 按性能预算报错修资源 |

完整检查：

```text
npm run check
```

不要跳过失败项；不能运行时说明原因和剩余风险。测试基线：67 项全过。数据层测试运行在 Node 内置 SQLite 上，出现 `ExperimentalWarning: SQLite` 属运行环境提示，不代表失败。

覆盖率口径（2026-11-17 起）：`test:coverage` 用 `--test-coverage-include="**/src/**"` + `--test-coverage-exclude="**/node_modules/**"` 正向限定分母，**只统计 `src/` 内可被 Node 加载的模块**。两点须知：① 65 个 `.tsx`（页面与展示组件）依赖 react-native/expo，Node 无法加载，不在覆盖率范围内，回归靠 Maestro 与真机验收，不要为此调低阈值；② include 必须与 exclude 成对使用，只写 `include "**/src/**"` 会把 `tsx` 包内路径含 `src` 的文件（`common.js`/`index.js`/`node.js`）计入分母，使总数从 85% 掉到 80.99%（实测）。修改这两个参数后在 CI 与本机各跑一次，确认分母一致。

`npm run docs:check`（`scripts/check-docs.mjs`）按八文档契约校验：六份 docs 文档 + 根 `README.md`/`AGENTS.md` 等公开文件齐全；`docs/README.md` 索引覆盖六份文档与两份根文档；每份 docs 文档的"最后更新"精确到分钟；正文中反引号包裹的 npm 脚本引用在 `package.json` 中真实存在；正文引用的 `.md` 与 `samples/` 路径真实存在；根文档（`AGENTS/CONTRIBUTING/PRIVACY/README/SECURITY/THIRD_PARTY_NOTICES`）里的本地 Markdown 链接可解析。文档增删改结构时同步改这里的清单。

## 5. 测试策略

- 单元测试：`tests/` 9 个文件 67 项——数据迁移/存档（data）、任务 reducer、导航锁、填空排版、无障碍、可观测性、Android 发布配置、学习日、更新清单。
- 集成测试：真实 SQLite v0→v21 迁移、存档 round-trip（均在 data.test.ts）。
- E2E/真机：`.maestro/` 冒烟链路 + 手动验收清单（见 `ACCEPTANCE.md`）。
- 测试数据：`docs/samples/` CSV 样例。
- mock 规则：无 mock 框架；网络/文件服务保持薄封装，纯逻辑单独测试。
- 覆盖率基准：行/分支/函数 ≥80%，分母为 `src/**` 中被测试加载到的模块（见 §4 口径说明）；`src/**/*.tsx` 不纳入，靠 Maestro 与真机验收。

## 6. Git 流程

```text
git status --short --branch
git diff
git add -A
git commit -m '说明本次修改'
git log --oneline --decorate -10
```

规则：

- 历史习惯：小批次直接提交 `main`；分支名建议 `fix/...`、`feat/...`、`docs/...`、`chore/...`。
- 一个提交只做一件事；提交信息为英文祈使句单行。
- 提交前跑检查。
- 不使用 `reset --hard`、force push 覆盖未提交修改。
- 回滚优先 `git revert` / `git restore`，并说明影响。

## 7. 功能开发循环

1. 从 `docs/ROADMAP.md` 选任务，确认范围/非目标/验收标准。
2. 读 `docs/PROJECT.md`、`docs/DESIGN.md` 和相关代码；搜索同类型实现。
3. 给最小改动计划（文件、边界、风险）。
4. 实现；不混入无关重构。
5. 跑检查；记录命令和结果。
6. 更新 `ROADMAP.md`、`PROJECT.md` 当前状态；行为/设计/数据变化同步对应主文档。
7. 用户验收后提交。
8. 报告：改了什么、为什么、怎么验证、剩余风险、下一个任务。

## 8. 代码规范

- 目录/命名：见 `docs/DESIGN.md` 分层表；SQL 只在 `database`，外部 I/O 只在 `services`。
- 格式化：Prettier（`.prettierrc.json`）。
- 类型：严格 TypeScript，`tsc --noEmit` 必过。
- 错误处理：业务异常转 `AppError`（稳定错误码），根错误页统一呈现。
- 日志：`utils/logger`，强制脱敏。
- 依赖管理：`npx expo install`；禁止 `npm audit fix --force`、禁止降级 Expo。
- 复用优先：新增组件/样式/Hook/服务方法前先搜索同类实现；语义一致直接复用；新增条件样式必须说明为什么不能改基础样式。
- 禁止：手改 `android/`/`ios/` 原生目录；页面直调 Router；引入第二套颜色体系。

## 9. 调试与日志

- 日志位置：本地（不上传）。
- 错误码：`utils/appError` 稳定错误码。
- 敏感信息脱敏：logger 统一处理，禁止拼接 Key/Authorization/用户数据。
- 常见错误：先判类别→找根因和最小复现→最小修复；不轻易重装环境。
- 诊断报告：`buildDiagnosticReport`（utils/logger），仅本地保存。

## 10. 安全规则

- 密钥存哪：DeepSeek API Key 仅 Android SecureStore（`services/aiKeyStore.ts`）。
- 不提交什么：`.env`、keystore、密码、GitHub 凭证、用户存档。
- 权限最小化：只申请用户主动触发的权限（媒体选择/文件/网络/安装）。
- 输入校验：CSV/存档/更新清单三处入口均有逐行/逐表校验。
- 依赖审计：Expo/Metro/Router 传递依赖审计项已知存在，禁止降级 Expo 强修。
- 发布签名：RSA 4096，凭据在仓库外单独备份；APK 校验值随 Release 发布。

## 11. 文档维护

- 每个任务更新 `ROADMAP.md`、`PROJECT.md` 当前状态。
- 行为/范围变化更新 `PROJECT.md`、`ACCEPTANCE.md`、`README.md`（如对外）。
- 结构/流程/数据变化更新 `DESIGN.md`。
- 命令/工具链变化更新本文件、`AGENTS.md`、`docs/README.md`。
- 推断/红队/变更记录在 `PROJECT.md`。
- 每个里程碑更新 `ROADMAP.md` 的"里程碑记录"。

## 12. 发布

发布身份：GitHub 仓库 `Saisa7L/ez-word`；Android applicationId `com.saisa7.ezword`；最低 API 24 / 目标 API 36。

要点（完整流程原件见 `.adoption/backup/` 中迁移前的发布文档）：

1. 版本号规则：`package.json` + `app.json` 同步升版本，versionCode 递增。
2. 构建：`npm run build:android:release`（需本机 JDK、Android SDK、NDK、CMake 和仓库外签名凭据）。
3. 校验：记录 APK 大小、SHA-256、MD5；上传 GitHub Release 时附 `.sha256` 文件。
4. 更新清单：`update/latest.json` 由 Release workflow 自动写入真实哈希；清单只接受本项目 GitHub Release 和 `ghproxy.net` 地址。
5. CI：`.github/workflows/release.yml` 执行与 `npm run check` 相同的质量门禁。
6. 回滚：Release 可撤回；App 内更新失败提示用户自行访问 GitHub Releases。
7. 红线：同包名同签名；不镜像绕过签名校验。
