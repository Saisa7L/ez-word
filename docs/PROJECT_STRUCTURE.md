# 项目目录说明

## 根目录文件

| 文件或目录 | 作用 |
|---|---|
| `src/app/` | Expo Router 页面目录，里面的文件对应手机页面 |
| `src/app/_layout.tsx` | App 最外层导航结构 |
| `src/app/(tabs)/index.tsx` | A01 首页 |
| `src/app/(tabs)/settings.tsx` | A02 我的 |
| `src/app/(tabs)/wrong-book.tsx` | A03 错题本 |
| `src/app/settings/import.tsx` | A11 导入单词页面 |
| `src/components/` | 多个页面重复使用的界面组件 |
| `src/components/ImportResultModal.tsx` | CSV 导入结果弹窗 |
| `src/constants/` | 颜色、间距、固定文字等常量 |
| `src/database/` | SQLite 初始化、查询和数据迁移 |
| `src/database/database.ts` | 数据库名称和建表迁移 |
| `src/database/wordsRepository.ts` | 单词查询、新增和更新 |
| `src/features/daily-task/` | 每日任务相关代码 |
| `src/features/ai/` | 批量生成并写入 AI 例句 |
| `src/features/archive/` | 本地存档序列化、校验和恢复 |
| `src/features/theme/` | 全局运行时主题和动态样式 |
| `src/features/word-import/` | CSV 选择、解析、校验和导入 |
| `src/hooks/` | 返回键拦截、长按步进等复用交互逻辑 |
| `src/services/` | DeepSeek、TTS、安全存储和文件读写等外部服务 |
| `src/utils/` | 通用的小工具函数 |
| `src/utils/formatBytes.ts` | 文件大小格式化 |
| `src/utils/date.ts` | 本地日期格式化 |
| `src/utils/pagination.ts` | 分页总数和末页计算 |
| `src/utils/navigation.ts` | 返回首页和每日任务起始页 |
| `src/utils/shuffle.ts` | 数组随机排序 |
| `assets/` | 图标、启动图和图片资源 |
| `docs/` | 需求、结构、Git 和长期上下文文档 |
| `docs/ARCHITECTURE.md` | 分层职责、模块边界和状态归属 |
| `docs/DATA_FLOW.md` | 启动、任务、导入、主题和存档数据流 |
| `docs/DATABASE.md` | 数据库表、迁移历史、不变量和存档关系 |
| `docs/UI_MAP.md` | 页面编号、路由、组件和 UI 缺口 |
| `docs/NEXT_THREAD_PROMPT.md` | 新窗口接续项目的完整提示词 |
| `docs/WORKFLOW.md` | 阶段推进、细节确认和报错处理规则 |
| `docs/ASSET_REQUIREMENTS.md` | F1 头像、图标、字体和设计规范资源清单 |
| `docs/samples/f2-import-test.csv` | F2 导入测试 CSV |
| `docs/samples/f3-daily-task-test.csv` | F3 每日任务测试 CSV |
| `docs/samples/f4-daily-task-100.csv` | F4 设置、按个位取词和防重复学习测试 CSV，共 100 个单词 |
| `docs/samples/f9-ai-examples-test.csv` | F9 CSV 例句和 AI 补齐测试文件 |
| `docs/F4_STATUS.md` | F4 完成状态、测试数据和当前例句缺口 |
| `docs/F5_STATUS.md` | F5 完成状态、任务设置项和已知边界 |
| `docs/F6_STATUS.md` | F6 完成状态、词库软清空和数据不变量 |
| `docs/F7_STATUS.md` | F7 完成状态、单词状态模型和错题闭环 |
| `docs/F8_STATUS.md` | F8 完成状态、首页统计和复习提醒规则 |
| `docs/F9_STATUS.md` | F9 完成状态、CSV 例句和离线 AI 策略 |
| `docs/F10_STATUS.md` | F10 完成状态、自定义反馈和错误边界 |
| `docs/P1_ARCHIVE_STATUS.md` | P1 本地存档、用户资料和我的页面状态 |
| `docs/P2_PROGRESS.md` | P2 个人资料名片页实现、依赖和验收结果 |
| `docs/P5_PROGRESS.md` | P5 主题、调色盘、素材和用户收口结果 |
| `docs/P6_PROGRESS.md` | P6 代码、文档、架构和数据流整理计划 |
| `docs/THEME_COLOR_INVENTORY.md` | 主题颜色令牌和页面颜色分类 |
| `docs/VSCODE_SETUP.md` | VS Code 启动、调试和检查说明 |
| `docs/evidence/f3/` | F3 验收过程的手机截图证据 |
| `assets/templates/words-template.csv` | 可导入的 CSV 示例模板 |
| `assets/f3/f3-wrong-answer-kids-question.png` | 错题回顾开始页当前素材 |
| `assets/f3/wrong-review-start.png` | 错题回顾开始页专属素材 |
| `assets/icons/settings-archive.svg` | 我的页面本地存档 SVG 图标 |
| `assets/icons/import-info.svg` | 导入说明按钮 SVG |
| `assets/icons/calendar.svg` | 个人资料已学习天数 SVG |
| `assets/icons/book.svg` | 个人资料已学习单词 SVG |
| `app.json` | Expo App 名称、图标、路由和 Android 配置 |
| `eslint.config.js` | ESLint 代码检查规则 |
| `package.json` | 项目依赖和可执行命令 |
| `package-lock.json` | 锁定依赖版本，保证安装结果一致 |
| `tsconfig.json` | TypeScript 配置和 `@/` 路径别名 |
| `.gitignore` | 告诉 Git 哪些文件不要保存 |
| `AGENTS.md` | Expo 为该仓库提供的开发规则 |
| `README.md` | 项目启动和检查命令 |

## 已移除的模板文件

| 文件 | 原因 |
|---|---|
| `App.tsx` | 已改为 Expo Router，不再使用旧入口 |
| `index.ts` | 已改为 `expo-router/entry` 入口 |
