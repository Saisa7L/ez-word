# 文档索引

最后更新：2026-10-22 21:32

## 核心文档

| 文档 | 内容 |
|---|---|
| `PROJECT_CONTEXT.md` | 产品定位、最终版本、技术栈、风险和项目状态 |
| `REQUIREMENTS.md` | 功能范围、业务规则和 CSV 格式 |
| `ARCHITECTURE.md` | 页面结构、代码分层、模块职责、核心数据流和导航约束 |
| `DATABASE.md` | SQLite 表、迁移、存档结构和数据不变量 |
| `DEVELOPMENT_GUIDE.md` | 开发环境、启动、检查、Git、性能和安全规则 |
| `ACCEPTANCE.md` | v1.0.0 验收范围、自动测试和真机验收结果 |
| `PHASE_HISTORY.md` | 从基础 UI 到 v1.0.0 发布的关键开发过程 |
| `RELEASING.md` | 版本、签名、构建、GitHub Release 和更新清单流程 |

## 发布记录

| 文档 | 内容 |
|---|---|
| `releases/v1.0.0.md` | 正式版本功能、APK 校验值和安装说明 |

## 资源

- `screenshots/`：README 使用的真实 Android 截图。
- `samples/`：开发阶段使用的 CSV 样例。
- `../tests/`：数据库、迁移、导航、任务和更新测试。

## 维护规则

1. 功能和数据结构变化优先更新对应主文档，不新增重复的阶段状态页。
2. 发布新版本时更新 `RELEASING.md`、`PHASE_HISTORY.md` 和 Release 说明。
3. 所有文档的“最后更新”必须精确到分钟。
4. 文档移动或删除后运行 `npm run docs:check`。
5. 不把 API Key、签名密码、用户存档或私密日志写入文档。
