# 当前交接

最后更新：2026-10-20 21:51

## 当前状态

- 分支：`main`
- 已提交基线：`2297b77 Close unsupported web and iOS platform entry points`
- 当前阶段：P2-7 无障碍第一批已完成自动验证，等待 TalkBack/大字号真机验收
- P5：已按当前实现收口，不再返工视觉问题
- P6：已完成代码、文档、资源、页面拆分、数据测试和最终一致性检查
- 当前工作：提升辅助文字对比度、补齐输入框/开关标签并增强弹窗语义
- P6 不包含 EAS、APK、签名和发布

## 接手先做

```powershell
Set-Location 'F:\English vocabulary app\Project\vocab-app'
git status --short --branch
git log --oneline --decorate -5
```

然后读取：

1. `docs/README.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/ARCHITECTURE.md`
4. `docs/MODULE_REFERENCE.md`
5. `docs/DATA_FLOW.md`
6. `docs/DATABASE.md`
7. `docs/QUALITY_AND_TECH_DEBT.md`
8. `docs/P6_PROGRESS.md`

## 当前规则

- 不重新设计已收口的 P5 主题 UI。
- 不新增业务功能。
- 不进行打包、签名或发布。
- 修改前先查同类实现；优先复用或扩展现有模式，不为一次性需求新增抽象。
- 每次只整理一个明确边界。
- 改完运行 `npm test`、`npm run typecheck`、`npm run lint` 和 Android 离线导出。
- 稳定后按批次提交 Git。

## 下一轮重构

- 按 `F:\English vocabulary app\项目分析\App架构分析与重构指南.md` 的 P0 → P1 → P2 顺序推进。
- P2-6、P2-5、P2-4、P2-1/P2-3、P2-2 已完成，并完成验收补充修复。
- v21 数据库迁移已完成真机验收。
- P2-9 已完成；P2-7 第二批将处理固定高度、大字号裁切和减少动画。
- 下一批处理剩余 P2-1 项：`word_learning_state.learned_count` 的停止写入/删除方案。
- 下一阶段不得回退统一导航入口和现有真机验收结果。

## P2-6 工程化门禁结果

- `package.json` 增加 Node `>=22.5.0` 约束，匹配 `node:sqlite` 测试要求。
- 接入 Prettier 3.9.10，新增 `format` 和 `format:check`。
- 源码、测试、配置和 GitHub Actions workflow 完成统一格式化。
- 新增 `test:coverage`，覆盖率最低阈值为行、分支、函数各 80%。
- 当前测试覆盖率：行 87.25%、分支 85.20%、函数 82.44%。
- 新增 `doctor` 和统一门禁 `check`；Expo Doctor 21/21 通过。
- 新增 `.github/workflows/ci.yml`，依次执行格式、类型、Lint、覆盖率和 Doctor。
- 已通过 `npm run check` 和 Android 离线导出。
- 本批为纯工程化改动，不改变业务行为。

## P2-5 依赖清理结果

- 搜索确认 `expo-document-picker` 没有源码、配置或文档引用。
- 已从 `package.json` 和 `package-lock.json` 移除 `expo-document-picker`，依赖树减少 1 个包。
- `expo-linking` 是 `expo-router` 的 peer dependency，保留。
- `react-dom` 和 `react-native-web` 是 Expo Router/Expo 的 web peer，保留到平台收口批次再决定。
- `npx expo install --check` 显示依赖全部匹配。
- 已通过 `npm run check` 和 Android 离线导出。
- `npm audit --omit=dev` 仍报告 30 个传递依赖审计项，来源为 Expo/Metro/Router；强制修复会要求 Expo 44 降级或 Router 58 跨大版本升级，本批不执行。

## P2-4 资源优化结果

- App 图标保持 1024 × 1024，并通过调色板压缩从约 906KB 降到 364KB。
- favicon 从 1024 × 1024、约 906KB 调整为 64 × 64、约 3.5KB。
- 启动图从 1024 × 1024、约 906KB 调整为 768 × 768、约 238KB。
- 三张页面大插画从 120–161KB 压缩到 35–47KB，像素尺寸不变。
- 删除 P5 已废弃的 `assets/app/android` adaptive 模板资源，保持 P5 收口的主图标方案。
- 两个同哈希头像收敛为 `avatar-user.png`，`uiAssets` 统一暴露 `avatars.default`。
- 资源总量从 3,291,233 字节降到 778,506 字节，减少 2,512,727 字节，约 76.3%。
- 当前资源目录无重复哈希文件。
- 已通过 `npm run check` 和 Android 离线导出。

## P2-1/P2-3 v19 设置模型结果

