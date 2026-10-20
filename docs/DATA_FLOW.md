# 主要数据流

最后更新：2026-10-20 13:44

## 启动与初始化

```text
RootLayout
→ SQLiteProvider 打开 vocabulary.db
→ migrateDatabase 升级到 v19
→ ThemeProvider 读取主题
→ DailyTaskProvider 建立空任务状态
→ AppFeedbackProvider 挂载全局反馈弹层
→ Expo Router 显示页面
```

数据库初始化失败时由根级 `ErrorBoundary` 显示重新加载页面。

## 状态分类

| 状态 | 生命周期 | 所有者 | 示例 |
|---|---|---|---|
| 持久化业务状态 | App 生命周期之外仍存在 | SQLite | 单词、设置、资料、主题、错误次数 |
| 全局运行态 | App 打开期间 | Provider | 当前任务、主题内存值、全局反馈弹层 |
| 页面状态 | 页面挂载或获得焦点期间 | 页面/Hook | 分页、选择、表单草稿、弹层开关 |
| 原生资源状态 | 页面或任务期间 | Service/Hook | TTS 播放、定时器、文件选择 |

页面离开后不依赖临时选择状态；真正需要保留的数据必须显式写回 SQLite。

## 首页

```text
进入首页
→ getHomeStats
→ getUserProfile
→ getDailyTaskSettings
→ 判断复习提醒间隔
→ 必要时 markReviewPrompted 并显示复习提醒
→ 写入首页局部状态
```

首页本身不缓存全局统计，每次获得焦点都会重新读取。

## 每日任务

### 开始

```text
每日任务入口
→ loadDailyTaskSelection
→ getDailyTaskSettings + listUnlearnedActiveWords
→ startTask(words, settings, 'daily')
→ reducer 生成填空、听力和词库随机顺序
→ phase = learning
→ 进入认识单词页
```

### 环节

```text
认识单词
→ phase = filling
→ 填空答案保存在填空页面本地
→ 提交确认后只把错词写入任务错误集合
→ 设置允许时进入听力

听力
→ phase = listening
→ 输入和当前错误标记保存在听力页面本地
→ 提交确认后只把错词写入任务最终错词集合
→ finishTask 记录时长
→ phase = completed
→ 完成页
→ completeTaskSession 统一写错题、学习状态和 study_sessions
```

### 结束

```text
完成页保存成功后返回首页
→ resetTask 清空内存任务
→ 导航栈 reset 到 Tabs
```

任务单词、答案和错误集合在任务过程中只保存在内存。退出任务不会改变单词状态或错题次数；只有进入完成页并成功保存后才持久化。当前 `study_sessions` 不保存任务时长。

完成任务的数据库事务：

```text
completeTaskSession
→ 合并填空和听力错误来源，每个单词只累计一次
→ 批量写 word_learning_state
→ 批量更新 words.learning_status
→ 写一条 study_sessions
```

完成页保存失败时事务整体回滚，页面保留“重试保存”；保存成功前返回键被阻止，保存失败后允许放弃并返回首页。

## 错题回顾

```text
错题回顾入口
→ loadWrongReviewSelection
→ 读取设置
→ listWrongReviewWords 在 SQL 中按设置随机或按时间顺序截取
→ startTask(..., 'wrongReview')
→ 认识单词 → 填空 → 听力
→ 完成页统一记录本次错题
→ 若开启自动移除，完成页在同一事务内移出正确单词
```

## 单词再练

```text
单词再练入口
→ getDailyTaskSettings
→ pickRandomReviewWords 在 SQL 中随机截取 wordReviewWordLimit
→ startTask(..., 'wordReview')
→ 跳过认识单词，直接进入填空
→ 填空 → 听力 → 完成
→ 完成页统一记录本次错题
```

## CSV 导入

```text
导入页选择文件
→ pickWordCsvFile 读取文本
→ importWordCsv
→ parseWordCsv 解析和校验
→ upsertWords 事务写入 words
→ ImportResultModal 显示新增、更新和跳过数量
```

软清空词库只把 `words.is_active` 设为 0，不删除单词、学习记录或错题记录。

## 词库与学习状态

```text
词库页
→ getActiveWordCount + listActiveWords 分页
→ 选择单词后可移除或修改状态
→ deactivateWords 软移除
→ setWordsLearningStatus 修改 learned / unlearned / wrong
→ 操作后重新读取当前页
```

分页列表统一由 `usePaginatedSelection` 管理：

