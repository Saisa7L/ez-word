# 迁移报告

项目 HEAD commit：0dfa3f7
分析时间：2026-11-04 14:35
分析模式：adoption
分析深度：standard（+ 数据模型 deep 核对，用户 R5 选择）
skill 版本：0.1.0
文档契约版本：1.1
源体系：自有 docs/ 文档体系（9 份）+ GitHub Issues（空）
目标 docsRoot：.adoption/docs/（暂存）→ docs/（替换后，用户已选「替换」）
根文件暂存：.adoption/README.md / .adoption/AGENTS.md
工作区：干净；敏感文件存在未读取（android/app/debug.keystore，标准调试密钥）
兼容性：正常
工件路径：.adoption/MIGRATION_REPORT.md
迁移状态：completed-replaced

## 1. 源体系盘点

### 1.1 原有文档

| 路径 | 类型 | 最后更新 | 覆盖 | 状态 | 问题 |
|---|---|---|---|---|---|
| README.md | 根入口 | 2026-10-22 21:25 | 产品介绍/安装/结构 | 维护良好 | 引用旧 docs 文件名，替换后需改链接 |
| AGENTS.md | 根协作规则 | 2026-10-19 19:24 | Expo 通用守则 | 有效 | 为 Expo 通用模板，缺项目专属规则（规则散在 DEVELOPMENT_GUIDE） |
| docs/PROJECT_CONTEXT.md | 项目概况 | 2026-10-22 21:32 | 定位/技术栈/风险/状态 | 维护良好 | 与 REQUIREMENTS 部分重叠 |
| docs/REQUIREMENTS.md | 需求确认单 | 2026-10-22 21:32 | 范围/规则/CSV 格式/成功标准 | 维护良好 | 无 |
| docs/ARCHITECTURE.md | 架构说明 | 2026-10-22 21:32 | 分层/模块/数据流/结构问题 | 维护良好 | 无 |
| docs/DATABASE.md | 数据库 | 2026-10-22 20:36 | 10 表/迁移 v21/存档 | 维护良好 | deep 核对：与 schema.ts/migrations.ts 零冲突 |
| docs/DEVELOPMENT_GUIDE.md | 开发指南 | 2026-10-22 21:25 | 环境/命令/Git/安全 | 维护良好 | 无 |
| docs/ACCEPTANCE.md | 验收记录 | 2026-10-22 21:32 | v1.0.0 验收结果 | 维护良好 | 验收结论为已完成快照，前向验收标准缺 |
| docs/PHASE_HISTORY.md | 开发历史 | 2026-10-22 21:32 | F1-F10/P1-P6/R1-R6 | 维护良好 | 纯历史记录，无前向任务 |
| docs/RELEASING.md | 发布指南 | 2026-10-22 21:17 | 签名/构建/Release 流程 | 维护良好 | 发布关键资料，八契约无对应文档 |
| docs/README.md | 文档索引 | 2026-10-22 21:32 | 索引/维护规则 | 维护良好 | 索引对象为旧结构 |
| docs/releases/v1.0.0.md | 发布记录 | 2026-10-22 21:26 | v1.0.0 发布说明 | 有效 | 额外文件 |
| PRIVACY.md / SECURITY.md / CONTRIBUTING.md / THIRD_PARTY_NOTICES.md / LICENSE | 根公开文件 | 2026-10-21/22 | 社区/隐私/许可 | 有效 | 不属八契约，替换时保留；CONTRIBUTING.md:39 引用旧 docs 路径 |

### 1.2 任务系统

| 系统 | 位置/导出 | 状态集合 | 任务数 | 当前任务候选 | 备注 |
|---|---|---|---|---|---|
| GitHub Issues | github.com/Saisa7L/ez-word（API 查询） | open/closed | 0（含已关闭） | 无 | 无外部任务积压，无未决映射 |
| 源码 TODO | `grep TODO/FIXME src/` | — | 0 | 无 | 无 |
| PHASE_HISTORY | docs/PHASE_HISTORY.md | 均为"完成" | 全部历史 | 无 | 已收敛为 ROADMAP M0 里程碑记录 |

### 1.3 分支/提交习惯

- 分支：`main`（唯一本地分支，跟踪 origin/main）
- HEAD：`0dfa3f7 Consolidate project documentation`
- 工作区：干净，无未提交改动
- 提交信息风格：英文祈使句单行（如 `Release v1.0.0`）
- 最近提交：v1.0.0 发布链路 + 文档整合，节奏为小批次直接提交 main