- 数据库升级到 v19。
- 原 `app_settings` 拆分为 `task_settings`、`review_settings`、`ai_settings` 和 `theme_settings`。
- 删除 `last_review_prompt_checkin`、`theme_accent_color`、`theme_surface_color`、`theme_background_color` 和旧 `app_settings` 表。
- 四个设置表均保持固定单行 `id = 1`，由 `ensureSettingsRows` 自愈。
- 每日任务设置保存时在同一事务内写入 `task_settings` 和 `review_settings`。
- 当前存档改用四张设置表；v10-v18 旧存档解析时会自动转换旧 `app_settings` 行。
- 数据测试从 24 项增加到 26 项，覆盖 v18 数据库迁移和 v18 旧存档迁移。
- `learned_count` 留到后续批次，`wrong_book_words.sources` 已在 v20 处理。
- 已通过类型检查、Lint、数据测试和 Android 导出。

## P2-2 v20 错题来源规范化结果

- 数据库升级到 v20，新增 `wrong_book_sources` 关联表。
- `wrong_book_words` 删除 `sources` 文本列。
- 旧 `fill,listening,manual` 字符串在迁移时拆分并去重写入关联表。
- 错题分页查询通过 `GROUP_CONCAT` 还原当前行的来源集合，UI 改为使用 `WrongBookSource[]`。
- 错题移除时先清理来源行，再删除错题主行。
- v19 旧存档解析时自动把 `sources` 字符串转换为 `wrong_book_sources` 行。
- 数据测试从 26 项增加到 28 项，覆盖 v19 数据库迁移、旧存档转换和 schema 修复幂等。
- 已通过类型检查与数据测试。

## 验收补充修复：添加错题候选过滤

- CSV 规则不变：音标列必须存在，但音标单元格允许为空。
- `zero`、`hello` 音标为空仍属于合法导入，不是导入失败。
- 问题根因是“可添加错题”查询未过滤 `words.is_active = 1`，软停用词会泄漏到添加错题页。
- 计数和列表查询现在同时排除软停用词和已在错题本的单词。
- 新增回归测试，数据测试增加到 29 项，全项目共 40 项。
- 已通过 `npm run check` 和 Android 离线导出。

## AI 单词数据补齐功能

- “生成单词数据”现在补齐启用词库中缺失的音标和例句。
- 默认只选择音标为空或例句为空的启用单词。
- 已有一个字段时只更新缺失字段，不覆盖已有内容。
- “覆盖已有单词数据”开启后会重新生成已有音标和例句。
- 单词和中文释义始终不会被 AI 修改。
- DeepSeek 返回缺少音标或有效例句时，该单词计为失败且不写入半成品数据。
- 设置页标题、说明、开关、进度、完成提示和清除 Key 文案已同步。
- 新增待补齐选词、选择性更新和 AI 返回解析测试。
- 已通过 `npm run check` 和 Android 离线导出。

## 认识单词页长单词自动缩放

- Android 不支持 `adjustsFontSizeToFit`，改为按屏幕可用宽度和字符数量计算字号。
- 短单词保持 54px 上限；长单词自动缩小，最低保持 16px。
- 单词固定单行居中，不再在单词中间断行。
- 音标和释义字号不受影响。
- 新增字号计算纯函数测试，全项目共 46 项。
- 已通过 `npm run check` 和 Android 离线导出。

## P2-1 v21 学习次数列清理

- 数据库升级到 v21。
- 删除 `word_learning_state.learned_count`，首次和最近学习时间保持不变。
- 每日任务完成、底层完成记录和手动标记已学习均停止写该列。
- 当前存档不再包含学习次数；v20 旧存档中的旧字段会被安全忽略。
- 数据测试增加到 34 项，全项目共 48 项。
- 已通过类型检查与数据测试，等待真机迁移验收。

## P2-9 Android-only 平台收口

- 删除 `ios` 和 `web` npm 启动脚本。
- 删除 `app.json` 中的 `ios` 与 `web` 配置。
- 移除 Web 专用的 `.vscode/launch.json` 和 `assets/app/favicon.png`。
- 移除直接依赖 `react-dom` 和 `react-native-web`。
- 保留 Expo Router 必需的 `expo-linking`。
- README 和开发指南明确项目仅支持 Android，不提供 Web/iOS 调试入口。
- 已通过依赖检查、完整门禁和 Android 导出。

## P2-7 无障碍第一批

