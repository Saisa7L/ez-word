# 代码架构说明

最后更新：2026-10-19 19:24

## 架构概览

项目是单机 Expo + React Native App。SQLite 是业务数据的唯一持久化来源，页面状态只保存当前交互过程。

当前 P6 不是从零进行完整的软件架构设计，而是在已有可运行版本上做渐进式重构：

- 已做：职责盘点、重复逻辑抽离、分页状态统一、文档和依赖边界记录。
- 未做：全面重写、领域模型重构、统一用例层、正式测试框架。
- 目标：提高高内聚、降低不必要耦合，同时保持已有功能和 P5 UI 不变。

完整的模块契约见 `docs/MODULE_REFERENCE.md`，质量评估和技术债见 `docs/QUALITY_AND_TECH_DEBT.md`。

启动层级：

```text
RootLayout
├─ SQLiteProvider
│  └─ ThemeProvider
│     └─ DailyTaskProvider
│        └─ ThemedApp
│           ├─ StatusBar
│           └─ AppFeedbackProvider
│              └─ Expo Router Stack / Tabs
```

## 分层职责

| 层 | 目录 | 职责 | 不应承担 |
|---|---|---|---|
| 页面与导航 | `src/app` | 路由、页面布局、局部 UI 状态、调用业务和仓库 | 复杂 SQL、跨页面长期状态 |
| 通用 UI | `src/components` | 可复用卡片、弹层、分页、滚动提示、反馈 UI | 业务数据读取 |
| 业务流程 | `src/features` | 任务流程状态、导入解析、AI 批处理、存档、主题 | 页面视觉细节 |
| 数据访问 | `src/database` | 建表迁移、SQL 查询、行数据到驼峰对象转换 | 页面导航、弹窗文案 |
| 外部服务 | `src/services` | DeepSeek、TTS、文件选择、安全存储 | React 状态 |
| 复用状态 | `src/hooks` | 返回键拦截、长按步进等交互逻辑 | 数据库业务 |
| 常量与资源 | `src/constants` | 主题、资源引用、资料默认值、应用信息 | 可变业务状态 |
| 工具 | `src/utils` | 日期、分页、洗牌、导航和格式化 | 页面组件 |

## 模块清单

| 模块 | 作用 | 主要入口 |
|---|---|---|
| `features/daily-task` | 每日任务内存状态、题目生成、任务标题 | `DailyTaskProvider.tsx` |
| `features/word-import` | CSV 选择、解析、校验、导入和页面区块 | `importWordCsv.ts`、`csv.ts`、`components/` |
| `features/ai` | 批量生成并写入例句 | `generateWordExamples.ts` |
| `features/archive` | 存档序列化、校验和恢复 | `archiveSnapshot.ts` |
| `features/theme` | 运行时主题和动态样式 | `ThemeProvider.tsx` |
| `features/profile` | 个人名片展示、编辑和外观弹窗 | `ProfileCard.tsx` |
| `features/settings` | 通用设置表单和 AI 设置区块 | `DailyTaskSettingsForm.tsx` |
| `database/*Repository.ts` | 各数据域 SQL 访问 | 仓库文件导出的函数 |
| `services/deepSeekService.ts` | DeepSeek 请求和返回解析 | `generateExampleSentences` |
| `services/speech.ts` | 听力顺序播放 | `playWordSequence` |
| `services/archiveFiles.ts` | 存档文件读写 | `exportArchiveFile`、`pickArchiveFile` |
| `services/aiKeyStore.ts` | API Key 安全存储 | `get/save/clearDeepSeekApiKey` |
| `services/wordCsvFiles.ts` | CSV 文件选择和读取 | `pickWordCsvFile` |
| `database/schema.ts` | 当前表字段、存档字段和结构校验 | `validateDatabaseSchema` |
| `database/sqlFragments.ts` | 跨仓库共享的查询字段片段 | `selectWordColumns` |

## 状态归属

| 状态 | 所属位置 | 是否持久化 |
|---|---|---|
| 当前主题 | `ThemeProvider` | 是，`app_settings` |
| 当前任务单词、答案、错误集合、计时 | `DailyTaskProvider` | 否，离开任务即重置 |
| 首页统计和用户名头像 | 首页局部状态 | 从 SQLite 每次进入时读取 |
| 错题本、词库分页和选择 | 对应页面局部状态 | 选择是临时的，数据写入 SQLite |
| 全局提示和确认弹窗 | `AppFeedbackProvider` | 否 |
| 资料、设置、学习记录、主题 | SQLite | 是 |

## 依赖方向

推荐方向：

```text
app → features / database / services / components
features → database / services / utils
database → constants / utils
services → features（仅在解析等纯逻辑需要时）
components → constants / hooks / utils
```

禁止新增：

- `database` 反向依赖页面或 React。
- `components` 直接读取 SQLite。
- `services` 管理页面导航。
- 多个页面分别维护同一份业务常量。

## 高内聚与低耦合原则

高内聚指一个文件围绕一个明确职责组织；低耦合指模块之间通过少量稳定接口交互。

本项目当前采用以下判断：

- SQL 只放在 `database`。
- 外部网络、文件、SecureStore 和 TTS 只放在 `services`。
- 跨页面任务运行态放在 Provider。
- 列表分页和选择状态放在 Hook。
- 页面只保留路由、展示和局部交互。
- 只有出现真实复用或复杂编排时才抽离，不为了目录整齐制造抽象。

架构判断必须同时考虑：

- 数据所有权是否清晰。
- 事务边界是否单一。
- 调用方向是否单向。
- 模块是否可以独立理解和验证。
- 改动是否能用小批次提交和回滚。

## 当前结构性问题

1. 部分设置页同时承担表单、校验、数据库调用和复杂布局，文件超过 500 行。
2. 页面可以直接调用仓库。简单读取可保留，复杂流程应进入 `features` 或自定义 Hook。
3. 存档和运行时校验已共用 `database/schema.ts`，但迁移 SQL 仍手写，字段变化仍需人工同步。
4. `word-import` 已剥离文件 I/O，保留纯解析和入库用例。
5. 错题本、当前词库和添加错题已通过 `usePaginatedSelection` 统一分页和选择状态。

## 目录速查

```text
src/
├─ app/                 页面和路由
├─ components/          通用 UI
├─ components/icons/    代码 SVG 图标
├─ constants/           主题、资源映射和固定配置
├─ database/            SQLite 迁移和仓库
├─ features/            业务流程
│  ├─ ai/
│  ├─ archive/
│  ├─ daily-task/
│  ├─ theme/
│  └─ word-import/
├─ hooks/               复用交互状态
├─ services/            外部 I/O
└─ utils/               无状态工具
```

资源目录和命名以 `docs/ASSETS.md` 为准，资源统一从 `src/constants/uiAssets.ts` 引用。

完整文档索引见 `docs/README.md`。目录说明已合并到本文件。

## 整理原则

- 先建立可追踪的边界，再做文件拆分。
- 修改前先搜索同类实现，优先复用或扩展现有组件、样式、Hook 和工具。
- 每次只抽离一个明确重复，不进行跨模块大重写。
- 页面只保留展示和交互，复杂数据编排再下沉。
- 抽离前后必须通过类型检查和 lint。
- 不因整理改变已收口的 P5 视觉规则。