### 1.4 工程/命令

- 入口：`expo-router/entry`（Expo SDK 57 / React Native 0.86.3 / TypeScript ~6.0.3 / SQLite v21）
- 运行：`npx expo start --lan`（Expo Go 真机）
- 测试/检查：`npm run check`（格式/文档/类型/Lint/覆盖率 80%/Doctor）；`npm run check:release`（+导出+性能预算）；测试 9 文件 67 项
- CI：GitHub Actions `ci.yml`（同 check 门禁）+ `release.yml`；另有 `.maestro` 真机链路
- 敏感文件：`android/app/debug.keystore`（存在，未读取）；无 `.env`；正式签名凭据在仓库外（文档声明一致）

## 2. 差距分析

| # | 维度 | 问题 | 证据 | 级别 | 迁移动作 | 用户裁决 |
|---|---|---|---|---|---|---|
| G1 | 任务 | 无前向 ROADMAP——源体系无任何待办任务 | GitHub Issues 空；PHASE_HISTORY 纯历史 | 阻塞 | 新建 ROADMAP：历史→M0 里程碑；当前任务按「重构完善」方向生成 | 已选「重构完善」；任务清单 R2 确认 |
| G2 | 文档 | 文档结构与八契约不对应 | docs/ 目录清单 | 重要 | 按映射重组为八份 | 三批均已确认写入 |
| G3 | 工程 | `scripts/check-docs.mjs` 硬编码旧文档清单，替换后 check/CI 必失败 | scripts/check-docs.mjs:7-17 | 阻塞 | 列为 ROADMAP 当前任务 M1-T1 | R1 确认排当前任务 |
| G4 | 文档 | 根 README/CONTRIBUTING 引用旧 docs 文件名 | README.md:40,64,108,146；CONTRIBUTING.md:39 | 重要 | 新 README 已换链；CONTRIBUTING 修链=M1-T2 | R3 随 R2 确认 |
| G5 | 文档 | 额外文档（RELEASING/PHASE_HISTORY）不属八契约 | docs/ 清单 | 重要 | RELEASING 摘要并入 DEVELOPMENT §12，原件入备份；PHASE_HISTORY 收敛为 ROADMAP 里程碑；不静默删除 | R4 用户选「并入+备份」 |
| G6 | 文档 | screenshots/samples/releases 被引用 | README.md:25-33；check-docs.mjs:99 | 次要 | 替换时保留三目录原位 | 默认 |
| G7 | 冲突 | deep 核对未发现文档-代码冲突（10 表/v21/4 索引/幂等全部一致） | schema.ts + migrations.ts | 信息 | DESIGN 数据章节直接采信 | R5 用户选 deep，已核对 |

### 2.1 缺失

- ROADMAP 对应物（已补：M0 历史 + M1 前向任务）
- AGENTS 项目专属规则（已并入新 AGENTS.md）
- 前向验收框架（已补：ACCEPTANCE §7 + A 场景编号）

### 2.2 冲突/过期

- 无（deep 核对确认）

### 2.3 额外文件

- 根：PRIVACY.md、SECURITY.md、CONTRIBUTING.md、THIRD_PARTY_NOTICES.md、LICENSE → 保留原位
- docs：releases/、samples/、screenshots/ → 保留原位
- docs：RELEASING.md、PHASE_HISTORY.md → 原件入 `.adoption/backup/`，内容分别并入 DEVELOPMENT §12 与 ROADMAP 里程碑记录

## 3. 映射决策

