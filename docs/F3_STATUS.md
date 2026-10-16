# F3 当前状态

最后更新：2026-10-16

代码保存提交：`2f5d9d2 Add F3 daily task flow with known UI issues`

## 结论

F3 代码已经实现，但真机验收未通过。

新对话不得把 F3 标记为完成，只能从以下两个阻塞问题继续修复。

## 已实现的 F3 内容

- 首页“今日任务”入口
- A04 每日任务开始页
- A05 认识单词页
- A06 选词填空页
- A07 听力测试页
- A08 每日任务完成页
- 退出任务确认弹窗
- 填空错误数量弹窗
- 听写错误数量弹窗
- Android 自带 TTS
- 每个单词朗读两遍，任意两次朗读间隔 5 秒
- 0.5x、0.75x、1.0x、1.25x、1.5x、2.0x 倍速
- 选词填空每页 4 个单词，共 3 页
- 自定义滚动条

## 未通过问题

### 1. 滚动窗口内容仍会被边缘切断

用户期望：

- 选词填空窗口的例句内容与窗口上下边缘留出空间。
- 听力测试窗口的输入内容与窗口上下边缘留出空间。

已经尝试：

- `questionContent` 和 `answerContent` 上下 padding 已增加到 40。
- 用户反馈仍未达到预期。

相关代码位置：

- `src/app/daily-task/fill-blank.tsx`
  - ScrollView：约第 117 行
  - `questionContent` 样式：约第 324 行
- `src/app/daily-task/listening.tsx`
  - ScrollView：约第 226 行
  - `answerContent` 样式：约第 294 行

证据图片：

- `docs/evidence/f3/fill-blank-scroll-clipping.jpg`
- `docs/evidence/f3/listening-scroll-clipping.jpg`

建议新对话方向：

- 不要再只增加 padding。
- 检查 ScrollView 的 viewport、内容裁切、卡片圆角遮罩和滚动偏移。
- 可以增加固定的上下内容缓冲区或渐变遮罩，并真机逐项验证。

### 2. 完成页“返回主界面”仍进入每日任务开始页

用户期望：

- 完成页左上角返回按钮：进入每日任务开始页。
- 完成页底部“返回主界面”按钮：直接进入 App 首页。

已经尝试：

- `router.dismissAll()` 后 `router.replace('/(tabs)')`
- `router.dismissTo('/')`
- 两者组合

用户反馈仍然进入每日任务开始页。

相关代码位置：

- `src/app/daily-task/complete.tsx`
  - `handleHome`：约第 20 行
  - 底部按钮：约第 72 行
- `src/utils/navigation.ts`
  - `returnToHome`：约第 3 行
  - `returnToDailyTaskStart`：约第 8 行

证据图片：

- `docs/evidence/f3/complete-return-home-bug.jpg`

建议新对话方向：

- 不要重复猜测 `dismissTo` 行为。
- 在真机上查看完整导航栈。
- 考虑使用 `useNavigation()` + `navigation.reset()`，明确重置到 `(tabs)`。
- 修复后分别验证：
  1. 左上角返回。
  2. 底部返回主界面。
  3. 从首页再次返回，不应出现空白页或 `GO_BACK` 错误。

## 测试数据

15 个单词的测试 CSV：

```text
F:\English vocabulary app\Project\vocab-app\docs\samples\f3-daily-task-test.csv
```

## 当前检查状态

- TypeScript：通过
- ESLint：通过
- Expo Doctor：此前通过
- Android 开发包：可以启动
- F3 真机验收：未通过

## 新对话起步要求

1. 先运行 `git status --short --branch` 和 `git log --oneline --decorate -10`。
2. 读取本文件、`PROJECT_CONTEXT.md`、`UI_MAP.md`、`NEXT_THREAD_PROMPT.md`。
3. 只处理上述两个阻塞问题。
4. 不要重写已经可用的 F3 页面。
5. 修改前先说明具体文件和预计改法。
6. 每次修改后让用户在真机确认。
