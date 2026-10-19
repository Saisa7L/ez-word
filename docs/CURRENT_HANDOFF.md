# 当前交接

最后更新：2026-10-19 18:12

## 当前状态

- 分支：`main`
- 当前阶段：P6 代码与文档整理
- P5：已按当前实现收口，不再返工视觉问题
- P6：已完成架构、数据流、数据库文档和两批代码去重
- 当前工作：已完成文档合并、资源重组、列表状态复用，以及个人资料、通用设置和 AI 设置拆分
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
- 每次只整理一个明确边界。
- 改完运行 `npm run typecheck`、`npm run lint` 和 Android 离线导出。
- 稳定后按批次提交 Git。

## P6 剩余重点

1. 拆分导入页中的文件、导入、清空和说明区块。
2. 整理剩余展示辅助函数和重复样式。
3. 评估存档表结构与数据库 schema 的共享方式。
4. 完成文档和资源引用的最终一致性检查。

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

当前处于 P6 代码与文档整理阶段。不要重新设计 P5 主题 UI，
不要进入 EAS、APK、签名和发布流程，不要回滚用户已有修改。

请先说明当前状态、P6 剩余任务和下一步最小改动。
```
