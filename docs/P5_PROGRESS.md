# P5 主题与素材修复进度

最后更新：2026-10-19

## 当前状态

P5 已按当前实现收口并提交。用户确认不再继续修正剩余视觉问题。

## Git 状态

- 分支：`main`
- P5 代码、素材和文档已经提交
- 当前提交以 `git log -1` 为准
- 新窗口先执行 `git status --short --branch`

## 已确认内容

- 主题模式：日间、夜间、自定义
- 日间主题色为纯白 `#FFFFFF`，卡片白色，背景灰色
- 夜间主题色为 `#3D3D3D`，卡片灰色，背景黑色
- 自定义模式在日间模式基础上只调整主题色
- 不增加“跟随系统”
- 错题回顾开始页使用用户指定素材

## 已实现内容

- 新增全局运行时主题 Provider
- 日间模式使用纯白主题色、白色卡片和灰色背景
- 日间模式按钮文字和线性图标统一使用黑色
- 夜间模式使用 `#3D3D3D` 主题色、灰色卡片和黑色背景
- 自定义模式使用一个全彩调色盘选择主题色
- 自定义模式只修改主题色，卡片和背景沿用日间模式
- 新增“我的 → 主题外观”设置页
- 主题模式和自定义主题色写入 SQLite
- 数据库升级到 v17
- 主题设置纳入本地存档
- 旧 v10-v16 存档自动使用日间白主题
- 导入存档后立即重新加载主题
- 全部页面、Tab、卷轴、按钮、弹层、加载和错误页接入动态主题
- 调色盘移除 PanResponder，改为显示区域自身的 responder 事件
- 调色盘按局部触摸坐标取色，控制图标限制在显示区域内
- 调色盘触摸时暂停外层页面滚动
- “导入单词”和“今日任务”与其他图标一样使用 `accentText/mint`
- 普通按钮文字、线性图标、描边和选中态使用 `accentText`
- 夜间模式按钮文字、图标、描边和选中态统一使用白色
- 导入页文件图标、关于页应用图标底板、检查更新和 AI 密钥图标使用固定默认绿配色
- 调色盘颜色文本框改为白底黑边，支持 `#RRGGBB` 和 RGB 数值输入
- 日间模式主题色改为纯白 `#FFFFFF`，按钮文字和图标为黑色
- 夜间模式按钮文字、图标、描边和选中态为白色
- 普通控件使用 `accentText`，不再使用 `controlAccent`
- 首页“今日任务”和“我的 → 导入单词”图标底板改用 `graySoft`，自定义主题不再改变底板
- 导入页右上角新增 SVG 信息按钮和日夜自适应说明弹窗
- 正式应用图标已替换为 `圆角-f3-app-icon-a.png`
- 关于页、App 图标、启动图和 Web favicon 使用同一图标
- 关于页应用图标底板、检查更新、AI 密钥图标和底板改用日夜主题色
- 错题回顾开始页改用原始素材文件名：
  `assets/f3/f3-wrong-answer-kids-question.png`
- 错题图片按原图 `382:354` 比例显示
- 日间个人资料、通用设置、主题外观、本地存档和 AI 设置按钮改为灰色
- 日间添加错题、选词填空提交和听力播放按钮改为灰色
- “开始导入”和任务退出确认弹层的“是”按钮改为绿色
- 听力测试进度条改为日间黑色、夜间白色

## 自动验收

- `npm run typecheck` 通过
- `npm run lint` 通过
- 日间、夜间、自定义调色板生成测试通过
- SQLite v17 主题默认值和持久化测试通过
- v16 -> v17 主题色迁移测试通过
- 存档 v17 主题恢复测试通过
- v10、v12、v13、v14、v15、v16 存档默认主题兼容测试通过
- Android 离线导出通过
- Android bundle 包含 `f3-wrong-answer-kids-question.png`
- Expo Doctor 21/21 通过

## 用户验收结论

- 用户确认当前实现可以接受，不再继续逐项调整
- P5 按当前状态视为完成
- 剩余视觉问题不再作为 P5 阻塞项
- 后续 P6 只做整理，不重新设计主题 UI

## 代码位置

- `src/constants/theme.ts`
- `src/features/theme/ThemeProvider.tsx`
- `src/database/themeRepository.ts`
- `src/app/settings/theme.tsx`
- `src/app/(tabs)/settings.tsx`
- `src/app/wrong-book/review.tsx`
- `src/constants/f3Assets.ts`
- `src/components/icons/ImportInfoIcon.tsx`
- `assets/icons/import-info.svg`
- `assets/icon.png`
- `assets/splash-icon.png`
- `app.json`
- `package.json`
- `docs/THEME_COLOR_INVENTORY.md`
- `docs/VSCODE_SETUP.md`
- `.vscode/*`

## P6 整理计划

- 梳理页面、组件、业务功能、数据库和服务层的职责边界
- 整理重复主题样式、重复格式化函数和过长页面
- 梳理首页、每日任务、错题本、复习、设置、存档的数据流
- 记录 SQLite 表、迁移版本、读写入口和状态来源
- 整理项目结构、页面清单、模块职责和交接文档
- 保持类型检查和 lint 通过
- P6 不包含 EAS、APK、签名和发布工作

详细说明见 `docs/P6_PROGRESS.md`。
