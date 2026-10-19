# 新窗口接续提示词

请把下面整段内容粘贴到新窗口的第一条消息中。

```text
你现在接手《English Vocabulary App》项目。请用中文继续协助我，先不要写代码，先读取现有文档并确认当前状态。

## 你必须先读取的文件

1. F:\English vocabulary app\Project\vocab-app\docs\PROJECT_CONTEXT.md
2. F:\English vocabulary app\Project\vocab-app\docs\REQUIREMENTS.md
3. F:\English vocabulary app\Project\vocab-app\docs\UI_MAP.md
4. F:\English vocabulary app\Project\vocab-app\docs\PROJECT_STRUCTURE.md
5. F:\English vocabulary app\Project\vocab-app\docs\GIT_BASICS.md
6. F:\English vocabulary app\Project\vocab-app\docs\CSV_IMPORT_FORMAT.md
7. F:\English vocabulary app\Project\vocab-app\docs\WORKFLOW.md
8. F:\English vocabulary app\Project\vocab-app\docs\ASSET_REQUIREMENTS.md
9. F:\English vocabulary app\Project\vocab-app\docs\F3_STATUS.md
10. F:\English vocabulary app\Project\vocab-app\docs\CURRENT_HANDOFF.md
11. F:\English vocabulary app\Project\vocab-app\docs\P5_PROGRESS.md
12. F:\English vocabulary app\Project\vocab-app\docs\P6_PROGRESS.md
13. F:\English vocabulary app\Project\vocab-app\docs\ARCHITECTURE.md
14. F:\English vocabulary app\Project\vocab-app\docs\DATA_FLOW.md
15. F:\English vocabulary app\Project\vocab-app\docs\DATABASE.md

同时运行：

git status --short --branch
git log --oneline --decorate -5

不要假设代码状态，必须以仓库实际状态和文档为准。

## 产品简介

产品是一款面向大学生的 Android 英语单词记忆 App。

第一版只给本人使用，单机运行，不登录，不做云端同步，不连接自己的服务器。

核心功能：
1. 用户按固定 CSV 格式导入单词。
2. 用户设置每日单词数量。
3. 每日任务依次包含：认识单词、选词填空、TTS 听写。
4. A05 认识单词页不显示例句，翻译位于单词和音标之间。
5. 听写错误的单词进入错题本。
6. 错题可以再练，用户可手动移出已掌握单词。
7. 每完成一次每日任务增加一次打卡。
8. 第 3、6、9 次等打卡后提醒复习。
9. 复习时选择最近多少天范围，并省略观看释义环节。

## 技术栈

- Windows 11 开发环境
- VS Code
- Node.js 22
- Expo SDK 57
- React Native 0.86
- TypeScript 6
- Expo Router，页面位于 src/app
- SQLite 本地数据库
- Android 自带 TTS
- DeepSeek API
- PapaParse 解析 CSV
- Expo DocumentPicker 选择文件
- Expo FileSystem 读取文件
- Git 本地仓库，分支 main

项目路径：

F:\English vocabulary app\Project\vocab-app

UI 原图路径：

F:\English vocabulary app\ui\生成后的图片

## 已确认的 UI 结构

底部三个主 Tab：
1. 首页：A01-home.png
2. 错题本：A03-wrong-book.png
3. 我的：A02-settings.png

每日任务流程：
1. A04-daily-task-start.png
2. A05-daily-task-learn-word.png
3. A06-daily-task-fill-in-blank.png
4. A07-daily-task-listening.png
5. A08-daily-task-complete.png
6. 10-daily-task-exit-confirm.png 是退出任务弹窗

导入流程：
1. 我的页面 A02 点击“导入单词”
2. A11-setting-import.png 选择 CSV 和开始导入
3. A12-setting-import-confirm.png 是导入成功弹窗
4. A11-setting-import-explain.png 只是 A11 的交互标注图，不是独立页面

UI 缺口和待确认项已经写入 docs/UI_MAP.md。

已确认入口：
- 今日任务进入每日任务流程。
- 错题回顾进入错题再练流程。
- 单词再练进入复习流程。

已确认错题本：
- 添加表示从 CSV 已有单词中选择并加入错题本。
- 移除表示把选中单词移出错题本。
- 允许手动添加单词。
- 设计图每页 4 条，实际 UI 开发时改为每页 5 条。
- 首页绿色小恐龙是用户头像，不是吉祥物。
- F1 已完成基础 UI 并通过真机验证。
- F1 使用 Mock 数据，尚未开发的功能入口不处理点击，设计图中的文字和数字照搬。
- 使用 Android 默认字体，当前头像和图标资源按用户确认直接使用。

## 软件架构

src/app：
Expo Router 页面和导航。

src/components：
可复用 UI 组件。

src/features/daily-task：
每日任务业务。

src/features/review：
定时复习业务。

src/features/wrong-book：
错题本业务。

src/features/word-import：
CSV 解析、校验、文件选择和导入。

src/database：
SQLite 建表、迁移和单词仓库。

src/services：
DeepSeek、TTS 和其他外部服务。

src/types：
共用类型。

src/utils：
通用工具。

第一版没有云端服务器和云端数据库。

开发环境中的 DeepSeek API Key 保存在 Windows 用户环境变量 DEEPSEEK_API_KEY。
API Key 不得写入代码、GitHub、文档或聊天。

## 当前进度

阶段 A 至 E 已完成。

已完成：
- 需求确认单
- Expo 环境
- Expo Go 真机连接
- DeepSeek 最小请求成功
- Expo Router 项目骨架
- ESLint、TypeScript、Expo Doctor
- Android 导出验证
- 本地 Git
- SQLite words 表和迁移
- 单词新增、更新和查询
- CSV 解析、字段校验、错误行统计
- CSV 文件选择和导入核心
- CSV 模板
- A01、A02、A03 基础 UI 和底部导航
- A11 导入页面和 A12 导入结果弹窗
- F2 真机导入验证
- F3 每日任务页面和核心交互
- F3 真机验收通过

当前正在 F 阶段，开发顺序：
1. A01、A02、A03 基础 UI 和底部导航已完成。
2. A11 导入 UI 和 CSV、SQLite 核心接入已完成。
3. F3 每日任务流程已完成并通过真机验收。

当前 F1-F10、本地化阶段 P1-P4 和 P5 已全部完成。

P5 已按当前实现收口并提交。用户不再继续修正剩余视觉问题。接续时先检查 `git status` 并读取：

docs/CURRENT_HANDOFF.md
docs/P2_PROGRESS.md
docs/P3_PROGRESS.md
docs/P4_PROGRESS.md
docs/P5_PROGRESS.md
docs/THEME_COLOR_INVENTORY.md
docs/VSCODE_SETUP.md

后续阶段：

1. P6：整理代码和文档，梳理代码架构、页面数据流、SQLite 读写和模块职责。
2. P6 不包含 EAS、APK、签名和发布工作。

F3 的完成状态、修复记录和测试数据见：

docs/F3_STATUS.md

F4 的完成状态、测试数据和已知例句缺口见：

docs/F4_STATUS.md

F5 的完成状态、设置项和已知边界见：

docs/F5_STATUS.md

F6 的完成状态、数据不变量和测试记录见：

docs/F6_STATUS.md

F7 的完成状态、状态模型和页面记录见：

docs/F7_STATUS.md

F8 的完成状态、统计规则和复习提醒逻辑见：

docs/F8_STATUS.md

F9 的完成状态、CSV 例句和离线 AI 策略见：

docs/F9_STATUS.md

F10 的完成状态、自定义反馈和错误边界见：

docs/F10_STATUS.md

P1 的完成状态和本地存档说明见：

docs/P1_ARCHIVE_STATUS.md

之前从导入页开始的做法已经取消，但 F1 数据层代码继续保留。

## 已知风险

- npm audit 报告 Expo 工具链依赖问题。
- 禁止运行 npm audit fix --force。
- 不允许按审计建议把 Expo 降级到旧版本。
- React Native DevTools 曾在缓存跨磁盘移动时失败，但 Android 打包正常。
- 两天内完成可用版本的目标已经超期，优先保证可运行和可维护。

## 必须遵守的工作规则

1. 先不写代码，先确认需求和阶段目标。
2. 每个阶段开始先说明：本阶段目标、要做的事、完成标志。
3. 得到我确认后才进入下一阶段。
4. 每次只做一个功能。
5. 每个功能按“需求、思路、代码、怎么验证、常见错误”输出。
6. 术语第一次出现时用一句大白话解释。
7. 命令写完整，说明窗口、目录和预期结果。
8. 我先贴报错时，先判断问题类别，再给最小修复步骤。
9. 不要让我重装环境或推倒重来，除非确实必要。
10. 技术选型需要对比并说明推荐理由和风险。
11. 不要凭空假设账号、文件和软件状态。
12. 输出中文，多用表格和编号步骤。
13. 不安装新软件、服务或依赖前，先确认安装位置。
14. 每个稳定功能完成检查后提交 Git。
15. 规划阶段只确认页面流程和数据结构，播放次数、间隔时间、分页数量等细节放到对应功能开发前再确认。
16. 如果 UI 元素识别不清楚，向用户索取带中文标注的 UI 图片。

## 接续方式

请先检查 Git 和文档，然后告诉我：
1. 当前实际状态。
2. 修正后 F1 基础 UI 的实施计划。
3. 本阶段目标、要做的事和完成标志。

不要重新询问已经记录在 UI_MAP.md 中的问题。得到我确认后再开始写页面代码。
```
