# 开发路线图

最后更新：2026-11-04 17:25
状态：已确认（2026-11-04）
确认记录：已确认（2026-11-04，adoption 批次 1 + 完成宣告）

## 1. 当前里程碑

| 项目 | 内容 |
|---|---|
| 里程碑 | M1：文档迁移收尾与结构重构 |
| 目标 | 替换文档后质量门禁恢复全绿；超限设置页文件拆分到位；仓库内无死链 |
| 开始/目标日期 | 2026-11-04 / M1 全任务完成 |
| 完成标准 | 所有任务完成 + 拆分文件 <300 行且功能不变 + `npm run docs:check` 全过 + 真机验收批次 A 通过；全量 `npm run check` 由 M2 覆盖率治理解锁 |

> 队列中：M2 覆盖率门禁治理（M2-T1 方案研究）。2026-11-04 用户确认：M1 期间不硬修覆盖率，B-02 单列阶段研究方案；M1 各任务以自己的门禁（docs/format/type/lint/目标测试）为准。
> 2026-11-04 17:22 用户确认：真机验收改为批次统一执行（见 §7 真机验收批次），任务自检通过即提交并停 `待验收`，不阻塞后续拆分。

## 2. 任务

| ID | 里程碑 | 任务 | 优先级 | 状态 | 当前任务 | 依赖 | 验收标准 | 验证方式 |
|---|---|---|---|---|---|---|---|---|
| M1-T1 | M1 | 适配 `check-docs.mjs` 到八文档结构（含 docs/README.md 索引校验） [ADOPT:T1] | P0 | 已完成 | 否 | 文档替换完成 | `npm run docs:check` 全过，新清单校验生效；全量 check 由 M2 解锁 | docs:check + CI |
| M1-T2 | M1 | 修链：核查保留文件（CONTRIBUTING 等）对旧 docs 路径的引用并修复 [ADOPT:T4] | P1 | 已完成 | 否 | M1-T1 | 仓库内无指向不存在 docs 文件的链接 | 全仓 grep + docs:check |
| M1-T3 | M1 | 拆分 `src/app/settings/about.tsx`（517 行）：表单/校验/布局分离 [ADOPT:T2a] | P1 | 待验收 | 否 | M1-T1 | 功能不变；静态门禁全过；主文件 <300 行；真机项并入批次 A | check + 批次 A |
| M1-T4 | M1 | 拆分 `src/app/settings/profile.tsx`（478 行） [ADOPT:T2b] | P1 | 进行中 | 是 | M1-T3 | 同 M1-T3（真机项并入批次 A） | 同 M1-T3 |
| M1-T5 | M1 | 拆分 `src/app/settings/word-library.tsx`（440 行） [ADOPT:T2c] | P1 | 未开始 | 否 | M1-T4 | 同 M1-T3 | 同 M1-T3 |
| M1-T6 | M1 | 复杂页面流程下沉 features/hooks（页面直调仓库的复杂流程，范围执行时核定） [ADOPT:T3] | P2 | 未开始 | 否 | M1-T5 | 按页面逐个迁移；check 全过；依赖方向符合 DESIGN 约束 | check + lint |
| M2-T1 | M2 | 覆盖率门禁治理：测算差距、定位低覆盖模块、输出「补测试 vs 调整阈值」方案与排期（只出方案，不改阈值、不写实现） | P1 | 未开始 | 否 | M1-T2 | 产出方案（差距清单/优先级/工作量/风险/替代阈值影响），用户选定后再拆实现任务 | 覆盖率报告 + 方案评审 |

状态图例（精确枚举，不能写变体）：`未开始 / 进行中 / 待验收 / 已完成 / 已阻塞 / 已取消`

`当前任务`：同一时间至多一个任务写 `是`，其他写 `否`；development 按此解析，多 `是` 或非法状态会停止询问。

任务粒度：单个任务读完不超过 8 个文件、改动不超过 5 个文件、半日内可验收；超出必须拆分。

优先级：`P0` 必须完成；`P1` 应该完成；`P2` 有余力再做。

## 3. 任务详情

### M1-T1：适配 check-docs.mjs 到八文档结构

