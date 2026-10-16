# 项目上下文卡 v0.1

最后更新：2026-10-16

## 项目信息

| 项目 | 内容 |
|---|---|
| 产品 | 面向大学生的 Android 单词记忆 App |
| 当前用户 | 第一版仅本人使用 |
| 运行平台 | Android |
| 测试手机 | 一加 Ace 2，Android 16 |
| 项目路径 | `F:\English vocabulary app\Project\vocab-app` |
| Git 分支 | `main` |
| 最新功能提交 | `f519920 Add SQLite and CSV import core` |
| 当前阶段 | F 阶段，先搭建基础 UI，再接入已有数据层 |

## 技术栈

| 技术 | 决定 |
|---|---|
| App | Expo + React Native + TypeScript |
| 路由 | Expo Router，页面放在 `src/app` |
| 本地数据库 | SQLite |
| 手机朗读 | Android 自带 TTS |
| AI | DeepSeek |
| API Key | 开发环境使用 Windows 用户环境变量，App 后续使用手机安全存储 |
| 服务器 | 第一版不使用 |
| UI | 用户使用 Figma 设计，再交给 AI 生成 |

## 已完成

- A 阶段需求确认
- B 阶段技术方案和 MVP
- C 阶段账号、费用和上线路径
- D 阶段开发环境
- Expo 项目创建
- Expo Go 真机连接成功
- DeepSeek 最小请求成功
- Expo Router 依赖安装和入口迁移
- 项目目录骨架
- 本地 Git 骨架提交
- SQLite 数据库迁移和单词仓库
- CSV 解析、字段校验和错误行统计
- CSV 文件选择与导入核心流程
- 已整理 11 张 UI 图和页面地图
- 已生成新窗口接续提示词

## 待办

- A01、A02、A03 基础 UI 和底部导航
- A11 导入页面和成功弹窗
- 每日任务 A04 至 A08
- 错题本真实数据
- 设置子页面
- 定时复习 UI
- AI 例句、翻译和问答入口
- 加载、失败和空数据状态

## 当前风险

- 原本希望两天可用，环境搭建和骨架阶段已超出该时间，后续应优先保证可运行和可维护。
- `npm audit` 报告 Expo 工具链依赖问题，不能按照它建议降级 Expo。
- React Native DevTools 缓存曾出现跨磁盘移动错误，但 App 打包正常。

## 安全红线

- API Key 不写入代码。
- API Key 不发送到聊天。
- 密码、验证码和 GitHub/Git 凭证不发送。
- Android Keystore 和密码必须单独备份。