- 日间主题 `textSecondary` 调整为 `#5F6977`，`textMuted` 调整为 `#646E7E`。
- 两种辅助文字在页面背景和白色表面上均达到至少 4.5:1 对比度。
- danger/success 按钮的前景色根据实际底色自动选择深色或浅色。
- API Key、添加单词、错题手动添加、资料编辑、页码跳转和颜色输入均补齐无障碍标签。
- AI“覆盖已有单词数据”开关补齐标签、提示和选中状态。
- Dialog 容器增加 `alert` 语义，保留模态隔离和 Android 返回关闭。
- 新增浅色/深色对比度与按钮前景色测试，全项目共 51 项。
- 已通过完整门禁和 Android 导出。

## P0 批次 0-3 结果

- `src/database/database.ts` 只保留连接设置、版本检查、迁移调度和启动校验。
- 新增 `src/database/migrations.ts`，16 个迁移块改为版本注册表。
- 所有待执行迁移在同一主连接事务中运行，每步写入 `user_version`。
- `ALTER TABLE` 通过 `PRAGMA table_info` 做列级幂等保护。
- 新增 `src/database/appSettings.ts`，启动、主题保存、AI 设置和提醒标记可自愈设置单行。
- `getDailyTaskSettings` 不再在读取时写库。
- 任务页返回监听改为焦点级，完成页独立接管返回并返回首页。
- 完成任务改用 `router.replace`，提交标志成功和失败都会复位。
- 填空和听力确认只更新内存错误集合，退出任务不写错题、不改变单词状态。
- 完成页通过 `completeTaskSession` 单事务结算错题、学习状态、学习历史和打卡。
- Provider 保存填空/听力独立错误来源，同一单词的任务错误次数只增加一次。
- `TaskErrorModal` 的 Android 返回键只关闭弹窗，不写库、不跳页。
- 存档读取改为事务读取，恢复改为同一主连接事务。
- 存档支持 v10-v16 旧主题映射，并校验 20 MB、每表 50,000 行、数值、颜色、图片 URI、主键和引用完整性。
- 存档和名片文件名显式增加 `.json` / `.png`。
- 主题初始化、错题回顾启动和图片选择补齐错误提示与状态复位。
- `tests/data.test.ts` 改为执行真实迁移，当前全量 24 项测试通过。
- 已通过 `npm test`、`npm run typecheck`、`npm run lint` 和 Android 离线导出。
- 用户已确认本轮真机验收通过，修改已提交 Git。

## P0 真机验收清单

1. 使用复制出的旧数据库启动，确认迁移、词库、错题和学习记录保留。
2. 认识单词、填空、听力、完成页分别按 Android 返回键，确认只由当前页处理。
3. 填空或听力答错后不进入完成页，直接退出任务；确认错题次数和单词状态均未变化。
4. 仅完成填空后在听力页退出，再次进入每日任务，确认可选新单词集合未改变。
5. 完成整个任务后在完成页确认保存完成，再检查错题和打卡已写入。
6. 同一单词在填空和听力都答错，确认完成页保存后 `wrong_count` 只增加一次，来源包含 `fill,listening`。
7. 导出存档后修改数据再导入，确认完整恢复且文件名带 `.json`。
8. 导入 v16 自定义主题存档，确认主题色不丢失。
9. 选择超大、损坏、非法图片 URI 或孤儿引用存档，确认拒绝且原数据不变。
10. 测试相册取消/失败、错题回顾加载失败和主题读取失败，确认无未处理拒绝。

## P1 第一批结果

- 新增 `src/domain/word/taskWord.ts`，任务流程只依赖 `TaskWord`。
- 新增 `src/database/taskWordMapper.ts`，数据库 `snake_case` 行转换为领域对象。
- 每日任务、错题回顾、单词再练启动选词收敛到 `application/daily-task/startTaskSelection.ts`。
- 错题回顾和单词再练改为 SQL 随机抽取并 `LIMIT`，只查询任务需要的五列。
- 数据库升级到 v18，增加任务选词、复习、错题和统计索引。
- v17 存档与 v18 表结构相同，继续兼容。
- `tests/data.test.ts` 现有 24 项测试全部通过。
- 已通过 `npm test`、`npm run typecheck`、`npm run lint` 和 Android 离线导出。
- 用户已确认本批真机验收通过，修改已提交 Git。

## P1 第一批验收清单

1. 用旧 v17 数据启动，确认升级到 v18 后词库、学习记录和错题仍正常。
2. 进入每日任务，确认可选单词数量和内容正常，开始后认识单词、填空、听力流程不变。
3. 进入错题回顾，确认按设置数量抽取，随机开/关行为正常。
4. 进入单词再练，切换 7 天/全部范围，确认随机抽取数量和开始流程正常。
5. 首页统计、错题本排序和复习范围与升级前一致。