```text
页面提供 loadPage
→ Hook 管理 pageIndex、总数、加载态和选择
→ 请求序号丢弃过期响应
→ 当前页超过末页时自动回退
→ 操作完成后 reload 当前页
```

## AI 例句

```text
AI 设置页
→ SecureStore 保存 API Key
→ getAiOverwriteExamples
→ generateWordExamples
→ listWordsForExampleGeneration
→ 每 10 个单词请求一次 DeepSeek
→ 校验例句可生成填空
→ updateWordExample 写入 words
→ 任务内容始终从本地读取
```

## 主题

```text
主题页选择草稿
→ saveThemeSettings 写入 theme_settings
→ ThemeProvider 更新 mode 和 primaryColor
→ createThemeColors 生成完整调色板
→ useThemedStyles 重建页面样式
```

## 个人资料

```text
个人资料页
→ getUserProfile + getHomeStats
→ 本地编辑用户名、简介、头像、背景、字色和描边
→ updateUserProfile 写入 user_profile
→ 首页和“我的”页下次获得焦点时重新读取
```

名片图片通过 `react-native-view-shot` 截取页面节点，再写入用户选择的目录。

## 本地存档

### 导出

```text
archive.tsx
→ createArchiveSnapshot 在读事务中读取固定表和字段
→ stringifyArchive
→ exportArchiveFile 检查大小并写入 .json
```

### 导入

```text
archive.tsx
→ pickArchiveFile 检查文件大小
→ parseArchiveSnapshot 校验格式、版本、字段、数值、图片 URI 和引用
→ 旧版本存档迁移主题与资料默认值
→ 用户确认
→ restoreArchiveSnapshot 在同一主连接事务内清空并重建数据
→ ensureSettingsRows 补四张设置表单行
→ reloadTheme
→ 页面重新读取数据
```

存档导入失败与主题刷新失败使用不同提示。恢复事务失败时当前数据保持不变；恢复成功但主题刷新失败时提示用户重启 App。

## 持久化矩阵

| 数据 | SQLite 表 | 读取入口 | 写入入口 |
|---|---|---|---|
| 单词与例句 | `words` | `wordsRepository` | `upsertWords`、`updateWordExample` |
| 学习状态 | `words`、`word_learning_state` | `reviewRepository`、`statsRepository` | `completeTaskSession` |
| 错题 | `wrong_book_words`、`words` | `wrongBookRepository` | `completeTaskSession`、`addWrongBookWords` |
| 打卡 | `study_sessions` | `statsRepository` | `completeTaskSession` |
| 每日任务设置 | `task_settings`、`review_settings` | `settingsRepository` | `saveDailyTaskSettings` |
| AI 设置 | `ai_settings` | `aiRepository` | `setAiOverwriteExamples` |
| 主题 | `theme_settings` | `themeRepository` | `saveThemeSettings` |
| 个人资料 | `user_profile` | `userProfileRepository` | `updateUserProfile` |
| API Key | SecureStore | `aiKeyStore` | `aiKeyStore` |

完整表结构见 `docs/DATABASE.md`。

## 事务边界

| 用例 | 事务范围 | 成功结果 |
|---|---|---|
| CSV 批量导入 | 整个批次 | 所有合法行提交 |
| 单条添加单词 | 单条检查、更新或插入 | 返回原 ID 或新 ID |
| 任务完成 | 错题来源、错题次数、学习状态、完成记录 | 一次提交或整体回滚 |
| 状态修改/错题移出 | 每个单词的错题和状态更新 | 状态一致 |
| 存档恢复 | 全表删除和重新插入 | 失败整体回滚 |

## 导航与返回

- 任务页返回键统一经过 `useDailyTaskExitGuard`，监听只在页面聚焦期间生效。
- 四个任务页通过 `useDailyTaskPhaseGuard` 校验当前 `phase`，阶段不匹配时跳转到正确页面。
- 确认退出会 `resetTask` 并重置到首页。
- 每日任务完成页用 `replace` 进入，并独立接管返回键，返回首页并清空任务状态。
- 普通设置页使用 `router.back()`。
- 任务流程内不使用浏览器式历史堆叠作为业务状态来源。

## 错误传递

```text
SQLite/Service 抛出错误
→ repository/feature 保持原始或转换为业务错误
→ 页面捕获
→ AppFeedbackProvider 显示提示
→ 页面恢复可操作状态
```

根级初始化错误由 `ErrorBoundary` 处理。页面级失败不应静默吞掉，除非明确展示空态或降级状态。