| # | 外部来源 | 外部值 | 本体系值 | 理由 | 来源 ID | 未决 |
|---|---|---|---|---|---|---|
| M1 | PROJECT_CONTEXT + REQUIREMENTS | 概况+需求 | PROJECT.md | 契约职责对应 | DOC:PROJECT_CONTEXT/REQUIREMENTS | 否 |
| M2 | ARCHITECTURE + DATABASE | 架构+数据 | DESIGN.md | 合并为设计文档 | DOC:ARCHITECTURE/DATABASE | 否 |
| M3 | DEVELOPMENT_GUIDE | 开发规则 | DEVELOPMENT.md + AGENTS.md | 通用环境留 DEVELOPMENT；命令/边界/红线上收 AGENTS | DOC:DEVELOPMENT_GUIDE | 否 |
| M4 | ACCEPTANCE | v1.0.0 验收 | ACCEPTANCE.md + 前向框架 | 平移 + 补 A 场景编号 | DOC:ACCEPTANCE | 否 |
| M5 | PHASE_HISTORY | F1-F10/P1-P6/R1-R6 | ROADMAP M0 里程碑记录 | 历史收敛 | DOC:PHASE_HISTORY | 否 |
| M6 | RELEASING | 发布流程 | DEVELOPMENT §12 摘要 + 备份原件 | 发布属开发流程 | DOC:RELEASING | 否（R4 已决） |
| M7 | 根 README | 产品介绍 | 根 README.md | 保留文案，换八契约链接 | DOC:README | 否 |
| M8 | 根 AGENTS + DEVELOPMENT_GUIDE 安全规则 | Expo 守则+红线 | 根 AGENTS.md | 合并为项目专属规则 | DOC:AGENTS | 否 |
| M9 | 无外部任务 | — | adoption 新建任务（ADOPT: 前缀） | 无积压任务 | ADOPT:T1-T4 | 否 |

## 4. 外部状态汇总

| 外部系统 | 状态 | 数量 | 映射 | 未决 |
|---|---|---|---|---|
| GitHub Issues | open/closed | 0 | 无需映射 | 0 |

无法映射：无。

## 5. 文档/代码冲突

无（2026-11-04 deep 核对：10 表字段与 schema.ts 逐项一致；迁移注册表最新 `to: 21`；v18 四索引位于 migrations.ts:419-428；列级幂等 ensureColumn 与文档描述一致）。

## 6. 批次计划与状态

| 批次 | 文档 | 来源 | 状态 | 用户确认 | 写入路径 |
|---|---|---|---|---|---|
| 1 | PROJECT.md / ROADMAP.md | M1/M5 + 代码事实 + 重构方向 | 已写入 | 是（2026-11-04） | .adoption/docs/ |
| 2 | DESIGN.md | M2（deep 核对） | 已写入 | 是（2026-11-04） | .adoption/docs/ |
| 3 | README.md / AGENTS.md / docs/README.md / DEVELOPMENT.md / ACCEPTANCE.md | M3/M4/M6/M7/M8 | 已写入 | 是（2026-11-04） | .adoption/README.md、.adoption/AGENTS.md、.adoption/docs/ |

替换计划：完成门禁达到并经用户确认 adoption-complete 后执行——备份原 docs/ 与根 README/AGENTS 至 `.adoption/backup/<timestamp>/`，展示完整清单二次确认后替换；额外文件按 §2.3 处置。

## 7. 推断清单

