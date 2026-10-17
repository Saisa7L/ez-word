# F4 当前状态

最后更新：2026-10-17

功能提交：`a30addc Add F4 daily task settings and data foundation`

## 结论

F4 已完成并通过真机验收。

## 已完成内容

- 数据库升级到 v2
- 单词启用状态 `is_active`
- 每日任务设置表 `app_settings`
- 单词学习记录表 `word_learning_state`
- 错题记录表 `wrong_book_words`
- 每日完成任务表 `study_sessions`
- A02“修改每日任务”入口
- 每日新学单词数量设置
- 听力默认速度设置
- 每日任务按设置数量查询未学习单词
- 100 词测试 CSV

## 已验证行为

- 旧数据库升级后原有单词保留
- 每日数量支持按 1 递增，可设置 7、16 等具体数值
- 每日数量支持 5 至 50
- 听力默认速度支持 0.5x、0.75x、1.0x、1.25x、1.5x、2.0x
- 设置关闭 App 后仍然保留
- 每日任务开始页读取保存的任务数量
- 听力测试首次进入读取保存的默认速度

## 测试数据

```text
F:\English vocabulary app\Project\vocab-app\docs\samples\f4-daily-task-100.csv
```

校验结果：100 行、100 个唯一单词、无空字段、无 CSV 解析错误。

## 当前已知缺口

新导入单词的选词填空例句仍会出现通用兜底句：

```text
Complete the sentence with the correct word: ______.
```

原因是当前没有接入 DeepSeek 或本地动态例句生成。`sentenceTemplates.ts` 只有 15 个写死的模板，模板外的单词都会使用兜底句。

这不是 F4 设置或数据库问题。AI 例句生成原本排在 F9；如果调整优先级，需要先确认新的阶段顺序。

## 后续

下一阶段为 F5：每日任务学习闭环。
