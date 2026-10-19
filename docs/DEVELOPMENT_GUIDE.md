# 开发指南

最后更新：2026-10-19 18:08

## 环境

- Windows 11
- VS Code
- Node.js 22
- Expo SDK 57
- Android 真机：一加 Ace 2，Android 16
- 项目路径：`F:\English vocabulary app\Project\vocab-app`

## 启动

```powershell
Set-Location 'F:\English vocabulary app\Project\vocab-app'
npx expo start --lan --clear
```

手机和电脑在同一 Wi-Fi 下，用 Expo Go 扫描终端二维码。

## 检查命令

```powershell
npm run typecheck
npm run lint
npx expo-doctor
npx expo export --platform android --output-dir .expo/check
```

依赖安装使用：

```powershell
npx expo install <package>
```

禁止：

- 使用 `npm install` 强行添加原生依赖。
- 运行 `npm audit fix --force`。
- 按审计建议降级 Expo。

## VS Code

项目提供：

- `.vscode/settings.json`
- `.vscode/extensions.json`
- `.vscode/tasks.json`
- `.vscode/launch.json`

推荐扩展：Expo Tools、ESLint、React Native Tools。

常用操作：

- `Ctrl + P`：打开文件
- `F12`：跳转定义
- `Shift + F12`：查看引用
- `Ctrl + Shift + M`：查看 Problems
- `Ctrl + Shift + B`：运行 TypeScript 检查
- `F5`：浏览器调试

浏览器调试无法覆盖 SQLite 原生行为、图片裁剪、SAF 目录、TTS 和截图，最终验收以 Android 真机为准。

## Git 流程

```powershell
git status --short --branch
git diff
git add -A
git commit -m '说明本次修改'
git log --oneline --decorate -10
```

安全撤销：

```powershell
git restore -- '文件路径'
git restore --staged .
git revert 提交编号
```

不要使用 `git reset --hard` 或覆盖用户未提交的修改。

## 功能流程

1. 说明阶段目标、任务和完成标志。
2. 只处理一个明确功能。
3. 先读现有实现和相关文档。
4. 小步修改，不进行无关重构。
5. 运行类型检查、lint 和 Android 导出。
6. 更新相关主文档和阶段历史。
7. 稳定后提交 Git。

## 规划边界

规划阶段只确认页面流程、输入输出和数据结构。播放次数、间隔、分页数量和动画时长等细节，在实现对应功能前再确认。

## 报错处理

1. 先判断错误类别。
2. 找根因和最小复现路径。
3. 给出最小修复。
4. 说明验证方式和剩余风险。
5. 不轻易重装环境或推倒重来。

## 安全规则

- API Key 不写入源码、文档或聊天。
- 不提交 `.env`、签名文件、密码或 GitHub 凭证。
- Android Keystore 和密码必须单独备份。
