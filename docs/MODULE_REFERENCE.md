# 模块与接口参考

最后更新：2026-10-19 18:26

## 使用方式

本文件描述当前代码的真实边界和主要副作用。修改模块前先阅读对应章节，再读取源文件确认最新签名。

路径别名：`@/` 指向 `src/`。

## Provider 与生命周期

| 入口 | 生命周期 | 暴露接口 | 持久化 |
|---|---|---|---|
| `SQLiteProvider` | 整个 App | SQLite 连接和迁移 | SQLite |
| `ThemeProvider` | 整个 App | `useAppTheme`、`saveTheme`、`reloadTheme` | `app_settings` |
| `DailyTaskProvider` | 整个 App | 当前任务状态和任务操作 | 无 |
| `AppFeedbackProvider` | 整个 App | `showNotice`、`showConfirm` | 无 |

### ThemeProvider

主要接口：

- `useAppTheme()`：返回 `colors`、`mode`、`primaryColor`、`saveTheme`、`reloadTheme`、`statusBarStyle`
- `useOptionalAppTheme()`：加载页和错误边界使用，无 Provider 时返回 `null`
- `useThemedStyles(factory)`：根据当前颜色生成 memo 化样式

### DailyTaskProvider

任务内状态：

- `words`：当前任务主顺序
- `fillWords`、`listeningWords`、`wordBank`：各环节独立随机顺序
- `fillAnswers`、`listeningAnswers`：当前答案
- `fillWrongWordIds`、`listeningWrongWordIds`、`wrongWordIds`：错误集合
- `startedAt`、`durationSeconds`：内存计时
- `taskMode`、`taskSettings`

主要操作：

- `startTask(words, settings, mode)`：初始化任务和随机顺序
- `setFillAnswer`、`clearFillAnswer`
- `setListeningAnswer`
- `setFillWrongWordIds`、`setListeningWrongWordIds`
- `finishTask()`：计算任务时长
- `resetTask()`：清空全部任务状态

### AppFeedbackProvider

- `showNotice(title, message?)`
- `showConfirm(options)`：确认、取消、危险操作统一使用 `ActionOptionModal`

## 数据仓库

所有仓库接收 `SQLiteDatabase`，只负责 SQL 和数据映射。调用方负责页面状态、提示和导航。

### wordsRepository

| 接口 | 作用 | 写操作 |
|---|---|---|
| `upsertWords(db, rows)` | 批量新增或更新单词 | 独占事务 |
| `upsertSingleWord(db, row)` | 单条新增或更新并返回 ID | 独占事务 |
| `getActiveWordCount(db)` | 当前启用词库数量 | 否 |
| `deactivateAllWords(db)` | 软清空当前词库 | 独占事务 |
| `listActiveWords(db, limit, offset)` | 当前词库分页 | 否 |
| `deactivateWords(db, ids)` | 批量软移除 | 独占事务 |
| `findWordByWord(db, word)` | 大小写不敏感查找 | 否 |
| `listWordsForExampleGeneration(db, overwrite)` | 查询待生成例句单词 | 否 |
| `updateWordExample(db, id, sentence, source)` | 写入例句 | 单条更新 |
| `listUnlearnedActiveWords(db, limit, randomize)` | 每日任务取词 | 否 |

关键不变量：

- 单词唯一性由 `word COLLATE NOCASE` 保证。
- 更新已有单词会恢复 `is_active = 1`。
- CSV 非空例句会覆盖并标记 `csv`；空例句不覆盖已有内容。

### wrongBookRepository

| 接口 | 作用 | 写操作 |
|---|---|---|
| `countWrongBookWords(db)` | 错题总数 | 否 |
| `listWrongBookWords(db, limit, offset)` | 错题分页 | 否 |
| `listAllWrongBookWords(db)` | 全部错题，用于回顾抽取 | 否 |
| `countAvailableWordsForWrongBook(db)` | 可加入错题的单词数量 | 否 |
| `listAvailableWordsForWrongBook(db, limit, offset)` | 可加入错题分页 | 否 |
| `addWrongBookWord(db, id, source)` | 单条加入错题 | 独占事务 |
| `addWrongBookWords(db, ids, source)` | 批量加入错题 | 独占事务 |
| `recordWrongWords(db, ids, source)` | 答题错误写入并累计次数 | 独占事务 |
| `resolveWrongBookRemoval(db, ids, status)` | 错题移出并更新状态 | 独占事务 |
| `setWordsLearningStatus(db, ids, status)` | 批量修改学习状态 | 独占事务 |

关键不变量：

- 加入错题会同步 `words.learning_status = 'wrong'`。
- `recordWrongWords` 只增加 `wrong_count` 和更新最近错误时间。
- 手动加入不增加错误次数。
- 移出错题会删除 `wrong_book_words` 并同步单词状态。

### studyRepository

- `recordTaskCompletion(options)`：独占事务写入 `word_learning_state` 和 `study_sessions`
- 只应由每日任务完成流程调用
- `wrongCount` 会被限制为非负
- `study_date` 使用设备本地日期

### statsRepository

- `getHomeStats(db)`：今日学习、总学习、错题和学习天数
- `getLastReviewPromptStudyDay(db)`
- `markReviewPrompted(db, studyDay)`

### settingsRepository

- 常量：每日数量、听力速度、间隔和复习数量范围
- `normalize*`：统一修正越界和非法输入
- `getDailyTaskSettings(db)`：无设置行时写入默认设置
- `saveDailyTaskSettings(db, settings)`：upsert 单行设置

