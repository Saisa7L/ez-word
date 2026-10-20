# 本地数据库说明

最后更新：2026-10-20 20:57

## 基本信息

- 数据库文件：`vocabulary.db`
- 当前版本：`19`
- 初始化入口：`src/database/database.ts`
- 当前 schema 定义：`src/database/schema.ts`
- 迁移方式：读取 `PRAGMA user_version`，通过 `src/database/migrations.ts` 的版本注册表执行
- 连接设置：WAL 日志模式、开启外键

所有待执行迁移在同一个主连接事务中按版本顺序运行，每一步成功后立即写入对应的 `PRAGMA user_version`。迁移中断会整体回滚；旧版本异常中断留下“schema 已前进但版本号未前进”时，列检查保护会跳过已存在字段并继续完成迁移。数据库版本高于 App 支持版本或遇到不支持的版本（例如 v11）会显式报错。

迁移完成后会使用 `PRAGMA table_info` 校验当前九张业务表的字段顺序，并调用 `ensureSettingsRows` 补齐四张设置表的单行数据。校验失败会阻止 App 继续启动。

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

### task_settings

单行任务设置表，固定 `id = 1`：

- `daily_word_limit`
- `listening_default_rate`
- `advance_on_mistakes`
- `listening_word_interval_seconds`
- `random_word_selection`

### review_settings

单行复习设置表，固定 `id = 1`：

- `last_review_prompt_study_day`
- `wrong_review_random`
- `review_reminder_enabled`
- `review_reminder_interval_days`
- `word_review_word_limit`
- `wrong_review_word_limit`
- `auto_remove_correct_wrong_review`

### ai_settings

单行 AI 设置表，固定 `id = 1`：

- `ai_overwrite_examples`

### theme_settings

单行主题设置表，固定 `id = 1`：

- `theme_mode`
- `theme_primary_color`

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
- 四张设置表和 `user_profile` 必须保留固定单行 `id = 1`。

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
| 17 → 18 | 增加任务选词、复习、错题和统计查询索引 |
| 18 → 19 | 拆分四张设置表，删除旧提醒列、三个旧主题列和 `app_settings` |

版本 11 没有独立迁移步骤。数据库 v11 不在存档兼容范围内。

迁移实现约束：

- 每个版本是 `MIGRATIONS` 中的独立条目。
- `ALTER TABLE ADD COLUMN` 先检查 `PRAGMA table_info`，重复启动不会再次加列。
- 创建表、创建索引和默认行写入均使用幂等 SQL。
- 版本号与对应迁移位于同一事务，不再统一等到全部迁移结束后写入。

## 仓库映射

| 数据域 | 文件 |
|---|---|
| 数据库初始化与迁移调度 | `src/database/database.ts` |
| 版本迁移注册表 | `src/database/migrations.ts` |
| 设置单行自愈 | `src/database/settingsRows.ts` |
| 当前字段和结构校验 | `src/database/schema.ts` |
| 共享查询字段 | `src/database/sqlFragments.ts` |
| 单词 | `src/database/wordsRepository.ts` |
| 错题与学习状态 | `src/database/wrongBookRepository.ts` |
| 任务完成事务 | `src/database/taskCompletionRepository.ts` |
| 底层完成记录 | `src/database/studyRepository.ts` |
| 任务单词行映射 | `src/database/taskWordMapper.ts` |
| 首页统计和提醒 | `src/database/statsRepository.ts` |
| 每日任务设置 | `src/database/settingsRepository.ts` |
| 复习查询 | `src/database/reviewRepository.ts` |
| 个人资料 | `src/database/userProfileRepository.ts` |
| 主题 | `src/database/themeRepository.ts` |
| AI 选项 | `src/database/aiRepository.ts` |

## 存档关系

`src/database/schema.ts` 统一定义存档字段和表顺序，`features/archive/archiveSnapshot.ts` 使用该定义保存以下表：

- `words`
- `task_settings`
- `review_settings`
- `ai_settings`
- `theme_settings`
- `user_profile`
- `word_learning_state`
- `wrong_book_words`
- `study_sessions`

恢复时按上述依赖顺序删除和插入，并使用同一主连接事务，使该连接已开启的外键约束生效。恢复结束后在同一事务内调用 `ensureSettingsRows`。解析和恢复前都会检查字段类型、数值范围、字符串长度、图片 URI、主键重复和引用完整性。任何表字段变化都必须同步：

1. `src/database/schema.ts` 中的 `DATABASE_TABLE_SCHEMAS`
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

## 数据测试

`tests/data.test.ts` 当前包含 26 项测试：

- 真实迁移后的 schema 校验。
- v0 → v19 迁移和默认设置。
- 字段漂移拒绝。
- 存档 JSON round-trip 和错误格式拒绝。
- 迁移中途失败时整批回滚。
- schema 已前进但 `user_version` 仍为 0 时自动修复。
- 设置表单行缺失后保存主题可自愈。
- 拒绝未来数据库版本和不支持的 v11。
- 读取每日任务设置不会创建缺失行。
- v16 自定义主题迁移到当前存档结构。
- 当前版本存档缺字段、非法图片 URI 和孤儿引用拒绝。
- 空设置表存档恢复后自动补齐默认设置。
- v10 资料和主题缺列默认值。
- v14 无主题字段时恢复默认主题。
- v18 数据库设置迁移到四张 v19 设置表。
- v18 旧存档的 `app_settings` 自动转换为 v19 四张设置表。
- 每日任务只在完成页单事务写错题、学习状态和打卡。
- 错题回顾只在完成页自动移出正确单词。
- v18 查询索引创建成功。
- `TaskWord` mapper 和三种任务启动用例。

## v18 查询索引

- `idx_words_active_status_word`：当前词库、学习状态和字母顺序。
- `idx_learning_last_learned`：最近学习时间范围。
- `idx_wrong_last_wrong`：错题最近答错时间排序。
- `idx_sessions_study_date`：首页今日学习和学习天数统计。

v18 及更早存档继续保留兼容，解析时会把旧 `app_settings` 拆分为四张设置表。
