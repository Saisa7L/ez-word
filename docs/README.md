# 文档索引

最后更新：2026-10-22 18:10

## 主文档

| 文档 | 内容 |
|---|---|
| `PROJECT_CONTEXT.md` | 产品定位、技术栈、当前阶段、风险和安全红线 |
| `REQUIREMENTS.md` | 第一版范围、功能规则和 CSV 导入格式 |
| `UI_MAP.md` | 页面、路由、导航和已确认 UI 行为 |
| `ARCHITECTURE.md` | 分层职责、模块边界、目录和依赖方向 |
| `MODULE_REFERENCE.md` | 模块、仓库、服务、Hook 和组件的接口与副作用 |
| `DATA_FLOW.md` | 启动、任务、导入、主题、资料和存档数据流 |
| `DATABASE.md` | SQLite 表、迁移、仓库映射和存档关系 |
| `QUALITY_AND_TECH_DEBT.md` | 质量门槛、测试缺口、内聚耦合评估和技术债优先级 |
| `PERFORMANCE_BUDGET.md` | 自动性能预算、当前基线和真机采集项 |
| `RELEASING.md` | Android 版本规则、签名、本地构建和 GitHub Release 流程 |
| `OPEN_SOURCE_RELEASE_PLAN.md` | 最终开源目标、发布完成标准、R1-R6 执行批次 |
| `ASSETS.md` | 资源目录、命名、格式和新增资源流程 |
| `THEME_GUIDE.md` | 主题模式、颜色令牌和页面应用规则 |
| `DEVELOPMENT_GUIDE.md` | 环境、启动、检查、Git、调试和协作流程 |
| `PHASE_HISTORY.md` | F1-F10、P1-P6 的阶段结果和关键提交 |
| `CURRENT_HANDOFF.md` | 当前状态、下一步和新窗口接续提示 |
| `P6_PROGRESS.md` | 当前 P6 整理进度 |

## 仓库协作文件

| 文档 | 内容 |
|---|---|
| `README.md` | 公开功能介绍、截图、安装、权限、数据位置和开发入口 |
| `CONTRIBUTING.md` | 开发环境、修改原则、检查和 Pull Request 要求 |
| `SECURITY.md` | 安全漏洞报告范围、方式和响应原则 |
| `PRIVACY.md` | 本地数据、DeepSeek 请求、权限和数据删除说明 |
| `THIRD_PARTY_NOTICES.md` | 直接运行时和构建期依赖许可证 |

## 模板与决策

| 文档 | 内容 |
|---|---|
| `templates/HANDOFF_TEMPLATE.md` | 新交接文档模板 |
| `templates/ADR_TEMPLATE.md` | 架构决策记录模板 |
| `templates/RELEASE_NOTES_TEMPLATE.md` | GitHub Release 发布说明模板 |
| `adr/README.md` | ADR 规则和索引 |
| `adr/0001-android-only.md` | Android-only 平台决策 |
| `adr/0002-unified-navigation-lock.md` | 统一导航锁决策 |
| `adr/0003-normalized-data-model.md` | v19-v21 规范化数据模型决策 |
| `adr/0004-open-source-android-release.md` | GitHub 开源 Android 发布目标 |

## 资源和证据

| 目录 | 内容 |
|---|---|
| `samples/` | CSV 测试数据 |
| `evidence/f3/` | F3 真机问题截图 |
| `../tests/` | schema、迁移和存档数据层测试 |

## 发布记录

| 文档 | 内容 |
|---|---|
| `releases/v0.1.0.md` | 首个 Android 开源测试版的功能、安装、隐私和校验信息 |

## 维护规则

1. 新信息优先补充到对应主文档，不新增重复的阶段状态页。
2. 阶段结束后只更新 `PHASE_HISTORY.md` 和 `CURRENT_HANDOFF.md`。
3. 所有文档的“最后更新”必须精确到分钟。
4. 删除或移动文档后，同步检查本索引和跨文档引用。
5. 修改文档或脚本命令后运行 `npm run docs:check`。
6. 跨模块、数据兼容或平台边界变化必须新增 ADR。
