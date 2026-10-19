# 主要数据流

最后更新：2026-10-19 17:09

## 启动与初始化

```text
RootLayout
→ SQLiteProvider 打开 vocabulary.db
→ migrateDatabase 升级到 v17
→ ThemeProvider 读取主题
→ DailyTaskProvider 建立空任务状态
→ AppFeedbackProvider 挂载全局反馈弹层
→ Expo Router 显示页面
```

数据库初始化失败时由根级 `ErrorBoundary` 显示重新加载页面。

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
→ getDailyTaskSettings
→ listUnlearnedActiveWords
→ startTask(words, settings, 'daily')
→ DailyTaskProvider 生成填空、听力和词库随机顺序
→ 进入认识单词页
```

### 环节

```text
认识单词
→ 填空答案写入 DailyTaskProvider
→ 提交后错误单词 recordWrongWords
→ 设置允许时进入听力

听力
→ 输入写入 DailyTaskProvider
→ 提交后错误单词 recordWrongWords
→ recordTaskCompletion 写入学习状态和 study_sessions
→ finishTask 记录时长
→ 完成页
```

### 结束

```text
完成页返回首页
→ resetTask 清空内存任务
→ 导航栈 reset 到 Tabs
```

任务单词和答案不写入 SQLite，只有学习结果、错误记录、打卡和时长所需的完成记录会持久化。当前 `study_sessions` 不保存任务时长。

## 错题回顾

```text
错题回顾入口
→ getDailyTaskSettings
→ listAllWrongBookWords
→ 按设置随机或按时间顺序排列
→ 截取 wrongReviewWordLimit
→ startTask(..., 'wrongReview')
→ 认识单词 → 填空 → 听力
→ 若开启自动移除，正确单词 resolveWrongBookRemoval
```

## 单词再练

```text
单词再练入口
→ getDailyTaskSettings
→ listReviewWords(selectedDays)
→ shuffle 后截取 wordReviewWordLimit
→ startTask(..., 'wordReview')
→ 跳过认识单词，直接进入填空
→ 填空 → 听力 → 完成
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
→ saveThemeSettings 写入 app_settings
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
→ createArchiveSnapshot 读取固定表和字段
→ stringifyArchive
→ exportArchiveFile 写入 JSON
```

### 导入

```text
archive.tsx
→ pickArchiveFile
→ parseArchiveSnapshot 校验格式、版本和字段
→ 用户确认
→ restoreArchiveSnapshot 在事务内清空并重建数据
→ reloadTheme
→ 页面重新读取数据
```

## 持久化矩阵

| 数据 | SQLite 表 | 读取入口 | 写入入口 |
|---|---|---|---|
| 单词与例句 | `words` | `wordsRepository` | `upsertWords`、`updateWordExample` |
| 学习状态 | `words`、`word_learning_state` | `reviewRepository`、`statsRepository` | `recordTaskCompletion` |
| 错题 | `wrong_book_words`、`words` | `wrongBookRepository` | `recordWrongWords`、`addWrongBookWords` |
| 打卡 | `study_sessions` | `statsRepository` | `recordTaskCompletion` |
| 每日任务设置 | `app_settings` | `settingsRepository` | `saveDailyTaskSettings` |
| 主题 | `app_settings` | `themeRepository` | `saveThemeSettings` |
| 个人资料 | `user_profile` | `userProfileRepository` | `updateUserProfile` |
| API Key | SecureStore | `aiKeyStore` | `aiKeyStore` |

完整表结构见 `docs/DATABASE.md`。