| ID | 位置 | 推断内容 | 依据 | 影响 | 建议 | 状态 | 用户校准结果 |
|---|---|---|---|---|---|---|---|
| I1 | ROADMAP M1-T1 | 替换后首个任务=适配 check-docs.mjs，并作为当前任务 | G3；用户选替换 | 接手后第一件事 | 排为当前任务 | 已确认 | R1：排为当前任务 |
| I2 | ROADMAP M1-T3~T6 | 重构任务从 ARCHITECTURE 结构性问题生成（拆页×3/流程下沉/修链） | 用户只选「重构完善」方向 | 任务清单 | 逐条确认 | 已确认 | R2：按推断写入（拆分方案已按页细化） |
| I3 | ROADMAP 验收 | 重构任务验收=功能不变+check 全过+主文件 <300 行 | 既有门禁 | 验收阈值 | 拆分任务统一适用 | 已确认 | 批次 1：I7 采纳 <300 行 |
| I4 | PROJECT 非目标 | 沿用 REQUIREMENTS「暂不实现」 | REQUIREMENTS.md:37-46 | 项目边界 | 保留原清单 | 已确认 | 批次 1：用户确认沿用 |
| I5 | DEVELOPMENT §12 | RELEASING 摘要并入 DEVELOPMENT，原件入备份 | M6 | 发版资料位置 | 采纳并标注备份路径 | 已确认 | R4：并入+备份 |
| I6 | AGENTS | AGENTS = Expo 通用守则 + 项目命令/红线/文档规则 | M8 | 协作规则 | 合并 | 已确认 | 批次 3：I13 采纳 |
| I7 | ROADMAP | 拆分验收行数阈值 <300 行 | 建议 | 验收阈值 | 采纳 | 已确认 | 批次 1 确认 |
| I8 | M1-T6 | 下沉范围执行时核定 | ARCHITECTURE 问题 #2 | 任务范围 | 占位范围写入 | 已确认 | 批次 1 确认 |
| I9 | M1-T3~T5 顺序 | about→profile→word-library（行数降序） | 建议 | 执行顺序 | 采纳 | 已确认 | 批次 1 确认 |
| I10 | DESIGN §8 | 数据章节以 deep 核对结果为准，不标「待重写」 | R5 核对 | 数据权威性 | 采信 | 已确认 | R5：用户选择 deep 并已核对 |
| I11 | DESIGN §9 | 状态机按文档化阶段重画，未逐行核对 taskReducer | ARCHITECTURE 文字 | 图精度 | 执行重构任务时精确化 | 已确认 | 批次 2：按建议采纳 |
| I12 | 根 README | 保留现文案只换文档链接 | 现文案维护良好 | 对外内容 | 采纳 | 已确认 | 批次 3 确认 |
| I13 | AGENTS 结构 | Expo 通用 + 项目规则合并 | 建议 | 协作规则 | 采纳 | 已确认 | 批次 3 确认 |
| I14 | DEVELOPMENT §12 | RELEASING 摘要只留身份/红线/流程入口，细节指向备份 | R4 | 发版可用性 | 采纳 | 已确认 | 批次 3 确认 |
| I15 | ACCEPTANCE §4/§7 | 以 SC1-SC10 生成 A1-A10 回归场景 + M1 验收区 | 建议 | 前向验收框架 | 采纳 | 已确认 | 批次 3 确认 |
| I16 | PROJECT §10 | 验收环境基线沿用一加 Ace 2/Android 16 | ACCEPTANCE v1.0.0 | 设备更换时需更新 | 保留 | 已确认 | 2026-11-04 用户确认沿用真机基线 |

> 范围/权限/安全/验收阈值均已单独成条（I3/I7/I16）。I1-I16 全部已确认，推断已清零（2026-11-04）。

## 8. Oversized 任务

| 来源 | 任务 | 读/改/工期 | 建议拆分 | 用户确认 |
|---|---|---|---|---|
| DOC:ARCHITECTURE（ADOPT:T2） | 设置页拆分重构（原 oversized） | 预计 >8 / >5 / >半日 | 已按页拆为 M1-T3（about）/M1-T4（profile）/M1-T5（word-library） | 是（批次 1 确认） |

## 9. 红队与确认

### 9.1 红队（2–5 条）

| # | 风险 | 为什么具体/可反驳 | 用户回应 |
|---|---|---|---|
| R1 | 替换 docs/ 会立刻破坏 `npm run check`/CI（check-docs.mjs 硬编码旧清单，已验证） | scripts/check-docs.mjs:7-17；反驳选项=保留不替换 | 已回应：排为当前任务 M1-T1 |
| R2 | 重构任务清单是我从 ARCHITECTURE 推断的，用户可能另有关注技术债 | 可直接给清单替换 | 已回应：按推断写入 |
| R3 | 替换后旧 docs 路径存在断链窗口（README/CONTRIBUTING/外链） | 本地替换后迟早要推 | 已回应：随 R2 确认，T2 修链任务列入 |
| R4 | RELEASING.md 发版关键资料从 docs/ 消失仅存备份，未来发版可能找不到 | 可选保留原位 | 已回应：并入 DEVELOPMENT 摘要 + 原件备份（未选保留原位） |
| R5 | standard 深度未核对 DATABASE.md 255 行 vs schema | 可升级 deep | 已回应：升级 deep——已逐表核对，零冲突 |

### 9.2 确认校验

| 阶段/批次 | 日期 | 产出 | 确认校验结论 | 红队回应 | 用户确认 |
|---|---|---|---|---|---|
| A0/A1 盘点 | 2026-11-04 | 源体系盘点 | 三问三答（深度/替换/方向） | — | 是 |
| A2 方案 | 2026-11-04 | 差距/映射/方案 | 差距 7 项分级齐备；映射 9 项；批次 3 批 | R1-R5 逐条回应 | 是 |
| A3 批次 1 | 2026-11-04 | PROJECT+ROADMAP | 推断 I7-I9 校准；任务粒度合规；单当前任务 | 不适用 | 是 |
| A3 批次 2 | 2026-11-04 | DESIGN | deep 核对零冲突；I10-I11 校准 | R5 已执行 | 是 |
| A3 批次 3 | 2026-11-04 | 其余五份 | I12-I15 校准；八份齐全 | 不适用 | 是 |
| A4 清零 | 2026-11-04 | 推断/ROADMAP 检查 | I1-I16 全部已确认；ROADMAP 合规检查通过 | — | 是 |
| A5 完成 | 2026-11-04 | 迁移报告定稿 + 完成宣告 + 替换执行 | 完成门禁达到；替换已执行并校验 | — | 是 |