## P1 任务状态机结果

- `DailyTaskProvider` 改用 `useReducer`，任务阶段为 `idle`、`learning`、`filling`、`listening`、`completed`。
- 每日任务和错题回顾从 `learning` 开始，单词再练从 `filling` 开始。
- 认识页、填空页、听力页和完成页接入阶段守卫，阶段不匹配时自动跳转。
- 听力页拆出 `ListeningPlayerCard` 和 `ListeningAnswerList`。
- 修复 `START_TASK` 未写回 `taskMode`，三种任务退出弹窗现在显示正确标题。
- 修复 `START_TASK` 未把 `settings` 写入 `taskSettings`，以及听力速度只初始化一次的问题。
- 默认听力速度现在来自任务设置快照，临时切换只覆盖当前任务。
- 新增 5 项 reducer/展示测试，全项目共 29 项测试通过。
- 已通过 `npm test`、`npm run typecheck`、`npm run lint` 和 Android 离线导出。

## P1 任务状态机验收清单

1. 每日任务从认识单词开始，逐页进入填空、听力和完成页。
2. 单词再练直接进入填空页，不出现认识单词页。
3. 错题回顾从认识单词开始，后续流程与每日任务一致。
4. 在任一任务页按 Android 返回键，确认只弹出当前任务的退出确认。
5. 完成页等待保存成功后返回首页，再次进入任务应从认识页或填空页重新开始。
6. 快速连续点击进入下一阶段，确认不会重复跳页或回到上一阶段。
7. 听力页播放、暂停、回退一个单词、切换倍速和滚动输入均正常。
8. 分别进入每日任务、错题回顾、单词再练，点击返回，弹窗标题应分别为“退出每日任务？”、“退出错题回顾？”、“退出单词再练？”。
9. 通用设置把听力默认速度设为 `1.5x`，保存后开始任务，听力页初始速度和播放速度都应为 `1.5x`。

## P1 Context 拆分结果

- `DailyTaskProvider` 拆分为 `TaskSessionContext` 和 `TaskAnswersContext`。
- 认识页和任务入口只订阅会话 Context。
- 填空、听力页分别按需订阅会话和答案 Context。
- 阶段推进和路由跳转统一由 `useTaskPhaseNavigation` 完成。
- 新增阶段路由映射测试，全项目共 30 项测试通过。
- 用户已确认本批真机验收通过，修改已提交 Git。

## P1 Context 拆分验收清单

1. 每日任务、错题回顾、单词再练三种流程完整走通。
2. 在填空和听力输入答案时，页面内容与输入焦点保持稳定。
3. 填空到听力、听力到完成页只跳转一次，不出现闪回或错误阶段页。
4. 退出弹窗标题仍分别显示每日任务、错题回顾、单词再练。
5. 听力默认速度 `1.5x` 和本任务临时倍速切换保持正常。

## P1 填空页拆分结果

- 填空页从约 450 行降到 219 行。
- 新增 `FillBlankQuestionCard`，负责题目滚动、填空答案展示和错误样式。
- 新增 `FillBlankWordBank`，负责词库分页、选中和已使用状态。
- 填空答案、当前页错误标记和选中单词改为页面局部状态。
- Provider 只保存本次任务确认过的填空错词，不再保存逐词答案。
- 全项目 30 项测试通过。
- 用户已确认本批真机验收通过，修改已提交 Git。

## P1 填空页验收清单

1. 每日任务完整走通认识、填空、听力、完成页。
2. 在填空页连续选择、替换和清空答案，确认选项状态和填空内容同步。
3. 切换词库分页后重新选择单词，确认已使用单词显示变淡且不能重复占用。
4. 故意答错后确认，修改答案并再次提交，确认当前红色错误标记正确更新。
5. 填空答错后不修改直接再次提交，确认任务错词不会重复累计。
6. 退出任务后重新开始，确认上次填空答案没有残留。
7. 单词再练直接进入填空页，流程和每日任务一致。

## P1 听力答案局部化结果

- 听力答案、当前错误标记和错误弹窗状态都在听力页面本地。
- Provider 不再保存逐词听力答案或当前页错误集合。
- `TaskAnswersContext` 改名为 `TaskMistakesContext`，只保存填空/听力最终错词。
- 听力页通过 `recordListeningMistakes` 上报确认错误，完成页统一结算。
- 填空和听力提交时立即标记错误，关闭错误弹窗后红色状态仍保留。
- 全项目 30 项测试通过。
- 用户已确认本批真机验收通过，修改已提交 Git。

## P1 听力答案局部化验收清单

