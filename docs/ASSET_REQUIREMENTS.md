# F1 美术资源清单

最后更新：2026-10-16

## 放置目录

请把 F1 资源放到：

```text
F:\English vocabulary app\ui\assets\F1
```

不要覆盖原始设计图目录：

```text
F:\English vocabulary app\ui\生成后的图片
```

## 必须提供的头像

A01 首页中的绿色小恐龙是用户头像，不是吉祥物。

| 文件名 | 内容 | 推荐格式 |
|---|---|---|
| `avatar-dinosaur.png` | 首页绿色小恐龙头像 | 透明背景 PNG，建议 1024 × 1024，PNG 优先 |
| `avatar-user.png` | A02 我的页面女性头像 | 透明背景 PNG，建议 1024 × 1024，PNG 优先 |

如果只有 SVG，也可以提供。复杂渐变和蒙版的 Figma SVG 在 Android 上可能显示不一致，因此头像优先使用透明 PNG。

## 必须提供的图标 SVG

所有图标统一要求：

- 画布使用正方形，建议 `viewBox="0 0 48 48"` 或 `0 0 24 24`。
- 不嵌入位图。
- 不包含页面背景。
- 文件名使用小写英文和连字符。
- 单色图标优先使用 `currentColor`，方便切换选中和未选中颜色。

### A01 首页入口图标

| 文件名 | 对应位置 |
|---|---|
| `icon-home-calendar.svg` | 今日任务右侧日历图标 |
| `icon-home-wrong-review.svg` | 错题回顾右侧图标 |
| `icon-home-word-practice.svg` | 单词再练右侧图标 |

### A02 我的页面图标

| 文件名 | 对应位置 |
|---|---|
| `icon-settings-avatar.svg` | 更换头像左侧相机图标 |
| `icon-settings-daily-goal.svg` | 修改每日任务左侧任务图标 |
| `icon-settings-import.svg` | 导入单词左侧上传图标 |
| `icon-settings-ai.svg` | AI 设置左侧智能图标 |
| `icon-settings-about.svg` | 关于左侧信息图标 |

### 底部导航图标

| 文件名 | 对应位置 |
|---|---|
| `icon-tab-home.svg` | 底部首页 |
| `icon-tab-wrong-book.svg` | 底部错题本 |
| `icon-tab-profile.svg` | 底部我的 |

分页左右箭头、右箭头等普通图标可以使用 Lucide，不必单独提供。

## 字体资源

为了让文字尽量接近设计图，请提供 Figma 中使用的：

| 文件 | 用途 |
|---|---|
| 常规字重字体文件 | 正文、说明文字 |
| 中等字重字体文件 | 标题和小标题 |
| 粗体字重字体文件 | 大标题和重点数字 |
| 字体授权说明 | 确认允许在 App 中使用 |

字体文件通常是 `.ttf` 或 `.otf`，不是 SVG。

如果没有字体文件或授权，将使用 Android 默认字体。布局仍可照搬，但字形会有差异。

## 设计规范资源

如果 Figma 中存在设计变量，请额外提供一份颜色和尺寸说明：

```text
primary:
background:
text-primary:
text-secondary:
success:
error:
card-radius:
page-horizontal-padding:
```

如果没有这份说明，我会从设计 PNG 中取样并测量。

## 不需要提供

以下内容可以直接用代码实现，不需要单独图片：

| 内容 | 实现方式 |
|---|---|
| 白色卡片 | View 和样式 |
| 圆角、阴影 | View 和样式 |
| 顶部绿色背景 | View 和样式 |
| 分页数字按钮 | Text 和 Touchable |
| 普通左右箭头 | Lucide 图标 |
| 进度条 | View 和样式 |

## F1 开始条件

只有满足以下条件后才开始 F1 页面代码：

1. 两个头像资源已经放入指定目录。
2. 11 个图标 SVG 已经放入指定目录。
3. 如果没有自定义字体，需要明确同意使用 Android 默认字体。
4. 我会先检查文件是否存在、格式是否正确、名称是否匹配。
5. 检查通过后，再给出 F1 实施顺序并等待确认。

## 检查记录

检查日期：2026-10-16

| 项目 | 结果 |
|---|---|
| 13 个预期文件名 | 全部存在 |
| `icon-home-word-practice.svg.svg` | 已改名为 `icon-home-word-practice.svg` |
| SVG 格式 | 全部可以正常解析 |
| SVG 内嵌位图 | 未发现 |
| 图标视觉检查 | 部分匹配，4 个图标需要替换 |
| `avatar-dinosaur.svg` | 不符合设计，当前是通用用户剪影 |
| `avatar-user.svg` | 不符合设计，当前是通用用户剪影 |
| 两个头像是否相同 | 是，SHA-256 完全相同 |
| 字体文件 | 未提供 |

需要替换的图标：

| 文件名 | 问题 |
|---|---|
| `icon-home-wrong-review.svg` | 当前只有放大镜，设计图还包含回顾箭头 |
| `icon-settings-daily-goal.svg` | 当前剪贴板没有勾选标记 |
| `icon-settings-import.svg` | 当前箭头向下，设计图箭头向上 |
| `icon-settings-ai.svg` | 当前是滑杆图标，设计图是 AI 智能图标 |

当前阻塞：

1. 需要替换为真实绿色恐龙用户头像。
2. 需要替换为真实女性用户头像。
3. 需要替换 `icon-home-wrong-review.svg`。
4. 需要替换 `icon-settings-daily-goal.svg`。
5. 需要替换 `icon-settings-import.svg`。
6. 需要替换 `icon-settings-ai.svg`。
7. 需要确认使用 Android 默认字体，或补交自定义字体文件和授权。

## 用户决定

用户已确认：

1. 使用 Android 默认字体。
2. 不替换头像或图标文件。
3. 当前头像允许使用 AI 生成的占位效果。
4. 当前资源直接用于 F1。

因此 F1 资源门禁已解除，不再等待文件替换。