- 背景/目的：文档替换为八契约后，`scripts/check-docs.mjs` 的 `REQUIRED_DOCS`（旧九文档清单）必然失败，`npm run check`/CI 全红。adoption 迁移已验证（scripts/check-docs.mjs:7-17）。
- 范围（做什么）：改 `REQUIRED_DOCS` 为新八文档清单；核对索引校验、`npm run` 脚本引用校验、md 路径校验、样例校验逻辑对新结构成立；保留「最后更新精确到分钟」规则。
- 非目标（不做什么）：不改 check 之外的门禁逻辑；不调整测试和性能预算。
- 涉及模块/文件：`scripts/check-docs.mjs`（读 1-2 个参照文档）。
- 验收标准：`npm run docs:check` 全过；删除一个必需文档时 check 能报错；全量 `npm run check` 由 M2 解锁（2026-11-04 用户确认）。
- 验证方式：`npm run docs:check`；CI 绿。
- 风险/回滚：低；git revert 单文件即可。
- 文档更新：`DEVELOPMENT.md` 门禁说明同步。
- 自检记录（2026-11-04 16:39）：`scripts/check-docs.mjs` 的必需清单切为八文档结构（docs 六份 + 根 `README.md`/`AGENTS.md`），索引校验同时覆盖两份根文档；`npm run docs:check` 通过（6 docs，7 root files）；临时移走 `docs/DESIGN.md` 后退出码 1 并报"缺少必需文档"，恢复后重新通过。附带修掉 3 处把退役文档名写成反引号造成的假链接（`docs/README.md`、`docs/ROADMAP.md`、`docs/DEVELOPMENT.md`）。
- 全量门禁现状（2026-11-04 16:41，`npm run check`）：格式/文档/类型/Lint 全过；`test:coverage` 因两项**历史遗留**失败中断（见 §7 B-02 / 已修 B-01），与本任务改动无关（本任务未改 `src/`、`tests/`、`update/`）。
- 验收结论（2026-11-04）：用户确认 T1 自身门禁通过；全量 check 的红由 M2 覆盖率治理跟进。提交 9a8e8bd（文档替换）+ c340d4c（脚本适配）。

### M1-T2：修链（保留文件旧 docs 引用）

- 背景/目的：文档替换后，保留原位的根文件（CONTRIBUTING.md 等）与备份引用对象仍指向旧 docs 文件名，形成死链；推送到 GitHub 后外链也会 404。
- 范围（做什么）：全仓 grep 旧文档名（PROJECT_CONTEXT/REQUIREMENTS/ARCHITECTURE/DATABASE/DEVELOPMENT_GUIDE/PHASE_HISTORY），修复保留文件中的引用；确认新 README 链接全部有效。
- 非目标：不改代码逻辑。
- 涉及模块/文件：CONTRIBUTING.md 及其他命中的保留文件（预计 ≤3 个）。
- 验收标准：仓库内无死链；docs:check 路径校验通过。
- 验证方式：`grep -r` + `npm run docs:check`。
- 风险/回滚：低。
- 文档更新：`docs/README.md` 增「旧文档名仅为溯源、非链接」约定；`DEVELOPMENT.md` 门禁说明补根文档链接校验。
- 自检记录（2026-11-04 17:00）：全仓 grep 旧文档名（排除 `node_modules`/`dist`/`.expo`/`.adoption` 备份）后，真实死链只有 `CONTRIBUTING.md:39` 两条（指向已删的 ARCHITECTURE、DATABASE 文档），已改指 `docs/DESIGN.md` + `AGENTS.md` + `docs/DEVELOPMENT.md`。其余命中（`PROJECT.md`/`DESIGN.md` 的「来源/证据」列、`ROADMAP.md` 任务描述）为迁移溯源标注，已在 `docs/README.md` §7 说明为"迁移前文档名、非链接"。
- 防回归：`scripts/check-docs.mjs` 新增根文档本地链接校验（6 份根文档），并做反向验证——把指向已删架构文档的链接塞回 `CONTRIBUTING.md` 时退出码 1 并报「CONTRIBUTING.md 的本地链接失效」；恢复后重新通过。
- 验收结论（2026-11-04）：用户验收通过。提交 09b8697。

### M1-T3：拆分 about.tsx（517 行）

