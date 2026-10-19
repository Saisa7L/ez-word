# P6 代码与文档整理进度

最后更新：2026-10-19 18:12

## 当前状态

P6 正在进行。第一批结构盘点、数据流文档和低风险重复代码抽离已经完成。

## 阶段目标

P6 不新增业务功能，也不进行打包和发布。目标是把现有代码和文档整理到可以稳定接手、定位和维护的状态。

主要内容：

1. 整理代码：去重、删除失效代码、统一命名、拆分过长页面和重复样式。
2. 整理结构：明确页面、组件、业务功能、数据库、服务和工具层的职责边界。
3. 梳理数据流：页面入口、状态来源、SQLite 读写、主题 Provider、导入和存档恢复。
4. 整理文档：项目结构、页面清单、模块职责、数据库表、数据流和交接说明。
5. 保持自动检查通过。

## 建议顺序

| 顺序 | 工作 | 状态 | 完成标志 |
|---|---|---|---|
| 1 | 生成代码结构清单 | 已完成 | 页面、组件、features、database、services 都有职责说明 |
| 2 | 梳理页面与状态数据流 | 已完成 | 主要流程能按“入口 → 状态 → 数据库 → 页面结果”追踪 |
| 3 | 整理重复代码和命名 | 进行中 | 明显重复的样式、格式化函数和组件用法有统一方案 |
| 4 | 整理数据库文档 | 已完成 | 表、迁移版本、读写仓库和存档关系可查 |
| 5 | 整理项目文档 | 已完成 | 根目录文档与实际代码结构一致 |
| 6 | 完整回归检查 | 待最终执行 | `npm run typecheck`、`npm run lint` 和 Android 离线导出通过 |

## 第一批完成内容

- 新增 `docs/ARCHITECTURE.md`，记录启动层级、分层职责、状态归属和依赖方向
- 新增 `docs/DATA_FLOW.md`，记录首页、每日任务、错题回顾、单词再练、导入、AI、主题、资料和存档流程
- 新增 `docs/DATABASE.md`，记录 v17 表结构、状态不变量、迁移历史、仓库和存档映射
- 修正项目目录说明，删除不存在的 `features/wrong-book`、`features/review` 和 `src/types`
- 抽离 `src/utils/date.ts`，合并两处本地日期格式化
- 抽离 `src/utils/pagination.ts`，统一三个分页页面的总数和末页计算
- 抽离 `features/daily-task/taskPresentation.ts`，统一三种任务标题
- 简化存档旧字段兼容条件的布尔表达式

## 第二批完成内容

- 合并 `upsertWords` 和 `upsertSingleWord` 中重复的单词更新/插入逻辑
- 合并错题追加、答错记录和状态切换中重复的写库逻辑
- 保持错题首次加入、答错次数递增、来源合并和学习状态同步的原有语义
- 删除确认无引用的 `getWordCount`、`listWords`、`updateDisplayName`、`countReviewWords` 和 `returnToDailyTaskStart`

## 第三批完成内容

- 将 26 份 Markdown 先收敛为 13 份主文档和索引，再补入模块参考和技术债文档，当前共 15 份
- 合并 CSV 导入格式到 `docs/REQUIREMENTS.md`
- 合并资源规范到 `docs/ASSETS.md`
- 合并主题清单到 `docs/THEME_GUIDE.md`
- 合并 Git、VS Code 和工作流到 `docs/DEVELOPMENT_GUIDE.md`
- 合并 F3-F10、P1-P6 状态到 `docs/PHASE_HISTORY.md`
- 合并新窗口提示到 `docs/CURRENT_HANDOFF.md`
- UI 资源按页面重组到 `assets/ui/*`
- App 图标和启动资源移动到 `assets/app/*`
- 新增统一资源映射 `src/constants/uiAssets.ts`
- 删除重复错题图片和 4 个未引用 SVG

## 第四批完成内容

- 新增 `src/hooks/usePaginatedSelection.ts`
- 错题本、当前词库和添加错题统一使用分页、总数、加载、交叉页选择和重新加载状态
- 增加请求序号保护，避免快速翻页或离开页面后的旧请求覆盖新状态
- 页面只保留各自的查询函数和业务操作

## 第五批完成内容

- 新增 `src/features/profile/profileUtils.ts`
- 新增 `ProfileCard`，迁移名片展示和点击行为
- 新增 `ProfileEditModal`，迁移用户名和简介编辑
- 新增 `ProfileColorModal` 和 `ProfileStrokeModal`，迁移外观弹窗
- `settings/profile.tsx` 从约 1050 行降到约 430 行
- 页面继续负责数据读取、图片选择、资料保存和名片截图

## 第六批完成内容

- 新增 `features/settings/DailyTaskSettingsForm.tsx`
- 新增通用 `SettingStepper` 和 `SettingToggleRow`
- 通用设置页从约 810 行降到约 170 行
- 新增 `AiKeySection` 和 `AiExampleGenerationSection`
- AI 设置页从约 570 行降到约 280 行
- 路由页保留数据库读写、网络请求、状态和全局确认弹层

## 文档补全

- 新增 `docs/MODULE_REFERENCE.md`，记录 Provider、仓库、服务、Hook、组件和页面边界
- 新增 `docs/QUALITY_AND_TECH_DEBT.md`，记录质量门槛、测试缺口、内聚耦合判断和技术债优先级
- 补充架构说明，明确当前工作是渐进式重构而不是完整架构重写
- 补充数据流说明，增加状态分类、事务边界、导航和错误传播

## 下一批候选

1. 拆分导入页的文件、导入、清空和说明区块
2. 整理听力速度和任务模式文案等剩余展示辅助函数
3. 评估 `archiveSnapshot.ts` 的表结构定义是否可以与数据库 schema 共享
4. 继续检查未使用导出、重复样式和过长页面

## 重点流程

- 首页统计与复习提醒
- 每日任务：认识单词 → 选词填空 → 听力 → 完成
- 错题本：查看、添加、移除、错题再练
- 单词再练与定时复习
- CSV 导入、词库管理和例句生成
- 主题模式、主题持久化和存档恢复
- 个人资料、名片图片和本地存档

## 代码重点目录

- `src/app`：Expo Router 页面和导航
- `src/components`：可复用 UI 和弹层
- `src/features`：业务流程和 Provider
- `src/database`：SQLite 建表、迁移和仓库
- `src/services`：TTS、DeepSeek、文件和安全存储
- `src/constants`：主题、资源和常量
- `src/hooks`：复用状态和交互逻辑
- `docs`：阶段状态、数据结构、页面地图和交接文档

架构、数据流和数据库分别以 `docs/ARCHITECTURE.md`、`docs/DATA_FLOW.md`、`docs/DATABASE.md` 为准。

## 阶段边界

- 不重新设计已经收口的 P5 主题 UI
- 不新增产品功能
- 不执行 EAS、APK、签名和发布
- 不进行大范围重写；优先小步整理并保持可运行
- 每次结构调整后运行类型检查和 lint

## 完成标志

- 代码目录和文档目录各有一份准确的职责说明
- 主要用户流程和 SQLite 数据流有文档可查
- 明显重复代码和失效引用完成整理
- `npm run typecheck` 通过
- `npm run lint` 通过
- Android 离线导出通过
