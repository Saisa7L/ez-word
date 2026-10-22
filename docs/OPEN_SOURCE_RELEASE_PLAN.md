# 开源发布计划

最后更新：2026-10-22 19:37

## 最终目标

把易词通（Ez Word）发布为一个面向国内 Android 用户的开源项目：

- 源代码发布到 GitHub。
- 用户可通过 GitHub Releases 获取可安装的签名 APK。
- 代码保持可维护、可扩展，并允许外部贡献者理解和参与。
- 第一阶段只正式支持 Android。
- 多语言、多平台和更多功能在稳定版发布后逐步评估。

## 当前判断

架构重构主体和 R1 本地开源基础已经完成。当前软件可作为个人工具、内测版本或小范围 sideload 使用，但还不是可直接公开上架的成熟发布版本。

主要缺口不在业务功能，而在：

- GitHub 远程仓库和社区协作文件。
- 正式包名、版本策略、签名和 Release 流程。
- 真实 APK 的安装、覆盖升级和备份恢复验收。
- Maestro/端到端测试。
- 真机性能采集。
- 依赖安全、Android 备份和隐私边界。
- 公开 README、截图、贡献指南和发布说明。

## 发布形态

第一阶段采用“源码 + GitHub Releases APK”：

- 源码仓库：公开 GitHub 仓库。
- 发布包：签名 Android APK。
- 主要分发渠道：GitHub Releases。
- 暂不依赖 Google Play 或国内应用商店。
- 不提供 Web/iOS 版本。
- 不要求登录、自建服务器或多设备同步。

## 完成定义

### 代码与质量

| 条件 | 当前状态 |
|---|---|
| TypeScript 严格模式 | 已具备 |
| 数据迁移和旧存档兼容 | 已具备 |
| 单元/数据/状态测试 | 已具备 |
| 格式、Lint、覆盖率、Doctor、导出和性能预算 | 已具备 |
| GitHub Actions 实际运行 | 缺少远程仓库 |
| 组件测试 | 缺失 |
| Maestro/E2E 主流程 | 部分具备，Android 真机 smoke 已通过 |
| 真机性能数据 | 缺失 |
| 传递依赖告警处理结论 | 部分具备，30 项仍待评估 |

### 开源协作

| 条件 | 当前状态 |
|---|---|
| LICENSE | 已确认 MIT，版权人为 `Saisa` |
| README 功能介绍、截图、安装和使用说明 | 本地已完成，包含 6 张真实 Android 截图 |
| CONTRIBUTING | 已新增 |
| SECURITY | 已新增，Private Vulnerability Reporting 已启用 |
| 隐私与数据说明 | 已新增 |
| Issue/PR 模板 | 已新增 Issue Forms、PR 模板和 Release 分类 |
| Release notes 和版本策略 | Release notes 模板已新增；版本和 versionCode 规则已写入 `docs/RELEASING.md` |
| ADR 和交接文档 | 已具备 |

### Android 发布

| 条件 | 当前状态 |
|---|---|
| `android.package` | 已配置 `com.saisa7.ezword` |
| 版本号和 versionCode 策略 | 已配置 `0.1.0` / `2` 并写入 `docs/RELEASING.md` |
| 正式签名 | 本地签名 APK 已生成并通过 `apksigner` 校验 |
| 签名密钥离线备份 | 用户已确认完成 |
| GitHub Release APK | 已发布 `v0.1.0`，GitHub Actions 签名构建成功 |
| APK 校验值 | Release APK 与 SHA-256 文件已独立核验 |
| 覆盖安装与数据库升级 | 已通过 versionCode 1 → 2 真机测试，数据保留 |
| 最低/目标 Android 版本说明 | minSdk 24，targetSdk 36 |

### 产品运行

| 条件 | 当前状态 |
|---|---|
| 核心学习闭环 | 已具备并通过多轮真机验收 |
| 本地存档导入导出 | 已具备 |
| AI Key 安全存储 | 已具备 |
| 存档数据与 API Key 分离 | 已具备 |
| Android 备份策略 | 待确认 |
| 数据库明文和图片数据风险说明 | 待补 |
| 7 天个人实跑 | 待执行 |
| 1–2 名外部闭测用户 | 待执行 |

## 执行批次

### R1：GitHub 开源基础

- [x] 确定仓库地址为 `https://github.com/Saisa7L/ez-word`。
- [x] 完善 README：功能、截图、下载、安装、权限、数据位置、构建和测试。
- [x] 增加 CONTRIBUTING、SECURITY、隐私说明、Issue/PR 模板和发布说明模板。
- [x] 确认 MIT LICENSE 和第三方依赖声明。
- [x] 配置远程仓库并让 GitHub Actions 实际运行。
- [x] 启用 Private Vulnerability Reporting 和仓库基础设置。

### R2：Android 发布工程

- [x] 确定最终包名，配置 `android.package`。
- [x] 定义语义化版本和 versionCode 规则。
- [x] 建立签名流程，签名密钥只保存在安全位置，不进入仓库。
- [x] 增加 GitHub Release workflow 和 APK 校验值。
- [x] 安装正式 APK，验证覆盖升级不会丢失数据库。
- [x] 配置 Actions Secrets。
- [x] 发布 `v0.1.0` GitHub Release。

### R3：端到端与发布回归

- [x] 接入 Maestro 真机链路并跑通 smoke。
- [x] 每日任务主流程已完成用户手动验收，并保留任务启动/退出 smoke。
- 覆盖任务主流程、返回、错题、词库、存档、AI 设置和设置保存。
- 完成 Android 多机型/多分辨率矩阵中的最低可用集。
- 验证日间、夜间、自定义主题、大字号、TalkBack 和减少动画。

### R4：性能与安全硬化

- 使用 Perfetto 采集冷启动、首页、输入、滚动和导入耗时。
- 评估 30 个依赖告警的实际风险和可升级路径。
- 明确 Android 备份策略。
- 明确数据库明文、头像/背景和存档文件的隐私边界。
- 确认没有 API Key、签名或用户资料进入 Git 或公开日志。

### R5：公开测试版

- [x] 发布 `v0.1.0` 测试版 APK。
- [ ] 完成至少 7 天个人实跑。
- [ ] 邀请 1–2 名国内 Android 用户闭测。
- [ ] 收集安装、升级、数据恢复和核心流程问题。
- [ ] 修复阻塞问题后发布 `v0.2.0` 或稳定候选版。

### R6：稳定版与后续扩展

- 关闭稳定版阻塞问题。
- 发布 `v1.0.0`。
- 之后再评估 i18n、更多功能和跨平台适配。

## 当前发布状态与下一阶段

R1 和 R2 已完成，`v0.1.0` Release 已发布并通过 APK、SHA-256 和签名校验。下一阶段：

- 执行 R3 的 Maestro、端到端和多机型回归。
- 执行 R4 的 Perfetto、依赖风险、Android 备份和隐私边界硬化。
- 继续 R5 的 7 天实跑与 1–2 名外部 Android 用户闭测。

## 后续扩展原则

- i18n：稳定 Android 版本后先抽取文案、日期和数字格式，不立即支持 RTL。
- 更多功能：优先扩展 `application`、`domain` 和独立 `features`，不把业务塞回页面。
- 更多平台：必须为 SQLite、文件、相册、TTS、截图和安全存储提供适配层，不能把“能启动”视为“支持”。
- 数据库和存档变化：先补旧版本兼容测试，再提升数据库版本。