- 背景/目的：ARCHITECTURE「当前结构性问题 #1」——设置页同时承担表单、校验、数据库调用和复杂布局。`src/app/settings/about.tsx` 全仓页面文件第 1 大（517 行）。
- 范围（做什么）：按既有模式（如 features/settings 表单块、通用 UI 组件）把检查更新、版本信息等区块抽离；页面保留路由与布局。
- 非目标：不改变任何功能与视觉；不顺手改其他文件。
- 涉及模块/文件：`src/app/settings/about.tsx` + 新增 1-2 个区块文件（改 2-4 个文件）。
- 验收标准：功能不变（真机冒烟：关于页打开、检查更新可用）；`npm run check` 全过；主文件 <300 行。
- 验证方式：check + 真机冒烟。
- 风险/回滚：中低；拆分区块保持纯展示/纯逻辑分离，回滚 git revert。
- 文档更新：`DESIGN.md` 模块清单同步。
- 自检记录（2026-11-04 17:14）：517 → 245 行，新增 3 个文件——`features/settings/AboutInfoRow.tsx`（115，纯展示行）、`features/settings/AboutUpdateDialog.tsx`（81，状态→文案/按钮映射）、`features/updates/useAppUpdate.ts`（127，检查/下载/取消/卸载清理）。保持不变的行为：`ActionOptionModal` 先 onClose 再执行 option、下载 controller 互斥与卸载 abort、`lastProgress` 进度去重、Expo Go（StoreClient）只提示不安装。中途踩坑：把 `APP_VERSION` 上移进 `constants/appInfo.ts` 会让 `utils/logger → appInfo` 用例链路引入 `expo-constants`，Node 测试环境 MODULE_NOT_FOUND，已改为页面把 `currentVersion` 传入 hook。
- 检查结果：`typecheck`/`lint`/`format:check` 全过；`npm run test` 67/67 全过；`docs:check` 绿。`npm run check` 仍红在覆盖率（B-02/M2-T1）。
- 替代验证（2026-11-04 17:24，因用户远程无法真机操作）：① 样式等价审计——拆分前后 `StyleSheet.create` 共 20 个键，逐键比对键名/定义体/引用，丢失 0、冲突 0、内容变化 0；② `npx expo export --platform android` 退出码 0，产出 5.7MB hbc bundle，模块解析与导入链路可用。两项覆盖"样式走形"与"加载失败"，**不覆盖**交互时序与视觉观感，已并入真机验收批次 A。

### M1-T4：拆分 profile.tsx（478 行）

- 同 M1-T3 模式；文件 `src/app/settings/profile.tsx`；个人资料表单/预览/外观弹窗区块抽离。

### M1-T5：拆分 word-library.tsx（440 行）

- 同 M1-T3 模式；文件 `src/app/settings/word-library.tsx`；词库列表/搜索/操作区块抽离。

### M1-T6：复杂页面流程下沉

- 背景/目的：ARCHITECTURE「当前结构性问题 #2」——页面可直接调用仓库，复杂流程应进 `features` 或自定义 Hook。
- 范围（做什么）：执行时核定具体页面清单（候选：存档页、错题添加页等多步流程），按 `usePaginatedSelection` 既有模式逐页下沉。
- 非目标：简单读取可保留直调（ARCHITECTURE 明示）。
- 涉及模块/文件：执行时核定；单任务遵守粒度限制，超出再拆子任务。
- 验收标准：每迁一页功能不变、check 全过；依赖方向符合 DESIGN「禁止新增」清单。
- 验证方式：check + lint + 真机冒烟。
- 风险/回滚：中；逐页小步提交。
- 文档更新：`DESIGN.md` 模块清单同步。

## 4. 已完成

| ID | 任务 | 完成日期 | 提交 | 验收结果 |
|---|---|---|---|---|
| M1-T1 | 适配 `check-docs.mjs` 到八文档结构 | 2026-11-04 | c340d4c（文档替换 9a8e8bd） | 通过：`docs:check` 绿、删文档能报错、format/type/lint 绿 |
| M1-T2 | 修链（保留文件旧 docs 引用） | 2026-11-04 | 09b8697 | 通过：死链 0（根文档 22 条链接全解析）；docs:check 增根文档链接校验并经反向验证 |
| B-01 | 修 `updateManifest` 清单版本断言 | 2026-11-04 | 61a26e5 | 通过：`test:coverage` 67/67 全过 |
| （M0 历史任务明细不迁移，见 §5 里程碑记录） | | | | |

## 5. 里程碑记录

> 替代迁移前的 PHASE_HISTORY 文档：只记里程碑级别，不复制任务详情。

| 里程碑 | 日期 | 目标 | 结果 | 关键改动 | 提交 | 遗留 |
|---|---|---|---|---|---|---|
| M0-基础功能 | 2026-10 | 三 Tab/首页/我的/错题本、CSV 导入、每日任务、TTS、学习记录、软清空重导、错题本、首页统计、AI 例句、全局反馈 | 完成 | F1-F10 阶段（PHASE_HISTORY） | 见 git log | 无 |
| M0-产品完善 | 2026-10 | 存档、个人资料、关于页、主题、架构文档 | 完成 | P1-P6 阶段 | 见 git log | 无 |
| M0-开源与发布 | 2026-10-22 | 开源发布 v0.1.0 → v1.0.0 | 完成 | R1-R6 阶段；签名/CI/Maestro/更新安装 | a39199e | 传递依赖审计项 |
| M0-v1.0.0 | 2026-10-22 | 正式版发布验收 | 完成 | 67 测试全过、真机验收通过、APK 上架 Release | a39199e / 97ebe2f / 14c8f08 | 无 |

