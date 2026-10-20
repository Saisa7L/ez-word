# 模块与接口参考

最后更新：2026-10-20 20:22

## 使用方式

本文件描述当前代码的真实边界和主要副作用。修改模块前先阅读对应章节，再读取源文件确认最新签名。

路径别名：`@/` 指向 `src/`。

## Provider 与生命周期

| 入口 | 生命周期 | 暴露接口 | 持久化 |
|---|---|---|---|
| `SQLiteProvider` | 整个 App | SQLite 连接和迁移 | SQLite |
| `ThemeProvider` | 整个 App | `useAppTheme`、`saveTheme`、`reloadTheme` | `theme_settings` |
| `DailyTaskProvider` | 整个 App | 当前任务状态和任务操作 | 无 |
| `AppFeedbackProvider` | 整个 App | `showNotice`、`showConfirm` | 无 |

### ThemeProvider

主要接口：

- `useAppTheme()`：返回 `colors`、`mode`、`primaryColor`、`saveTheme`、`reloadTheme`、`statusBarStyle`
- `useOptionalAppTheme()`：加载页和错误边界使用，无 Provider 时返回 `null`
- `useThemedStyles(factory)`：根据当前颜色生成 memo 化样式

### DailyTaskProvider

Provider 内部分成两个 Context：

- `TaskSessionContext`：任务模式、设置快照、阶段、单词顺序、计时和题目
- `TaskMistakesContext`：填空/听力最终错词集合和合并后的任务错题集合
- 填空和听力答案及当前页错误标记均已局部化到对应页面

读取入口：

- `useDailyTaskSession()`：只订阅任务会话字段
- `useDailyTaskMistakes()`：只订阅任务错词和记录方法
- `startTask(words, settings, mode)`：初始化任务和随机顺序
- `enterPhase(phase)`：显式推进任务阶段
- `finishTask()`、`resetTask()`
- 答案和错误集合由对应 Context 的 setter 更新
- `recordFillMistakes`、`recordListeningMistakes` 只累计最终确认错词
- 任务单词统一为 `TaskWord`，不再向任务页面暴露数据库行字段

### taskReducer

- `START_TASK`：创建任务随机顺序并设置初始阶段
- `START_TASK` 同时写入 `taskMode` 和 `taskSettings`，退出标题与听力默认速度都使用任务快照
- 每日任务和错题回顾从 `learning` 开始，单词再练从 `filling` 开始
- `ENTER_PHASE`：在认识、填空、听力、完成页之间显式推进
- 答案、错误集合、计时和重置均由 reducer 管理

### AppFeedbackProvider

- `showNotice(title, message?)`
- `showConfirm(options)`：确认、取消、危险操作统一使用 `ActionOptionModal`

## 导航

所有 Expo Router 导航动作必须经过 `src/utils/navigationActions.ts`：

- `runNavigationOnce(action)`：获得导航锁后执行一次动作。
- `pushOnce`、`replaceOnce`、`dismissToOnce`：支持可选的准备回调，准备动作与导航在同一把锁内执行。
- `backOnce(fallbackHref?)`：有历史时返回，无历史时进入指定的回退路由。
- `resetToHomeOnce(navigation, prepareAction?)`：任务状态重置与首页 reset 只执行一次。
- `canGoBack()`：仅供根 BackHandler 判断是否允许系统退出。

`src/utils/backNavigation.ts` 维护模块级导航锁：

- 最小锁定 300ms，避免 PUSH 与立即 BACK 交错。
- 最大等待 500ms，路由未变化时兜底释放，避免死锁。
- 根布局监听 `usePathname()`，路径变化后完成锁。

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
| `listWrongReviewWords(db, limit, randomize)` | SQL 直接选本次错题回顾单词 | 否 |
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
- 错题来源保存在 `wrong_book_sources`，每个单词每种来源一行。
- 任务过程中的填空和听力确认不再直接调用 `recordWrongWords`。
- 手动加入不增加错误次数。
- 移出错题会删除 `wrong_book_words` 并同步单词状态。

### studyRepository

- `recordTaskCompletion(options)`：独占事务写入 `word_learning_state` 和 `study_sessions`
- 保留为底层完成记录入口；当前任务页面统一调用 `completeTaskSession`
- `wrongCount` 会被限制为非负
- `study_date` 使用设备本地日期

### taskCompletionRepository

- `completeTaskSession(db, options)`：任务完成页唯一持久化入口
- 同一事务写错题来源和次数、学习状态、学习历史和 `study_sessions`
- 每日任务只为本次错题累计一次；同一单词同时来自填空和听力时合并来源
- 错题回顾开启自动移除时，正确单词在同一事务内移出错题本
- 单词再练在完成页记录本次错题，不写入每日打卡

### statsRepository

- `getHomeStats(db)`：今日学习、总学习、错题和学习天数
- `getLastReviewPromptStudyDay(db)`
- `markReviewPrompted(db, studyDay)`

### settingsRepository

