# 质量与技术债

最后更新：2026-10-22 19:37

## 当前质量门槛

每次代码整理至少执行：

```powershell
npm run check
npx expo export --platform android --output-dir .expo/check
```

`npm run check` 依次执行：

```powershell
npm run format:check
npm run docs:check
npm run typecheck
npm run lint
npm run test:coverage
npm run doctor
```

## 已具备的自动验证

- TypeScript 类型检查
- ESLint
- Prettier 格式检查
- Expo 配置解析
- Expo Doctor 21 项项目检查
- Android Metro 打包和资源引用检查
- 文档引用存在性检查
- 数据层 schema 和存档 round-trip 测试
- Node 内置测试覆盖率及 80% 最低阈值
- GitHub Actions 自动质量门禁

## 测试缺口

- 已有 58 项测试：34 项数据/用例测试，9 项任务/字号计算测试，5 项导航锁测试，3 项无障碍对比度测试，4 项错误与诊断测试，3 项 Android 发布配置测试。覆盖 v0 → v21 真实迁移、schema 校验、迁移回滚、存档兼容与安全、完成页统一结算、v18 索引、`TaskWord` mapper、三种任务启动用例、AI 单词数据选词/更新/解析、任务状态机、长单词字号计算、主题对比度、错误码、日志脱敏、阶段路由、重复导航拒绝和 release 签名注入/CMake 版本幂等。
- 没有覆盖页面交互的单元测试。
- 没有组件渲染测试。
- 已有 3 条 Maestro Android 真机 smoke flow，覆盖启动、首页、底部 Tab、通用设置、每日任务启动和任务退出；任务完成、错题、词库、存档、AI 设置和设置保存等 E2E 仍缺失。
- 没有循环依赖和未使用导出的自动化检查。
- 关键业务流程仍依赖人工验收。

因此，涉及数据库事务、存档、导航或原生能力时，仅通过类型检查和打包不能证明行为完全正确。

## 高内聚与低耦合现状

| 模块 | 内聚性 | 耦合风险 | 判断 |
|---|---|---|---|
| `database` | 较高 | 接受 SQLite 连接和少量常量 | 职责清晰 |
| `services` | 较高 | 文件、网络、TTS、SecureStore 各自独立 | 边界清晰 |
| `features/daily-task` | 较高 | 依赖 WordRecord 和设置类型 | 合理 |
| `features/archive` | 较高 | 使用共享 schema 并有 round-trip 测试 | 风险降低 |
| `features/word-import` | 中等 | 文件 I/O 已分离，保留解析、入库和展示组件 | 边界改善 |
| `components` | 较高 | 依赖主题和部分业务显示类型 | 基本合理 |
| `app/settings` | 中等 | 大页面已拆分，仍由页面编排仓库和弹层 | 明显改善 |
| `app/daily-task` | 中等 | 页面直接调用错误记录和完成仓库 | 可接受但需契约 |
| `hooks` | 较高 | 依赖 SQLite 调用方传入 | 新 Hook 方向正确 |

## 技术债优先级

### P2 已完成：工程化门禁

- 新增 Prettier 和统一格式化配置，源码、测试、配置及 CI workflow 已格式化。
- `package.json` 声明 Node `>=22.5.0`，覆盖 `node:sqlite` 的运行要求。
- 新增 `test:coverage`，行、分支、函数最低阈值均为 80%。
- 当前覆盖率：行 87.25%、分支 85.20%、函数 82.44%。
- 新增 Expo Doctor 脚本和 GitHub Actions CI。
- `npm run check` 成为本地统一质量入口。
- 下一批依赖审计和删包仍应单独提交，不在本批处理 `npm audit` 结果。

### P2 已完成：依赖清理

- 移除未使用的 `expo-document-picker`。
- `expo-linking` 保留，因为它是 `expo-router` 的 peer dependency。
- `react-dom`、`react-native-web` 保留，因为它们是 Expo Router/Expo web peer；平台是否正式支持在 P2-9 单独收口。
- `npx expo install --check`、`npm run check` 和 Android 导出均通过。
- `npm audit --omit=dev` 当前仍报告 30 个传递依赖审计项：`braces`、`decode-uri-component`、`node-forge`、`uuid`，来源为 Expo/Metro/Router。
- `npm audit fix --force` 会要求降级 Expo 44 或升级 Expo Router 58，均超出当前 SDK 57 兼容边界，禁止直接执行。
- 后续依赖更新应等待同一 Expo SDK 内的上游修复，或单独立项做跨 SDK 升级和真机回归。

### P2 已完成：资源优化