ROADMAP 合规检查（A4）：
- 六状态：M1-T1~T6 全部 `未开始` ✓（合法枚举）
- 当前任务：仅 M1-T1 `是` ✓
- 来源 ID：全部带 `ADOPT:` 前缀，可追溯 ✓
- oversized：T2 已拆分为 T3/T4/T5，粒度合规（读 ≤3、改 ≤4、半日可验收）✓

## 10. 完成门禁

- PROJECT 草案 + 推断表：达到（I16 待校准，A4 收口）
- ROADMAP 合规 + 当前任务：达到
- 其余六份存在/占位原因：达到（八份全部实写，无占位）
- 红队/确认/批次记录：达到（R1-R5 逐条回应；三批全部确认）

结论：`completed`（2026-11-04）

## 11. 文档替换

| 项 | 内容 |
|---|---|
| 模式 | 替换（A0 初选；替换前清单二次确认） |
| 原 docs 文件数 | 9 份 md + releases/ + samples/ + screenshots/ |
| 将替换（写入 docs/） | PROJECT.md、DESIGN.md、ROADMAP.md、ACCEPTANCE.md、DEVELOPMENT.md、README.md（八契约之六） |
| 将替换（根） | README.md、AGENTS.md |
| 将备份后移出 docs/ | PROJECT_CONTEXT.md、REQUIREMENTS.md、ARCHITECTURE.md、DATABASE.md、DEVELOPMENT_GUIDE.md、PHASE_HISTORY.md、RELEASING.md（7 份旧文档） |
| 将保留原位 | docs/releases/、docs/samples/、docs/screenshots/；根 PRIVACY.md、SECURITY.md、CONTRIBUTING.md、THIRD_PARTY_NOTICES.md、LICENSE、update/、assets/ 等 |
| 备份路径 | .adoption/backup/<timestamp>/ |
| 用户确认 | 是（A0 初选 + 2026-11-04 二次清单确认） |
| 结果 | 已替换（2026-11-04 14:57，备份 .adoption/backup/20261104-1457/，diff 校验备份与原文件一致；替换后文件与暂存稿 diff 一致） |

## 12. 迁移变更记录

| 日期 | 变更请求 | 影响 | 处理 | 确认状态 |
|---|---|---|---|---|
| 2026-11-04 | 初始迁移 | — | A0-A4 完成，A5 待 I16 清零 | 进行中 |
| 2026-11-04 | 完成宣告 + 替换执行 | 8 份新文档落位 docs/ 与根；旧 7 份入备份；docs:check 预期失败基线已记录（11 项，M1-T1 修复） | 替换已执行并双重校验 | 已确认 |

## 13. Skill 问题与改进

| # | 问题 | 影响 | 建议 |
|---|---|---|---|
| S1 | 项目自建文档门禁（docs:check）与新文档结构强耦合，adoption 流程无「门禁脚本适配」检查维度 | 替换类迁移普遍破坏此类检查 | 建议在 A2 检查维度加「项目自建文档门禁」（本次已人工捕获并列为 M1-T1） |

## 14. 交接块

```text
docsRoot：docs/（替换后）；暂存 .adoption/docs/
根文件暂存：.adoption/README.md / .adoption/AGENTS.md
迁移报告：.adoption/MIGRATION_REPORT.md
项目 HEAD：0dfa3f7（main，工作区干净）
源任务系统/映射：GitHub Issues 空（0 任务，无未决映射）；新建任务来源 ADOPT:T1-T4
推断：I1-I16 已全部清零
占位：无（八份全部实写）
替换：已替换（2026-11-04，备份 .adoption/backup/20261104-1457/）
兼容性：正常；注意替换后 docs:check 需 M1-T1 适配
建议下一步：M1-T1 适配 check-docs.mjs（当前任务，docs:check 当前 11 项失败即其修复对象）；随后 M1-T2 修链；再按 M1-T3~T6 重构
```
