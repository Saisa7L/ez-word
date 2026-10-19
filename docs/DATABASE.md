# 本地数据库说明

最后更新：2026-10-19 17:09

## 基本信息

- 数据库文件：`vocabulary.db`
- 当前版本：`17`
- 初始化入口：`src/database/database.ts`
- 迁移方式：读取 `PRAGMA user_version`，按版本顺序执行
- 连接设置：WAL 日志模式、开启外键

## 数据表

### words

当前词库。单词软删除和历史学习记录都依赖这张表。

| 字段 | 作用 |
|---|---|
| `id` | 主键，历史数据关联 ID |
| `word` | 单词，大小写不敏感唯一 |
| `meaning` | 释义 |
| `phonetic` | 音标 |
| `example_sentence` | 本地例句 |
| `example_source` | `csv` 或 `ai` |
| `example_generated_at` | 例句写入时间 |
| `is_active` | 是否在当前词库；0 表示软清空 |
| `learning_status` | `unlearned`、`learned`、`wrong` |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

### app_settings

单行设置表，固定 `id = 1`。包含每日任务、复习提醒、AI 和主题设置。

主要字段：

- 每日数量：`daily_word_limit`
- 听力：`listening_default_rate`、`listening_word_interval_seconds`
- 选词和错题：`random_word_selection`、`wrong_review_random`
- 复习提醒：`review_reminder_enabled`、`review_reminder_interval_days`
- 复习数量：`word_review_word_limit`、`wrong_review_word_limit`
- 行为开关：`advance_on_mistakes`、`auto_remove_correct_wrong_review`
- 例句：`ai_overwrite_examples`
- 主题：`theme_mode`、`theme_primary_color`

### user_profile

单行个人资料表，固定 `id = 1`。

字段：用户名、简介、头像数据、名片背景、名片字色、描边颜色、描边大小和更新时间。

### word_learning_state

单词学习历史，每个单词一行。

| 字段 | 作用 |
|---|---|
| `word_id` | 主键，并关联 `words.id` |
| `first_learned_at` | 首次学习时间 |
| `last_learned_at` | 最近学习时间 |
| `learned_count` | 学习次数 |

### wrong_book_words

错题本关联表，每个单词一行。

| 字段 | 作用 |
|---|---|
| `word_id` | 主键，并关联 `words.id` |
| `added_at` | 首次加入时间 |
| `last_wrong_at` | 最近答错时间 |
| `wrong_count` | 答错次数 |
| `sources` | 逗号分隔来源：`fill`、`listening`、`manual` |

### study_sessions

每日任务完成记录。每次完成每日任务写一行。

| 字段 | 作用 |
|---|---|
| `id` | 主键 |
| `completed_at` | 完成时间 ISO 字符串 |
| `study_date` | 本地日期 `YYYY-MM-DD` |
| `word_count` | 本次单词数量 |
| `wrong_count` | 本次错误数量 |

## 状态不变量

- `words.learning_status = 'wrong'` 时，对应单词应存在于 `wrong_book_words`。
- `words.learning_status = 'wrong'` 不属于单词再练的复习来源。
- 软清空只改变 `is_active`，不能删除关联历史。
- 重新导入同一单词沿用原 `words.id`，避免学习记录丢失。
- 错题移出后，单词状态必须同步为 `learned` 或 `unlearned`。
- `app_settings` 和 `user_profile` 必须保留固定单行 `id = 1`。

## 迁移历史

| 版本 | 内容 |
|---|---|
| 0 → 1 | 创建 `words` |
| 1 → 2 | 软删除字段、设置、学习状态、错题和完成记录 |
| 2 → 3 | 增加答错处理、听力间隔和随机取词设置 |
| 3 → 4 | 增加单词学习状态 |
| 4 → 5 | 增加复习提醒检查字段 |
| 5 → 6 | 增加错题随机和复习提醒设置 |
| 6 → 7 | 增加复习数量设置 |
| 7 → 8 | 增加例句和 AI 覆盖设置 |
| 8 → 9 | 创建 `user_profile` |
| 9 → 10 | 修正默认用户名 |
| 10 → 12 | 增加简介、头像和名片背景 |
| 12 → 13 | 增加名片字色 |
| 13 → 14 | 增加描边颜色和大小 |
| 14 → 15 | 增加主题模式和主题色 |
| 15 → 16 | 增加旧主题表面色和背景色 |
| 16 → 17 | 增加当前主题主色并迁移自定义主题 |

版本 11 没有独立迁移步骤。数据库 v11 不在存档兼容范围内。

## 仓库映射

| 数据域 | 文件 |
|---|---|
| 建表和迁移 | `src/database/database.ts` |
| 单词 | `src/database/wordsRepository.ts` |
| 错题与学习状态 | `src/database/wrongBookRepository.ts` |
| 完成记录 | `src/database/studyRepository.ts` |
| 首页统计和提醒 | `src/database/statsRepository.ts` |
| 每日任务设置 | `src/database/settingsRepository.ts` |
| 复习查询 | `src/database/reviewRepository.ts` |
| 个人资料 | `src/database/userProfileRepository.ts` |
| 主题 | `src/database/themeRepository.ts` |
| AI 选项 | `src/database/aiRepository.ts` |

## 存档关系

`features/archive/archiveSnapshot.ts` 保存以下表：

- `words`
- `app_settings`
- `user_profile`
- `word_learning_state`
- `wrong_book_words`
- `study_sessions`

恢复时按上述依赖顺序删除和插入，并使用独占事务。任何表字段变化都必须同步：

1. `ARCHIVE_TABLES`
2. 旧版本默认值
3. `LEGACY_DATABASE_VERSIONS`
4. 导入恢复测试

## 修改数据库检查表

1. 修改 `database.ts` 并提升 `DATABASE_VERSION`。
2. 为旧版本添加迁移。
3. 更新对应仓库行类型。
4. 更新存档字段和旧版本默认值。
5. 更新本文件。
6. 运行类型检查、lint 和 Android 离线导出。