- 资源总量减少 2,512,727 字节，约 76.3%。
- App 图标保持 1024px；favicon 调整为 64px；启动图调整为 768px。
- 三张页面插画执行 256 色调色板压缩，显示尺寸和宽高比保持不变。
- 删除 P5 已废弃的 Android adaptive 模板目录。
- 两个同哈希头像收敛为一个默认头像资源。
- 重复资源哈希检查为零，Android 导出资源引用完整。
- 资源视觉仍需在后续真机批次抽查图标、启动页和三张插画。

### P2 已完成：v19 设置模型拆分

- 数据库升级到 v19，将 `app_settings` 拆分为 `task_settings`、`review_settings`、`ai_settings` 和 `theme_settings`。
- 删除旧提醒列和三个旧主题列，设置表单行由 `ensureSettingsRows` 自愈。
- 任务设置保存在同一事务内更新任务与复习两张表。
- v10-v18 旧存档在解析时自动转换旧 `app_settings` 行。
- 新增 v18 数据库迁移与 v18 旧存档迁移测试。
- 数据测试增加到 26 项，全项目共 37 项。
- `learned_count` 仍留待后续批次，`wrong_book_words.sources` 已在 v20 处理。

### P2 已完成：v20 错题来源规范化

- `wrong_book_words.sources` 迁移为 `wrong_book_sources` 关联表。
- `(word_id, source)` 联合主键约束每个单词每种来源只出现一次。
- 旧数据库和 v19 旧存档会自动拆分逗号来源字符串。
- 错题查询改为关联聚合，UI 使用强类型来源数组。
- 删除错题时清理来源行，外键同时提供级联保护。
- 数据测试增加到 28 项，全项目共 39 项。
- `word_learning_state.learned_count` 仍需在下一批单独清理。

### 已完成：添加错题候选过滤

- `countAvailableWordsForWrongBook` 和 `listAvailableWordsForWrongBook` 增加 `words.is_active = 1`。
- 软停用词不会再出现在添加错题页。
- 已在错题本的单词继续被排除。
- CSV 音标规则保持“列必需、单元格可空”，不会阻止无音标单词导入。
- 新增软停用词与已加入错题单词的过滤回归测试。

### 已完成：AI 单词数据补齐

- 设置页“生成单词数据”从只补例句扩展为补齐音标和例句。
- 默认只处理缺音标或缺例句的启用单词，并选择性更新字段。
- 覆盖模式可重新生成已有音标和例句，但不修改单词和释义。
- AI 返回缺字段或无效例句时，该单词计为失败，不写入部分数据。
- 新增选词、字段保护和响应解析测试。
- 真实 DeepSeek 调用仍需使用用户 Key 做一次在线验收。

### 已完成：认识单词页长单词自动缩放

- Android 不依赖仅 iOS 生效的 `adjustsFontSizeToFit`。
- 根据可用宽度和字符数量计算 54px–16px 之间的单词字号。
- 单词固定单行居中，避免 `luminescent` 等单词从中间断行。
- 新增字号上限、长词缩放、最低字号和无效宽度测试。

### P2 已完成：v21 学习次数列清理

- 删除 `word_learning_state.learned_count`。
- 保留 `first_learned_at` 和 `last_learned_at`，学习历史语义不变。
- 所有学习状态写入路径停止更新学习次数。
- v20 存档兼容，旧 `learned_count` 字段解析时忽略。
- 新增 v20→v21 数据保留、列删除和旧存档忽略测试。

### P2 已完成：Android-only 平台收口

- 删除 iOS/Web 启动脚本和 `app.json` 平台配置。
- 删除 Web 调试配置和 favicon。
- 移除不再直接需要的 `react-dom`、`react-native-web` 依赖。
- `expo-linking` 保留，因为它是 Expo Router 的必需 peer dependency。
- README 与开发指南明确只支持 Android。
- Android 打包和 Expo Doctor 继续通过。

### P2 第一批已完成：基础无障碍语义

- 日间辅助文字对比度提升到 WCAG AA 4.5:1 以上。
- danger/success 按钮前景色按底色动态选择。
- API Key、添加单词、错题手动添加、资料编辑、页码跳转和颜色输入补齐标签。
- AI 覆盖开关补齐标签、提示和 checked 状态。
- Dialog 增加 alert 语义。
- 新增 3 项对比度回归测试。
- 固定高度、大字号裁切和减少动画留待 P2-7 下一批。

### P2 第二批已完成：大字号与减少动画

- 高频文字按钮从固定高度改为最小高度和垂直内边距。
- 根导航、Dialog、原生 Modal 和滚动提示接入系统减少动画设置。
- 系统字体增大时，按钮可以增高而不是裁切文字。
- 仍需真机覆盖系统最大字体、TalkBack 和减少动画切换。

### P2 第一批已完成：可观测性基础

