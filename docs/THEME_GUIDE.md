# 主题规范

最后更新：2026-10-19 17:09

## 模式

| 模式 | 规则 |
|---|---|
| 日间 | 主题色纯白 `#FFFFFF`，白色表面，灰色页面背景 |
| 夜间 | 主题色 `#3D3D3D`，灰色表面，黑色页面背景 |
| 自定义 | 在日间模式基础上只修改主题主色 |

不提供“跟随系统”模式。

## 运行时入口

```text
app_settings
→ ThemeProvider
→ createThemeColors(mode, primaryColor)
→ useThemedStyles(createStyles)
```

主题设置的保存位置是 `app_settings.theme_mode` 和 `app_settings.theme_primary_color`，并包含在本地存档中。

## 颜色令牌

| 令牌 | 日间 | 夜间 | 用途 |
|---|---|---|---|
| `primary` | `#FFFFFF` | `#3D3D3D` | 头部、主表面和主题色区域 |
| `onPrimary` | 自动对比色 | `#FFFFFF` | `primary` 上的文字和图标 |
| `background` | `#F0F0F8` | `#000000` | 页面底层 |
| `surface` | `#FFFFFF` | `#292929` | 卡片、卷轴和弹窗 |
| `text` | `#1D2430` | `#F5F5F5` | 主文字 |
| `textSecondary` | 灰色 | 浅灰 | 说明和次要信息 |
| `textMuted` | 灰色 | 灰色 | 占位和弱提示 |
| `border` | 浅灰 | `#4A4A4A` | 分割线和轨道 |
| `graySoft` | `#EEF0F5` | `#3A3A3A` | 输入框、普通按钮和弱背景 |
| `disabled` | `#B9C0CA` | `#4B4B4B` | 禁用状态 |
| `mint` | 浅灰/自定义推导 | `#3A3A3A` | 选中行和品牌浅底 |
| `accentText` | `#000000` | `#FFFFFF` | 普通控件前景、描边和线性图标 |
| `blue` | `#4F97F8` | `#9BBDFF` | 蓝色功能图标 |
| `orange` | `#F1A173` | `#D8B18E` | 橙色功能图标 |
| `pink` | `#E765B8` | `#D7A9C6` | 个人资料图标 |
| `red` | `#F85864` | `#F28B92` | 危险和错误 |
| `slate` | `#7C8798` | `#A5A5A5` | 中性图标 |

## 固定颜色

| 元素 | 颜色 |
|---|---|
| 品牌绿 | `#30BFAE` |
| 品牌绿浅底 | `#DDF4EF` |
| 个人名片默认文字 | `#FFFFFF` |
| 个人名片默认描边 | `#000000` |
| 个人头像展示区描边 | `#000000` |

## 页面规则

- 普通按钮和线性图标使用 `accentText`。
- 日间普通操作按钮使用 `graySoft` 底板和 `accentText` 前景。
- “开始导入”和退出确认“是”使用品牌绿。
- 首页“今日任务”和“我的 → 导入单词”底板使用 `graySoft`，不随自定义主题色变化。
- 关于页 App 图标、检查更新和 AI 密钥底板使用 `graySoft + accentText`。
- 导入页文件图标保留品牌绿。
- 错题回顾、单词再练等页面按功能使用蓝、橙、红等功能色。
- 个人名片文字和描边颜色属于用户配置，不纳入 App 主题。
- 听力进度条使用 `accentText`，日间黑色、夜间白色。

## 修改主题检查表

1. 先修改 `src/constants/theme.ts`。
2. 检查所有 `colors.*` 使用是否仍表达正确语义。
3. 检查自定义模式不会意外改变固定品牌底板。
4. 检查夜间弹窗、输入框、禁用态和状态栏。
5. 运行类型检查和 lint。
6. 真机检查日间、夜间、自定义和重启后的持久化。
