# AGENTS.md

## 项目

易词通（Ez Word）：本地优先 Android 英语单词记忆 App（Expo + React Native + SQLite 单机闭环）。

当前阶段：维护 + 结构重构。
权威信息源：`docs/README.md`、`docs/PROJECT.md`、`docs/DESIGN.md`、`docs/ROADMAP.md`。

## 开始工作前

1. 读 `docs/README.md` 和 `docs/PROJECT.md`。
2. 读与任务相关的 `docs/DESIGN.md`、`docs/DEVELOPMENT.md`、`docs/ROADMAP.md`、`docs/ACCEPTANCE.md`。
3. 查 `git status`、当前分支和最近提交。
4. 读 `package.json` 确认脚本和版本。
5. 不要基于记忆猜 API/命令；不确定就查官方文档或问用户。

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## 技术栈

| 领域 | 技术 | 版本来源 |
|---|---|---|
| 语言 | TypeScript | package.json（~6.0.3） |
| 框架 | Expo SDK 57 + React Native 0.86 | package.json |
| 数据 | SQLite v21（expo-sqlite） | src/database/migrations.ts |
| 测试 | Node 内置 test runner + tsx | package.json scripts |
| 构建/分发 | Expo export + 本地 Android 构建 + GitHub Releases | scripts/build-android-release.mjs |

不要凭记忆写版本号；以锁文件/清单文件为准。

## 命令

工作目录：项目根

```text
安装：npx expo install <package>   # 一律用它加依赖（解析 SDK 兼容版本）；禁止 npm install 强加原生依赖
启动：npx expo start --lan
格式：npm run format / npm run format:check
Lint：npm run lint
类型：npm run typecheck
测试：npm run test / npm run test:coverage（阈值：行/分支/函数 ≥80%）
构建：npm run build:android:release（需仓库外签名凭据）
完整检查：npm run check
发版检查：npm run check:release
文档检查：npm run docs:check
```

命令必须真实可执行。新增/修改命令时同步更新 `docs/DEVELOPMENT.md`。

## 架构边界

目录职责：

```text
src/app          页面与路由（不写复杂 SQL/长期状态）
src/application  用例编排（不碰 SQL/React 组件/导航）
src/domain       领域类型（不碰 React/Expo/SQLite）
src/database     迁移、schema、仓库（不反向依赖页面或 React）
src/features     业务流程状态与编排
src/services     外部 I/O：网络/文件/TTS/SecureStore（不管理导航/React 状态）
src/components   通用 UI（不直接读 SQLite）
src/hooks        复用交互状态
src/utils        无状态工具
```

允许的依赖方向：

```text
app → application / features / database / services / components
application → domain / database / utils
features → domain / database / services / utils
database → domain / constants / utils
components → constants / hooks / utils
```

禁止：

- SQL 只放 `database`；外部网络/文件/SecureStore/TTS 只放 `services`。
- 页面直接调用 Expo Router——所有导航必须经 `utils/navigationActions`（pushOnce/backOnce/replaceOnce/dismissToOnce/resetToHomeOnce）。
- `database` 反向依赖页面或 React；`components` 直接读取 SQLite；`services` 管理页面导航。
- 多个页面分别维护同一份业务常量。
- 修改 `ios/`、`android/` 原生目录（CNG 生成；用 app.json + config plugins 配置原生行为）。

修改前先搜索同类型实现；能复用/扩展就不要新增抽象。新增抽象必须说明为什么现有模式不够。

## 协作规则

- 一次只做一个任务；不把无关重构、格式化、依赖升级混进同一个改动。
- 不为了让代码"看起来更架构"而加层、加配置、加通用器。
- 没有运行检查、没有验收证据，不得宣称"完成/修好/没问题"。
- 文档是唯一事实来源；口头结论要落文档。
- 需求/边界/数据/依赖不确定时先问，不替用户假设。
- 不擅自扩大范围；发现顺手可修的问题，先记录（ROADMAP Backlog），不混入当前任务。
- 用户可随时中断/改需求：先停、复述、评估影响、记录到 `docs/PROJECT.md` 变更记录，再从断点继续。

