# VS Code 项目查看与调试指南

最后更新：2026-10-19

## 打开项目

在 PowerShell 中运行：

```powershell
code "F:\English vocabulary app\Project\vocab-app"
```

项目内已经准备好：

- `.vscode/settings.json`
- `.vscode/extensions.json`
- `.vscode/tasks.json`
- `.vscode/launch.json`

## 推荐扩展

VS Code 打开项目后会提示安装推荐扩展：

- `Expo Tools`
- `ESLint`
- `React Native Tools`

不要安装会替代项目 TypeScript 版本的扩展。项目会使用 `node_modules/typescript`。

## 启动 App

在 VS Code 中：

1. 按 `Ctrl + Shift + P`
2. 输入 `Tasks: Run Task`
3. 选择 `Expo: Start (LAN)`
4. 手机打开 Expo Go 并连接终端显示的 `exp://` 地址

也可以在 VS Code 集成终端运行：

```powershell
npx expo start --lan --clear
```

## 修改页面代码

常用导航：

- `Ctrl + P`：按文件名快速打开
- `F12`：跳转到定义
- `Shift + F12`：查看引用
- `Ctrl + Shift + M`：打开 Problems，查看 TypeScript 和 ESLint 问题
- `F5`：启动已配置的浏览器调试

保存代码后，Expo 会通过 Fast Refresh 自动刷新页面。

## 类型和代码检查

按 `Ctrl + Shift + B` 运行默认任务：

```text
TypeScript: Check
```

通过任务菜单还可运行：

- `ESLint: Check`
- `Expo: Doctor`

## 真机页面调试

当前推荐使用 Expo 的 React Native DevTools：

1. 在 VS Code 集成终端启动 Expo
2. 用 Expo Go 打开 App
3. 在 Expo 终端按 `j`
4. Chrome DevTools 会打开 React Native 调试界面

在 React Native DevTools 中可以：

- 查看 Console 日志和错误堆栈
- 检查组件树和页面元素
- 查看网络请求
- 在 Sources 中设置断点和查看变量

源码中的 `console.log` 会显示在 Expo 终端和 React Native DevTools 中。

## 浏览器页面预览

`F5` 会启动 `Expo Web (Chrome)` 调试配置。

它适合检查布局和普通 React 逻辑，但部分原生功能不可用：

- SQLite 原生行为
- 系统图片选择器和裁剪
- 本地文件目录选择
- Android TTS
- `react-native-view-shot`

因此最终页面验收仍以 Expo Go 真机为准。

## 常见问题

### `localhost:8081` 没有页面

先按任务 `Expo: Start (LAN)`，确认终端显示：

```text
Metro: exp://...
```

### 手机连不上

- 确认手机和电脑在同一 Wi-Fi
- 使用终端显示的局域网地址
- 检查 Windows 防火墙是否阻止 Node.js

### 修改数据库后数据没有变化

SQLite 迁移只在 App 初始化时执行。彻底关闭 Expo Go 中的项目后重新打开。

### React Native DevTools 出现 dotslash 警告

这是 DevTools 自动更新缓存失败，当前会回退到内置版本。只要 Expo 打包和 App 运行正常，可以暂时忽略。

### 页面出现 Log 1 of 1

点击 `Dismiss` 后修复控制台中的第一个错误。错误堆栈中的 `src\...` 路径可直接在 VS Code 打开。
