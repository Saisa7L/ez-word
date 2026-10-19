# UI 与页面地图

最后更新：2026-10-19 17:33

## 导航结构

```text
底部 Tab
├─ 首页
│  ├─ 每日任务
│  │  ├─ 任务开始
│  │  ├─ 认识单词
│  │  ├─ 选词填空
│  │  ├─ 听力测试
│  │  └─ 任务完成
│  ├─ 错题回顾
│  └─ 单词再练
├─ 错题本
│  └─ 添加错题
└─ 我的
   ├─ 个人资料
   ├─ 通用设置
   ├─ 主题外观
   ├─ 导入单词
   │  └─ 当前词库
   │     └─ 添加单词
   ├─ 本地存档
   ├─ AI 设置
   └─ 关于
```

## 页面与路由

| 页面 | 路由 | 主要职责 |
|---|---|---|
| 首页 | `src/app/(tabs)/index.tsx` | 统计、头像、复习提醒、三个任务入口 |
| 错题本 | `src/app/(tabs)/wrong-book.tsx` | 错题分页、多选、移除 |
| 我的 | `src/app/(tabs)/settings.tsx` | 资料和各设置入口 |
| 每日任务开始 | `src/app/daily-task/index.tsx` | 读取设置和未学单词 |
| 认识单词 | `src/app/daily-task/learn.tsx` | 单词、释义、音标、发音 |
| 选词填空 | `src/app/daily-task/fill-blank.tsx` | 例句填空、错误记录 |
| 听力测试 | `src/app/daily-task/listening.tsx` | TTS 播放、听写、完成记录 |
| 任务完成 | `src/app/daily-task/complete.tsx` | 任务统计和返回首页 |
| 错题回顾 | `src/app/wrong-book/review.tsx` | 错题开始页和任务初始化 |
| 添加错题 | `src/app/wrong-book/add.tsx` | 词库选择、手动输入 |
| 单词再练 | `src/app/review/index.tsx` | 复习范围和任务初始化 |
| 个人资料 | `src/app/settings/profile.tsx` | 名片、头像、背景、字色和描边 |
| 通用设置 | `src/app/settings/daily-task.tsx` | 学习、听力、复习和提醒配置 |
| 主题外观 | `src/app/settings/theme.tsx` | 日间、夜间、自定义主题 |
| 导入单词 | `src/app/settings/import.tsx` | CSV 导入、说明和词库清空 |
| 当前词库 | `src/app/settings/word-library.tsx` | 分页、状态修改和软移除 |
| 添加单词 | `src/app/settings/word-library/add.tsx` | 手动添加单词 |
| 本地存档 | `src/app/settings/archive.tsx` | 导出和恢复 JSON 存档 |
| AI 设置 | `src/app/settings/ai.tsx` | Key、连接测试和例句生成 |
| 关于 | `src/app/settings/about.tsx` | 名称、版本、链接和隐私说明 |

## 全局组件

| 组件 | 作用 |
|---|---|
| `GreenSheetScreen` | 固定主题头部和页面滚动容器 |
| `SurfaceCard` | 主题化卡片表面 |
| `ActionOptionModal` | 通用操作/提示弹层 |
| `AppFeedbackProvider` | 全局提示和确认 |
| `ExitTaskModal` | 任务退出确认 |
| `TaskErrorModal` | 任务错误确认 |
| `PaginationBar` | 页码和前后页 |
| `ScrollIndicator` | 自定义滚动条 |
| `ColorPalette` | 全彩调色盘和 HEX/RGB 输入 |
| `OutlinedText` | 个人名片描边文字 |

## 已确认行为

- 首页绿色恐龙是用户头像，不是吉祥物。
- 选词填空和听力分别随机排序，单次任务内顺序稳定。
- 认识单词页不显示例句，翻译位于单词和音标之间。
- 听力一次播放全部单词，每词朗读两遍。
- 填空和听写出错都会进入错题本。
- 错题本和当前词库每页 5 条，支持跨页多选。
- 每日任务完成才增加学习天数和打卡。
- 错题回顾复用完整任务流程；单词再练跳过认识单词。
- 复习提醒为 App 内弹层，不使用系统通知。
- 所有系统 `Alert` 已替换为 App 内反馈。

## 资源和主题

- 页面资源目录和命名见 `docs/ASSETS.md`。
- 主题令牌和页面颜色规则见 `docs/THEME_GUIDE.md`。
- 原 Figma 生成图位于 `F:\English vocabulary app\ui\生成后的图片`，仅作为设计参考。