- 统一应用错误码，未知异常可以标准化为 `AppError`。
- 日志上下文和文本自动脱敏，避免 API Key 与 Authorization 泄漏。
- 诊断报告只在本地生成，不包含 API Key，也不上传个人数据。
- 根错误页显示稳定错误代码。
- DeepSeek 和 AI 生成失败接入本地日志。

### P2 已完成：自动性能预算

- Android HBC 预算为 6 MB，当前约 5.57 MB。
- 资源总量预算为 1 MB，当前约 757 KB。
- 单资源预算 512 KB，当前最大图标约 356 KB。
- 资源文件数预算 24，当前 18。
- `check:release` 在完整门禁后执行导出和性能预算。
- 冷启动、输入帧率、滚动、导入耗时和 APK 体积仍需后续真机 Perfetto/构建采集。

### P2 已完成：文档治理

- `npm run docs:check` 验证 17 份必需文档、6 个公开仓库文件、更新时间、脚本引用、文档路径和样例路径。
- 文档检查已加入 `npm run check`。
- 新增交接与 ADR 模板，避免每批交接结构漂移。
- 新增 Android-only、统一导航锁和规范化数据模型 ADR。

### 发布阶段剩余阻塞项

- 需要 GitHub 远程仓库并实际运行 CI。
- 需要正式 Android 包名、versionCode、签名 APK 和 GitHub Release。
- 需要 Maestro/E2E 和真实 APK 覆盖升级验收。
- 需要真机 Perfetto 性能数据。
- 需要处理 30 个 Expo/Metro/Router 传递依赖告警的发布结论。
- 需要确认 Android 备份策略、数据库明文和用户图片数据边界。
- 需要 7 天个人实跑和 1–2 名外部 Android 用户闭测。
- 完整执行标准见 `docs/OPEN_SOURCE_RELEASE_PLAN.md`。

### 已解决：P0 数据与任务主链路

- 迁移已改为版本注册表，并在同一主连接事务中执行。
- `user_version` 在每一步迁移后写入，失败会整体回滚。
- `ALTER TABLE` 已使用列存在检查，兼容旧实现留下的部分迁移状态。
- 启动和设置保存会确保四张设置表单行存在。
- 任务返回键改为焦点级监听，完成页有独立返回守卫并使用 `replace`。
- 填空和听力错误只累计在内存，退出任务不改变单词状态；完成页通过 `completeTaskSession` 单事务统一写库。
- 同一单词同时来自填空和听力的错误来源会合并，`wrong_count` 每次任务只增加一次。
- 存档读取使用事务，恢复使用同一主连接事务，并校验大小、字段范围、图片 URI 和引用完整性。
- v10-v16 存档可迁移旧主题与资料默认值，导出文件名显式带 `.json`。
- 主题初始化、错题回顾启动和图片选择补齐错误处理。
- 后续仍需补真实旧版本数据库 fixture，并在后续批次回归 SAF、相册和 TTS。

### P0：存档 schema 与数据库 schema 双维护

当前已通过 `src/database/schema.ts` 统一当前字段、存档字段、恢复顺序，并在迁移后校验真实表结构。真实 SQLite 测试会执行 v0 → v21 迁移，因此迁移 SQL 虽然是手写，但结果已被测试锁定。

建议：

- 保持 schema 定义、迁移 SQL 和校验三者同步。
- 后续增加更多旧版本存档样例和迁移回归数据。

### P1 已完成：任务领域模型与启动用例

- 新增 `domain/word/TaskWord` 和数据库 mapper，任务页、模板、TTS 不再依赖 `WordRecord`。
- 每日任务、错题回顾、单词再练的启动选词收敛到 `application/daily-task/startTaskSelection.ts`。
- 错题回顾和单词再练改为 SQL 随机抽取并 `LIMIT`，不再加载全部候选词后截取。
- v18 增加任务、复习、错题排序和统计查询索引。

### P1 已完成：任务状态机与听力页拆分

- `DailyTaskProvider` 改为 `useReducer`，任务阶段显式保存为 `phase`。
- 每日任务和错题回顾从认识单词开始，单词再练直接从填空开始。
- 四个任务页接入阶段守卫，错误深链会跳转到当前阶段对应页面。
- 听力页拆分出 `ListeningPlayerCard` 和 `ListeningAnswerList`，页面从 538 行降到约 306 行。
- `taskMode` 正确写入 reducer 状态，三种任务退出弹窗显示对应标题。
- 任务设置快照正确写入 `taskSettings`，听力默认速度从该快照解析，临时切换只覆盖当前任务。

### P1 已完成：任务 Context 拆分与阶段导航

- `DailyTaskProvider` 拆成任务会话 Context 和任务答案 Context。
- 认识页和任务入口只订阅会话数据，答案输入不会触发这些消费者重渲染。
- 填空和听力页按需分别订阅会话与答案数据。
- 新增 `useTaskPhaseNavigation`，阶段推进和路由跳转收敛为一个 Hook。