- 常量：每日数量、听力速度、间隔和复习数量范围
- `normalize*`：统一修正越界和非法输入
- `getDailyTaskSettings(db)`：纯读取；无设置行时返回默认值，不写库
- `saveDailyTaskSettings(db, settings)`：upsert 单行设置

### reviewRepository

- `pickRandomReviewWords(db, days, limit)`：SQL 随机抽取范围内已学单词
- `days = null` 表示全部已学单词

### application/daily-task

- `loadDailyTaskSelection(db)`：读取设置并选择每日任务单词
- `loadWrongReviewSelection(db)`：读取设置并选择错题回顾单词
- `loadWordReviewSelection(db, days, settings)`：随机选择单词再练单词
- 返回值中的任务单词统一为 `TaskWord`

### domain/word

- `TaskWord`：任务流程需要的 `id`、单词、释义、音标和例句
- 数据库行通过 `database/taskWordMapper.ts` 转换为 camelCase 领域对象

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
- `parseArchiveSnapshot(content)`：校验格式、版本、字段、数值范围、图片 URI 和引用完整性，并迁移旧版本默认值
- `restoreArchiveSnapshot(db, snapshot)`：同一主连接事务整体替换，恢复后补齐设置单行
- `stringifyArchive(snapshot)`
- 存档不包含 API Key
- 最大输入 20 MB、每表 50,000 行；图片只接受本地 data URI

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

`src/database/migrations.ts` 维护：

- `MIGRATIONS`：v1-v19 的版本注册表，v10 直接迁移到 v12。
- `runMigrations(db, currentVersion)`：在同一主连接事务中按序执行，并在每步后写入 `user_version`。
- `ensureColumn`：执行 `ALTER TABLE` 前检查真实列，兼容旧实现留下的部分迁移状态。

`src/database/settingsRows.ts` 维护：

- `ensureSettingsRows(db)`：通过 `INSERT OR IGNORE` 补齐 `task_settings`、`review_settings`、`ai_settings` 和 `theme_settings` 的固定 `id = 1` 设置行。
- 启动迁移、主题保存、AI 设置和复习提醒写入会调用该函数。

`src/database/sqlFragments.ts` 维护 `WordRecord` 查询字段列表，仓库通过 `selectWordColumns(alias?)` 生成 SELECT 字段，避免字段顺序在多个仓库中重复。

## Services

| 服务 | 接口 | 副作用 |
|---|---|---|
| `deepSeekService` | `testDeepSeekConnection`、`generateExampleSentences` | 网络请求 |
| `speech` | `playWordSequence` | TTS 播放和定时器 |
| `archiveFiles` | `exportArchiveFile`、`pickArchiveFile` | Android 文件读写、扩展名和 20 MB 限额 |
| `aiKeyStore` | `get/save/clearDeepSeekApiKey` | SecureStore |
| `wordCsvFiles` | `pickWordCsvFile` | CSV 文件选择和读取 |

## Hooks

| Hook | 作用 | 使用位置 |
|---|---|---|
| `useDailyTaskExitGuard` | 焦点级返回键拦截、退出确认、清空任务 | 任务页 |
| `useDailyTaskPhaseGuard` | 阻止任务深链或错误阶段进入不匹配页面 | 四个任务阶段页 |
| `useTaskPhaseNavigation` | 原子推进阶段并导航到对应页面 | 认识、填空、听力页 |
| `useSettingsBackNavigation` | 设置子页固定回到 `/settings` | 设置子页和添加单词页 |
| `useSafeBackNavigation` | 有历史时返回，无历史时进入回退路由 | 普通非设置子页 |
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
| `TaskErrorModal` | 错误数量、确认、关闭回调 | 确认只更新内存错误集合；Android 返回只关闭 |
| `Button` | `variant`、禁用态、按压态、文本样式 | 统一任务主按钮、危险、成功和次按钮 |
| `Dialog` | 可见性、关闭回调、内容样式 | 统一遮罩、容器和模态无障碍语义 |
| `TaskPhasePlaceholder` | 当前任务阶段尚未就绪 | 主题背景、加载指示和恢复提示 |
| `ListeningPlayerCard` | 阅读进度、播放、回退和倍速 | 听力播放控制 |
| `ListeningAnswerList` | 听力答案、错误状态和滚动 | 听力输入列表 |
| `FillBlankQuestionCard` | 题目、填空答案和错误状态 | 填空题卡与滚动 |
| `FillBlankWordBank` | 词库分页、选中状态和已使用状态 | 填空词库选择 |

## 页面边界

- 页面可以调用简单仓库读取。
- 涉及多个表、事务或较长流程时，优先进入 `features` 或 Hook。
- 页面负责局部弹层和导航意图，实际导航必须调用统一导航入口。
- 组件不应直接读取 SQLite。
- 服务不负责导航和页面提示。

## 当前已知边界问题

- 页面仍有大量本地表单状态和直接仓库调用。
- `word-import` 已剥离文件 I/O，但解析和入库仍在一个 feature 中。
- 个人资料、通用设置和 AI 设置页面过大。

完整优先级见 `docs/QUALITY_AND_TECH_DEBT.md`。