> M0 详细历史见 `.adoption/backup/` 中迁移前的 PHASE_HISTORY 文档（替换后）。

## 6. Backlog

| 任务 | 价值 | 依赖/前提 | 排期 |
|---|---|---|---|
| B-02 覆盖率门禁治理（当前行 72.72% / 分支 79.27% / 函数 73.43% < 80%） | 恢复 `test:coverage` 门禁；低覆盖集中在 `wordsRepository`、`userProfileRepository`、`wrongBookRepository`、`deepSeekService` | 已立项为 M2-T1（只出方案，不硬修） | M1-T2 之后 |
| 传递依赖审计项治理 | 消除 audit 噪音 | 不降级 Expo 的前提 | 待评估 |
| 新功能需求 | 待用户提出 | M1 完成 | 待定 |

## 7. 风险与阻塞

| 风险/阻塞 | 影响任务 | 处理方式 | 负责人 |
|---|---|---|---|
| B-02：覆盖率实测 72.72%/79.27%/73.43% 未达 80% 阈值 → `npm run check` 在 `test:coverage` 中断 | M1 全部任务的「全量 check」验收 | 已关闭在 M1 内的硬修；立项 M2-T1 出方案（含补测试 vs 调阈值的对比），2026-11-04 用户确认 | 用户+工程师 |
| 推送时机不当造成外链 404 | M1-T2 | T2 修链后统一推送 | 用户 |
| `docs/ACCEPTANCE.md`「67 项全过 + ≥80%」为 v1.0.0 发版时记录，与当前实测（67/67、72.72%）不一致 | 验收基线可信度 | M2-T1 出结论后同步 `ACCEPTANCE.md`，避免二次改 | 用户+工程师 |
| 真机验收延后到批次统一执行：3 个拆分任务叠加后若某处走形，排查面变大 | M1-T3/T4/T5 | ① 每个任务保持独立提交，必要时按提交二分；② 每任务额外跑样式等价审计 + `expo export` 打包，把"样式走形""加载失败"挡在提交前；③ 批次 A 触发后失败项回 `进行中` 并单独立项 | 用户+工程师 |

### 真机验收批次（2026-11-04 17:22 用户决定）

用户远程办公、不在电脑旁，无法即时真机操作 → 真机项从"每任务即时验收"改为**累积批量执行**：任务完成只做静态自检并提交，状态停在 `待验收`，真机项并入批次表；批次跑完再一次性回填 `已完成`。

| 批次 | 覆盖任务 | 待验项 | 触发时机 |
|---|---|---|---|
| A | M1-T3 | ① 我的 → 关于：页面正常打开，软件版本显示 `1.0.0 (Build N)`；② 点「检查更新」在已是最新版时提示「已是最新版本」；③ 断网后点「检查更新」提示「检查更新失败」 | M1-T5 完成后（用户回到电脑前） |
| A | M1-T4 | 个人资料页打开、表单编辑保存、外观弹窗生效 | 同上 |
| A | M1-T5 | 词库页打开、搜索、导入/清空操作正常 | 同上 |

- 批次执行前先启动 Expo 开发服务器：`REACT_NATIVE_PACKAGER_HOSTNAME=<WLAN_IP> npx expo start --host lan`（本机有虚拟网卡会抢占 LAN IP，必须固定广播地址）。
- 批次内任一项失败：定位到所属任务的提交 → 该任务回 `进行中`，其余已通过项不回退。

## 8. 更新规则

1. 开始任务：状态改 `进行中`，`当前任务=是`；同一时间只保留一个 `是`。
2. 自检完成：状态改 `待验收`，附检查命令和结果；`当前任务` 可保留。
3. 用户验收通过：状态改 `已完成`，填提交号；未通过改回 `进行中` 并记录原因。
4. 阻塞：状态改 `已阻塞`，写清阻塞条件和解除条件。
5. 取消：状态改 `已取消`，写原因。
6. 新任务先加到 Backlog；进入当前里程碑前补验收标准。
7. 每个里程碑结束，追加"里程碑记录"，并同步 `PROJECT.md` 当前状态。
8. 不把任务状态写进 `PROJECT.md` 以外的重复文档。
9. 状态列只能使用六个枚举值；解析失败时停止询问，不自行猜测。
