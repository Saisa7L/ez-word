# F9 当前状态

最后更新：2026-10-18

功能提交：`45d0fa0 Complete F9 offline AI example workflow`

## 结论

F9 已完成并通过真机验收。

## 数据变化

数据库升级到 v8，`words` 新增：

- `example_sentence`
- `example_source`
- `example_generated_at`

`app_settings` 新增：

- `ai_overwrite_examples`

## CSV 例句

- 新增可选 `example` 列
- 兼容 `sentence`、`例句` 列名
- 旧版三列 CSV 继续有效
- 新例句非空时覆盖已有例句并标记来源为 CSV
- 新例句为空时保留已有例句

测试文件：

```text
F:\English vocabulary app\Project\vocab-app\docs\samples\f9-ai-examples-test.csv
```

## AI 例句

- DeepSeek API Key 使用 `expo-secure-store` 保存
- API Key 不进入 SQLite、源码、文档或 Git
- AI 设置支持保存、测试和清除 Key
- 支持选择是否覆盖已有例句
- 支持批量生成、进度、成功和失败统计
- AI 只生成英文例句，不生成翻译
- AI 单词问答功能已确认取消

## 离线策略

- 学习任务运行时不会请求 DeepSeek
- 填空例句优先级：
  1. CSV 或 AI 保存的 SQLite 例句
  2. 本地模板
- 断网后每日任务、错题回顾和单词再练仍可运行

## 验证结果

- TypeScript：通过
- ESLint：通过
- Android bundle 导出：通过
- CSV 可选例句列：验证通过
- 数据库 v8 迁移：验证通过
- F9 真机验收：通过

## 后续

下一阶段为 F10：视觉校正以及加载、失败和空数据状态。
