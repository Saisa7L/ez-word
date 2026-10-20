# English Vocabulary App

最后更新：2026-10-20 22:24

面向大学生记忆英语单词的 Android App，仅支持 Android。

项目最终目标是作为开源软件发布到 GitHub，通过 Releases 向国内 Android 用户提供签名 APK。第一阶段不包含 iOS、Web、登录或云端同步。

## 当前状态

- Expo SDK 57
- React Native 0.86
- TypeScript 6
- Node.js 22.5+
- Expo Router
- 不提供 iOS 和 Web 运行入口
- 第一版使用本地 SQLite，不连接云端数据库
- DeepSeek API Key 由用户在 App 内填写
- 架构重构主体已完成，当前进入开源发布硬化

## 启动项目

在 VS Code 终端执行：

```powershell
Set-Location 'F:\English vocabulary app\Project\vocab-app'
npx expo start --lan
```

手机和电脑需要在同一个 Wi-Fi 下，然后使用 Expo Go 扫描终端二维码。

## 检查项目

```powershell
npm run check:release
```

## 目录说明

完整文档索引见 `docs/README.md`，代码结构和模块边界见 `docs/ARCHITECTURE.md`，发布路线见 `docs/OPEN_SOURCE_RELEASE_PLAN.md`。

## 安全规则

- 不把 DeepSeek API Key 写入代码。
- 不把 `.env`、密钥文件或签名文件提交到 Git。
- 桌面开发测试时使用 Windows 用户环境变量 `DEEPSEEK_API_KEY`。
- Android App 后续使用手机安全存储保存用户填写的 API Key。