### reviewRepository

- `listReviewWords(db, days)`：查询学习状态为 `learned` 且在范围内的单词
- `days = null` 表示全部已学单词

### userProfileRepository

- `getUserProfile(db)`：读取并补齐默认资料字段
- `updateUserProfile(db, profile)`：upsert 单行资料
- 用户名最长 10 字符，描边宽度限制 0-5

### themeRepository

- `getThemeSettings(db)`：读取并规范化主题
- `saveThemeSettings(db, settings)`：更新主题字段

### aiRepository

- `getAiOverwriteExamples(db)`
- `setAiOverwriteExamples(db, overwrite)`

## Feature 模块

### word-import

- `parseWordCsv(content)`：纯解析和逐行校验，无数据库副作用
- `importWordCsv(db, content)`：解析后调用 `upsertWords`
- `CsvValidationError`：文件级格式错误
- `ImportFileCard`：文件信息和选择/导入按钮
- `WordLibraryActions`：当前词库数量、查看和清空
- `ImportInfoModal`：导入说明弹窗

### daily-task

- `buildClozeSentence(sentence, word)`：生成可填空句子
- `buildDailyTaskQuestions(words)`：生成题目快照
- `getTaskTitle(mode)`：统一任务标题
- `formatListeningRate(rate, fixedInteger)`：统一听力速度显示
- `DailyTaskProvider`：当前任务运行态

### ai

- `generateWordExamples(options)`：按 10 个一批请求 DeepSeek
- 成功后通过 `updateWordExample` 写本地
- 进度回调不持久化

### archive

- `createArchiveSnapshot(db)`：按固定表字段读取
- `parseArchiveSnapshot(content)`：校验格式、版本和字段
- `restoreArchiveSnapshot(db, snapshot)`：独占事务整体替换
- `stringifyArchive(snapshot)`
- 存档不包含 API Key

### profile

- `ProfileCard`：只负责名片显示和用户点击回调
- `ProfileEditModal`：用户名和简介编辑弹窗
- `ProfileColorModal`：名片字体颜色调色弹窗
- `ProfileStrokeModal`：描边颜色和大小弹窗
- `profileUtils`：文件名、体积估算、名字换行和弹窗类型
- 页面保留数据读取、图片选择、保存、截图和业务回调

### settings

- `DailyTaskSettingsForm`：通用设置表单，不直接访问数据库
- `SettingStepper`：长按步进和边界禁用
- `SettingToggleRow`：统一开关行
- `AiKeySection`：API Key 保存、测试和清除入口
- `AiExampleGenerationSection`：例句覆盖、进度和生成入口
- 路由页保留数据加载、持久化、网络流程和全局弹层

## Schema

`src/database/schema.ts` 维护：

- 当前六张业务表的完整字段顺序。
- 存档实际读取的字段子集。
- 存档恢复时的表顺序。
- `validateDatabaseSchema(db)`：迁移后对比 `PRAGMA table_info`，发现字段漂移立即报错。

`src/database/sqlFragments.ts` 维护 `WordRecord` 查询字段列表，仓库通过 `selectWordColumns(alias?)` 生成 SELECT 字段，避免字段顺序在多个仓库中重复。

## Services

| 服务 | 接口 | 副作用 |
|---|---|---|
| `deepSeekService` | `testDeepSeekConnection`、`generateExampleSentences` | 网络请求 |
| `speech` | `playWordSequence` | TTS 播放和定时器 |
| `archiveFiles` | `exportArchiveFile`、`pickArchiveFile` | Android 文件读写 |
| `aiKeyStore` | `get/save/clearDeepSeekApiKey` | SecureStore |
| `wordCsvFiles` | `pickWordCsvFile` | CSV 文件选择和读取 |

## Hooks

| Hook | 作用 | 使用位置 |
|---|---|---|
| `useDailyTaskExitGuard` | 返回键拦截、退出确认、清空任务 | 任务页 |
| `useLongPressStep` | 长按连续步进 | 设置和复习范围 |
| `usePaginatedSelection` | 分页、加载、选择、请求竞态保护 | 错题本、词库、添加错题 |

## 通用组件

| 组件 | 输入重点 | 输出或副作用 |
|---|---|---|
| `GreenSheetScreen` | 标题、返回、滚动开关 | 页面骨架 |
| `SurfaceCard` | `ViewProps` | 主题化卡片 |
| `ActionOptionModal` | 标题、消息、选项 | 操作回调 |
| `PaginationBar` | 页码、总数、切换回调 | 页码回调 |
| `ScrollIndicator` | 视口、内容、滚动位置 | 无 |
| `ColorPalette` | 当前颜色、变化回调 | 颜色变化和触摸状态 |
| `OutlinedText` | 填充色、描边色、宽度 | 名片描边文字 |
| `SelectionMarker` | 序号、是否选中、检查图标大小 | 列表选择可视化 |

## 页面边界

- 页面可以调用简单仓库读取。
- 涉及多个表、事务或较长流程时，优先进入 `features` 或 Hook。
- 页面负责导航和局部弹层，不应复制数据库事务。
- 组件不应直接读取 SQLite。
- 服务不负责导航和页面提示。

## 当前已知边界问题

- `archiveSnapshot.ts` 维护一份独立表结构。
- 页面仍有大量本地表单状态和直接仓库调用。
- `word-import` 已剥离文件 I/O，但解析和入库仍在一个 feature 中。
- 个人资料、通用设置和 AI 设置页面过大。

完整优先级见 `docs/QUALITY_AND_TECH_DEBT.md`。