### P1 已完成：填空页拆分与局部答案

- `fill-blank.tsx` 从约 450 行降到 219 行。
- 题目滚动、填空交互和词库分页拆成独立组件。
- 填空答案与当前页错误标记改为页面局部状态。
- Provider 只接收本次任务最终确认过的填空错词，不再保存逐词填空答案。

### P1 已完成：听力答案局部化

- 听力答案和当前页错误标记移入听力页面本地状态。
- `TaskAnswersContext` 收敛为 `TaskMistakesContext`，只保存任务最终错词。
- 听力页只向 Provider 上报确认过的错词，完成页继续负责单事务结算。

### P1 已完成：全导航动作锁

- PUSH 发起时立即获得锁，不再只防已经发生的重复 BACK。
- 锁最小保持 300ms，路由未变化时最多等待 500ms 后兜底释放。
- 所有 PUSH、BACK、REPLACE、DISMISS_TO 和 RESET 收敛到 `utils/navigationActions.ts`。
- 根布局在 `pathname` 变化后释放锁，锁定期内 Android 返回事件被消费。
- 任务状态修改与导航放入同一准备回调，锁拒绝时不启动任务或重置状态。
- 四个任务页使用加载占位替代阶段恢复期间的纯空白。
- 用户已完成 17 个入口的快速返回真机验收。

### P1 已完成：基础设计系统与无障碍

- 新增 `Button`，统一 primary、secondary、danger、success、禁用和按压状态。
- 新增 `Dialog`，统一弹窗遮罩、容器和 `accessibilityViewIsModal` 语义。
- 任务错误弹窗、退出弹窗、全局操作弹窗、填空和听力提交按钮完成迁移。
- 听力输入增加序号标签，词库选项和分页增加选中状态，设置开关增加标题和提示标签。

### P1：设置页拆分（已完成）

| 页面 | 行数级别 | 问题 |
|---|---:|---|
| `settings/profile.tsx` | 约 430 | 已完成展示、编辑和外观弹窗拆分，保留数据和保存编排 |
| `settings/daily-task.tsx` | 约 170 | 已完成表单区块和通用步进器拆分 |
| `settings/ai.tsx` | 约 280 | 已完成 Key 和例句生成区块拆分 |
| `settings/import.tsx` | 约 250 | 已完成文件卡片、词库操作和说明弹窗拆分 |

建议按页面区块提取组件和表单 Hook，不直接按行数机械拆分。

### P1：页面直接调用仓库

简单列表读取可保留。涉及以下情况应下沉：

- 多个仓库组合。
- 事务和状态联动。
- 失败后的统一恢复。
- 多个页面复用同一流程。

### P2：word-import 边界混合

当前模块同时负责：

- CSV 解析。
- 数据库导入编排。
- 导入页面展示组件。

文件选择和读取已移入 `services/wordCsvFiles.ts`。后续可进一步把导入用例从 feature 展示目录中分离。

### P2：SQL 字段列表重复

`WordRecord` 的查询字段已收敛到 `database/sqlFragments.ts`。后续新增字段时仍需同步 schema 和查询片段。

### P2：展示辅助函数重复

- 听力和任务标题已统一。
- 仍有个别局部文案分支。
- 列表空态和加载骨架样式仍有重复。

### P3：主题样式重复

多个页面重复定义相同按钮、列表行和弹层样式。优先在出现第三个相同场景时抽取，避免过早抽象。

### P3：测试数据覆盖有限

当前 CSV 样例覆盖基础导入、任务、复习和 AI 例句，但缺少错误行、极端旧存档和损坏数据样例。

## 推荐重构顺序

1. word-import 解析和入库用例的进一步分层。
2. 页面交互测试和组件渲染测试。
3. 列表空态、加载骨架和剩余样式复用。
4. 更多旧版本存档和错误数据回归样例。

## 重构护栏

- 不改变已经收口的 P5 视觉规则。
- 不新增功能。
- 新增组件、样式变体、Hook、工具或服务方法前，先搜索同类实现并复用；只有现有模式不适用时才新增。
- 不跨多个业务域同时重写。
- 每次只移动一个内聚区块。
- 先补契约和测试，再移动事务代码。
- 页面拆分后保持路由和用户操作路径不变。
- 每批提交必须可独立回滚。

## 新 AI 修改代码前必须确认

1. 改动属于哪个模块和业务不变量。
2. 是否触碰 SQLite 事务。
3. 是否影响存档字段或版本兼容。
4. 是否改变页面导航或返回行为。
5. 是否需要真机验证原生能力。
6. 自动检查能覆盖什么，不能覆盖什么。
