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
| `src/features/word-import/` | CSV 选择、解析、校验和导入 |
| `src/features/wrong-book/` | 错题本和错题再练相关代码 |
| `src/features/review/` | 定时复习相关代码 |
| `src/services/` | DeepSeek、TTS、CSV 导入等外部服务 |
| `src/types/` | 全项目共用的 TypeScript 数据类型 |
| `src/utils/` | 通用的小工具函数 |
| `src/utils/formatBytes.ts` | 文件大小格式化 |
| `assets/` | 图标、启动图和图片资源 |
| `docs/` | 需求、结构、Git 和长期上下文文档 |
| `docs/UI_MAP.md` | 页面编号、路由、组件和 UI 缺口 |
| `docs/NEXT_THREAD_PROMPT.md` | 新窗口接续项目的完整提示词 |
| `docs/WORKFLOW.md` | 阶段推进、细节确认和报错处理规则 |
| `docs/ASSET_REQUIREMENTS.md` | F1 头像、图标、字体和设计规范资源清单 |
| `docs/samples/f2-import-test.csv` | F2 导入测试 CSV |
| `docs/samples/f3-daily-task-test.csv` | F3 每日任务测试 CSV |
| `docs/F3_STATUS.md` | F3 当前未通过问题、代码位置和接续要求 |
| `docs/evidence/f3/` | F3 未通过问题的手机截图证据 |
| `assets/templates/words-template.csv` | 可导入的 CSV 示例模板 |
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