## 推断、变更与新文档

- 任何不是用户原话、也不是已核实事实的业务规则/边界/权限/指标/字段/范围，必须写 `[推断 I#：依据是…，待用户用事实校准]`，并登记到 `docs/PROJECT.md` 的推断表。
- 推断项未清零，不得进入下一阶段，也不得把文档标成"已确认"。
- 用户改需求时，更新 `PROJECT.md` 变更记录；影响已确认内容的，把相关文档退回"草案（待重新确认）"。
- 默认文档集固定八份；新增任何文档之前先说明名称、目的、为什么现有文档放不下、维护成本，得到用户批准后再创建，并登记到 `docs/README.md`。

## 功能开发循环

1. 从 `docs/ROADMAP.md` 选一个任务（同一时间只有一个 `当前任务=是`），确认范围、非目标、验收标准。
2. 读相关文档和代码；搜索同类实现。
3. 给出最小改动计划（文件、边界、风险）。
4. 实现；一次只做一个任务，不混入无关重构。
5. 运行检查（至少 typecheck + lint；提交前跑全量 check）；记录命令和结果。
6. 更新 `ROADMAP.md`、`PROJECT.md` 当前状态和相关主文档。
7. 用户验收后提交 Git；提交只包含本任务文件。

## 审批门禁

以下改动必须先得到用户明确同意：

- 数据库/存档结构、迁移、数据删除（同步五处：schema.ts → 迁移 → 旧版本默认值 → 恢复测试 → DESIGN.md）。
- 认证、权限、支付、加密。
- 新增/升级关键依赖，或改变构建/部署方式；禁止 `npm audit fix --force` 和降级 Expo。
- 破坏性 Git 操作（rebase、reset、force push）；回滚优先 `revert`/`restore`。
- 发布、上架、生产部署、推送 GitHub。
- 新增文档、修改本文件或项目核心规则。

## 安全红线

- API Key、密码、token、签名文件、私钥不进源码、文档、日志、聊天。
- 不提交 `.env`、keystore、用户数据、生产数据；Android Keystore 和密码单独备份在仓库外。
- 日志使用 `utils/logger`，不拼接 API Key、Authorization 或用户敏感数据；诊断文本只保存在本地。
- 正式 APK 必须继续使用相同包名（com.saisa7.ezword）和签名密钥；不允许第三方镜像绕过同签名校验。
- 不执行来源不明的脚本；不关闭安全检查来"让它通过"。

## 文档规则

- 四类八份：`README.md`、`AGENTS.md`、`docs/README.md`、`docs/PROJECT.md`、`docs/DESIGN.md`、`docs/DEVELOPMENT.md`、`docs/ROADMAP.md`、`docs/ACCEPTANCE.md`。
- 一份文档一个关注点；不创建阶段状态/交接副本。
- 行为/范围变化更新 `PROJECT.md`、`ACCEPTANCE.md`。
- 结构/流程/数据变化更新 `DESIGN.md`。
- 命令/流程变化更新 `DEVELOPMENT.md` 和本文件。
- 每个任务更新 `ROADMAP.md`、`PROJECT.md`；每个里程碑更新 `ROADMAP.md` 的里程碑记录。
- 文档顶部"最后更新"精确到分钟；状态/确认/推断/变更规则见 `docs/README.md`。

## 不确定时

- 不确定需求：问用户，不替用户假设；需要时标推断。
- 不确定 Expo/RN API：查官方版本化文档，不凭记忆。
- 不确定架构：先读 `docs/DESIGN.md`，仍不清楚就问。
- 不确定是否破坏规则：停下来，说明冲突，等确认。
- 不要用"应该可以""大概没问题"作为完成依据；用命令输出和验收结果说话。

## 完成定义

一个任务只有同时满足以下条件才算完成：

- 验收标准全部满足；
- 相关检查通过（或明确说明未运行为什么）；
- 文档已同步；
- 没有无关改动；
- 用户已验收。
