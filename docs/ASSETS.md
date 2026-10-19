# 资源规范

最后更新：2026-10-19 18:08

## 目录结构

```text
assets/
├─ app/
│  ├─ icon.png
│  ├─ favicon.png
│  ├─ splash-icon.png
│  └─ android/
│     ├─ adaptive-icon-background.png
│     ├─ adaptive-icon-foreground.png
│     └─ adaptive-icon-monochrome.png
├─ ui/
│  ├─ shared/
│  │  ├─ avatar-dinosaur.png
│  │  └─ avatar-user.png
│  ├─ navigation/
│  │  ├─ home.png
│  │  ├─ wrong-book.png
│  │  └─ settings.png
│  ├─ home/
│  │  ├─ action-task.png
│  │  ├─ action-wrong-review.png
│  │  └─ action-word-practice.png
│  ├─ daily-task/
│  │  ├─ start.png
│  │  └─ complete.png
│  ├─ wrong-book/
│  │  └─ review-start.png
│  └─ settings/
│     ├─ about.png
│     ├─ ai.png
│     ├─ camera.png
│     ├─ daily-task.png
│     └─ import.png
└─ templates/
   └─ words-template.csv
```

## 命名规则

- 全部使用小写英文和连字符。
- 文件名描述页面用途，不使用 `f1`、`f3`、`icon-` 等历史阶段前缀。
- 页面独占资源放入对应页面目录。
- 多个页面共享的图片放入 `ui/shared`。
- App 图标、启动图和 favicon 放入 `app`。
- 代码图标优先使用 Lucide 或 `react-native-svg` 组件，不重复保存未引用的 SVG。

## 代码引用

所有 UI 图片统一从 `src/constants/uiAssets.ts` 引用：

```ts
uiAssets.home.task
uiAssets.navigation.home
uiAssets.settings.import
uiAssets.dailyTask.start
uiAssets.wrongBook.reviewStart
```

页面中不直接写 `require('../../assets/...')`，App 配置除外。

## 格式要求

| 类型 | 要求 |
|---|---|
| 头像 | 透明 PNG，优先正方形原图 |
| 页面插画 | PNG，保持原始宽高比 |
| 单色 UI 图标 | PNG 或代码 SVG；需要 tint 时使用透明单色 PNG |
| App 图标 | PNG，由 `app.json` 引用 |
| 启动图 | PNG，由 `expo-splash-screen` 引用 |
| CSV 模板 | 放在 `templates`，属于数据资源，不属于 UI |

## 新增资源流程

1. 确定资源属于 App、页面还是共享资源。
2. 放入对应目录并使用用途命名。
3. 在 `src/constants/uiAssets.ts` 增加引用。
4. 页面只通过 `uiAssets` 使用。
5. 更新本文件和 `UI_MAP.md`（如果新增页面资源）。
6. 执行类型检查、lint 和 Android 导出。

## 已清理内容

- 删除了与错题回顾主素材哈希相同的重复图片。
- 删除了代码中未引用的 `book.svg`、`calendar.svg`、`import-info.svg` 和 `settings-archive.svg`。
- 移除了 `f1`、`f3` 等历史阶段目录命名。
