# 当前窗口交接文档

最后更新：2026-10-19

## 项目

- 名称：易词通（Ez Word）
- 路径：`F:\English vocabulary app\Project\vocab-app`
- 分支：`main`
- 已提交基线：以 `git log -1` 为准
- 当前阶段：P5 已按当前实现收口并提交，下一阶段为 P6 代码与文档整理

## 重要 Git 状态

P5 的全部代码、素材和文档已经提交。用户确认不再继续修正剩余视觉问题，按当前实现结束 P5。

新窗口第一件事必须运行：

```powershell
git status --short --branch
git log --oneline --decorate -5
```

不要重新打开 P5 已收口的视觉问题，除非用户明确要求返工。

## P5 当前完成内容

- 日间主题：纯白 `#FFFFFF` 主题色、白色卡片、灰色背景、黑色按钮文字
- 夜间主题：`#3D3D3D` 主题色、灰色卡片、黑色背景、白色按钮文字
- 自定义主题：在日间模式基础上只修改主题色
- 全部页面、Tab、卷轴、卡片、弹窗、输入区和错误页接入动态主题
- 主题设置保存到 SQLite v17，并纳入本地存档
- 调色盘使用显示区域局部触摸，拖动时暂停页面滚动
- 调色盘支持 `#RRGGBB` 和 `255,255,255` 输入
- 导入页右上角新增 `信息.svg` 说明按钮和日夜适配弹窗
- 错题回顾图片使用 `f3-wrong-answer-kids-question.png`
- 新应用图标用于关于页、App 图标、自适应图标、启动页和 favicon
- 日间灰色按钮、绿色导入/退出确认按钮和听力黑色进度条
- VS Code 配置和调试说明已完成

## 颜色规则

详细分类见：

```text
docs/THEME_COLOR_INVENTORY.md
```

当前关键规则：

- 普通控件前景使用 `colors.accentText`
- 首页“今日任务”和“我的 → 导入单词”图标底板使用 `colors.graySoft`，不随自定义主题色推导
- 关于页应用图标底板、检查更新、AI 密钥图标和底板使用 `colors.graySoft/accentText`
- 导入页文件图标继续使用固定默认绿配色
- 日间普通主操作按钮使用 `colors.graySoft` 底板和 `colors.accentText` 前景
- “开始导入”和任务退出确认弹层的“是”使用 `DEFAULT_GREEN`
- 听力测试进度条使用 `colors.accentText`，日间为黑色、夜间为白色
- 个人名片颜色继续独立配置

## 验证状态

已通过：

- `npm run typecheck`
- `npm run lint`
- `npx expo-doctor`，21/21
- Android 离线导出
- 数据库 v16 → v17 主题迁移
- v10-v16 旧存档兼容
- 主题存档恢复

## 用户验收结论

- 用户确认当前实现可以接受，不再继续处理剩余颜色和视觉问题
- P5 按当前状态视为完成，不阻塞进入 P6
- 若后续整理时改动主题代码，只要求不引入新的回归，不重新设计 UI

## P6 计划

1. 梳理 `src/app`、`src/components`、`src/features`、`src/database`、`src/services` 的职责边界
2. 整理代码：去重、消除失效代码、统一命名、拆分过长页面和重复主题样式
3. 梳理数据流：页面入口、状态来源、SQLite 读写、主题 Provider、存档导入导出
4. 整理文档：项目结构、模块职责、数据流、数据库表、页面清单和交接说明
5. 保持 `npm run typecheck` 和 `npm run lint` 通过
6. P6 不包含打包、签名、APK 和发布工作

详细说明见 `docs/P6_PROGRESS.md`。

## 可直接粘贴到新窗口

```text
你现在接手《易词通（Ez Word）》项目。

项目路径：
F:\English vocabulary app\Project\vocab-app

请先不要修改代码。先读取：
1. docs/CURRENT_HANDOFF.md
2. docs/PROJECT_CONTEXT.md
3. docs/P5_PROGRESS.md
4. docs/THEME_COLOR_INVENTORY.md
5. docs/VSCODE_SETUP.md
6. docs/UI_MAP.md

然后运行：
git status --short --branch
git log --oneline --decorate -5

P5 已按当前实现收口并提交，进入 P6 代码与文档整理阶段。

请先用中文告诉我：
1. 当前实际 Git 状态
2. P5 已收口范围和当前代码结构
3. P6 应优先整理哪些重复代码和文档
4. 当前数据流是否还有未记录的入口

不要重新设计已经收口的主题 UI，不要进入打包和发布流程。
```