1. 每日任务完整走通填空、听力、完成页。
2. 听力输入文字时，内容和键盘焦点保持稳定。
3. 修改错误答案时，对应红色错误样式立即清除。
4. 错误弹窗按 Android 返回键只关闭提示，不记录错词。
5. 听力答错后直接退出任务，错题和学习状态均不写入。
6. 完成听力后进入完成页，确认任务错词和来源正确写入。
7. 同一单词在填空和听力都答错时，`wrong_count` 只增加一次。

## P1 设计系统与无障碍结果

- 新增 `Button`，统一 primary、secondary、danger、success、禁用和按压状态。
- 新增 `Dialog`，统一遮罩、容器和模态无障碍语义。
- 任务错误弹窗、退出弹窗、全局操作弹窗、填空和听力提交按钮完成迁移。
- 听力输入、词库分页和设置开关补齐无障碍标签与状态。
- 用户已确认本批真机验收通过。

## P1 设计系统与无障碍验收清单

1. 日间、夜间、自定义主题下检查所有弹窗背景、遮罩和按钮颜色。
2. 打开错误弹窗和退出弹窗，确认尺寸、间距和此前 P5 视觉一致。
3. 填空和听力禁用、按下、提交状态正常。
4. 全局提示弹窗和确认弹窗的按钮层级、危险色正常。
5. 开启 TalkBack，检查听力输入会朗读序号和“听力答案”。
6. 开启 TalkBack，检查词库选项会朗读单词及选中状态，分页会朗读页码。
7. 开启 TalkBack，检查设置开关会朗读标题、提示和开启/关闭状态。
8. 系统字体调到最大，确认弹窗按钮和任务提交按钮文字不被裁切。

## P1 导航稳定性结果

- 新增统一导航锁，最小锁定 300ms，最大等待 500ms。
- `PUSH`、`BACK`、`REPLACE`、`DISMISS_TO`、`RESET` 全部经过 `src/utils/navigationActions.ts`。
- 根布局在 `pathname` 变化后释放锁，锁定期内消费 Android 返回事件。
- 设置页、普通页面、任务阶段、退出确认和完成页的导航均接入统一入口。
- 任务开始等“状态修改 + 导航”动作只在获得锁后执行状态修改。
- 四个任务阶段页在恢复期间显示主题化加载占位，不再直接返回 `null`。
- 用户已按“进入页面立即返回、连续快速返回”完成 17 个入口的真机验收。
- 全项目 35 项测试通过，其中新增 5 项导航锁测试。
- 已通过 `npm run typecheck`、`npm run lint`、`npm test` 和 Android 离线导出。

## 最近视觉修正

- `dc0df06`：任务退出确认弹层的“否”按钮文字改为白色。
- `8e477f3`：选词填空“提交”按钮统一使用 `primary/onPrimary`，禁用态保持 `disabled`。

## P6 结论

- 当前代码和文档已达到可分析、可交接和可小步修改的状态。
- 迁移 SQL 保持显式，使用真实 SQLite 测试和运行时 schema 校验防漂移。
- 页面交互测试、端到端 UI 测试和进一步领域层重构不属于 P6。
- 下一阶段需要由用户重新指定目标。

## 给其他 AI 的推荐材料

只分析架构时：

1. `PROJECT_CONTEXT.md`
2. `ARCHITECTURE.md`
3. `MODULE_REFERENCE.md`
4. `DATA_FLOW.md`
5. `DATABASE.md`
6. `QUALITY_AND_TECH_DEBT.md`

要修改代码时再补充：

1. `REQUIREMENTS.md`
2. `UI_MAP.md`
3. `THEME_GUIDE.md`
4. `ASSETS.md`
5. `DEVELOPMENT_GUIDE.md`

## 新窗口提示

```text
你现在接手《易词通（Ez Word）》项目。

项目路径：
F:\English vocabulary app\Project\vocab-app

请先读取 docs/README.md、CURRENT_HANDOFF.md、PROJECT_CONTEXT.md、
ARCHITECTURE.md、MODULE_REFERENCE.md、DATA_FLOW.md、DATABASE.md、
QUALITY_AND_TECH_DEBT.md 和 P6_PROGRESS.md。

然后运行：
git status --short --branch
git log --oneline --decorate -5

当前 P2-7 无障碍第一批已完成自动验证，等待 TalkBack/大字号真机验收。
请先读取重构指南和 CURRENT_HANDOFF 的最新批次记录，
不要重新设计 P5 主题 UI，不要进入 EAS、APK、签名和发布流程，
不要回滚用户已有修改。

请先说明当前 Git 状态、P2-7 第一批验收结果和剩余大字号/减少动画工作。
```
