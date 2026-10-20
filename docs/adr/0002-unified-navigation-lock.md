# ADR-0002 统一导航锁

- 状态：已接受
- 日期：2026-10-20

## 背景

PUSH 动画期间立即按 Android 返回会与根 BackHandler、新页面监听和 native-stack 返回处理交错，可能产生无效 POP 或空白页。

## 决策

所有导航动作必须经过 `src/utils/navigationActions.ts`：

- PUSH、BACK、REPLACE、DISMISS_TO、RESET 共用同一把锁。
- 最小锁定 300ms，最大等待 500ms。
- 路由 `pathname` 变化时完成锁。
- 被拒绝的导航不得执行伴随业务状态修改。
- 根 BackHandler 在锁定期内消费返回事件。

## 后果

- 页面和 Hook 不得直接调用 Expo Router 导航方法。
- 阶段推进、任务开始和完成重置使用准备回调，把状态修改与导航放在同一锁内。
- 锁状态必须通过纯函数测试覆盖。

## 替代方案

- 只增加返回防抖：不能覆盖 PUSH 期间返回，已否决。
- 每个页面独立加锁：无法阻止根监听和 native-stack 重复处理，已否决。
