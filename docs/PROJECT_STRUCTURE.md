# 项目目录说明

## 根目录文件

| 文件或目录 | 作用 |
|---|---|
| `src/app/` | Expo Router 页面目录，里面的文件对应手机页面 |
| `src/app/_layout.tsx` | App 最外层导航结构 |
| `src/app/index.tsx` | 当前首页路由 |
| `src/components/` | 多个页面重复使用的界面组件 |
| `src/constants/` | 颜色、间距、固定文字等常量 |
| `src/database/` | SQLite 初始化、查询和数据迁移 |
| `src/features/daily-task/` | 每日任务相关代码 |
| `src/features/wrong-book/` | 错题本和错题再练相关代码 |
| `src/features/review/` | 定时复习相关代码 |
| `src/services/` | DeepSeek、TTS、CSV 导入等外部服务 |
| `src/types/` | 全项目共用的 TypeScript 数据类型 |
| `src/utils/` | 通用的小工具函数 |
| `assets/` | 图标、启动图和图片资源 |
| `docs/` | 需求、结构、Git 和长期上下文文档 |
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
