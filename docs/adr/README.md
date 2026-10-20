# 架构决策记录

最后更新：2026-10-20 22:24

ADR 用于记录会影响多个模块、数据兼容或长期维护的决策。

## 规则

- 文件名使用 `NNNN-短标题.md`。
- 已接受的决策不直接改写历史结论；变更时新增 ADR 并标记旧 ADR 为“已替代”。
- 每条 ADR 必须包含状态、日期、背景、决策、后果和替代方案。
- 模板见 `docs/templates/ADR_TEMPLATE.md`。

## 索引

| ADR | 状态 | 决策 |
|---|---|---|
| `0001-android-only.md` | 已接受 | 项目只正式支持 Android |
| `0002-unified-navigation-lock.md` | 已接受 | 所有导航动作经过统一锁入口 |
| `0003-normalized-data-model.md` | 已接受 | 设置、错题来源和学习状态使用 v19-v21 规范化模型 |
| `0004-open-source-android-release.md` | 已接受 | GitHub 开源、国内 Android、Releases APK 的发布目标 |

## 何时新增 ADR

- 数据库版本或存档格式发生不兼容变化。
- 引入跨模块基础设施，如导航协调、日志、性能预算。
- 明确放弃某个平台或核心能力。
- 选择会在未来限制实现的架构边界。
