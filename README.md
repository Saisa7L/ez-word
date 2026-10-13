# English Vocabulary App

面向大学生记忆英语单词的 Android App。

## 当前状态

- Expo SDK 57
- React Native 0.86
- TypeScript 6
- Expo Router
- 第一版使用本地 SQLite，不连接云端数据库
- DeepSeek API Key 由用户在 App 内填写

## 启动项目

在 VS Code 终端执行：

```powershell
Set-Location 'F:\English vocabulary app\Project\vocab-app'
npx expo start --lan
```

手机和电脑需要在同一个 Wi-Fi 下，然后使用 Expo Go 扫描终端二维码。

## 检查项目

```powershell
npm run typecheck
npm run lint
```

## 目录说明

详细说明见 `docs/PROJECT_STRUCTURE.md`。

## 安全规则

- 不把 DeepSeek API Key 写入代码。
- 不把 `.env`、密钥文件或签名文件提交到 Git。
- 桌面开发测试时使用 Windows 用户环境变量 `DEEPSEEK_API_KEY`。
- Android App 后续使用手机安全存储保存用户填写的 API Key。
