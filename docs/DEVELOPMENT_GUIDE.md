# 开发指南

最后更新：2026-10-21 20:03

## 环境

- Windows 11
- VS Code
- Node.js 22.5 或更高版本
- Expo SDK 57
- 仅支持 Android
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
npm run check
npx expo export --platform android --output-dir .expo/check
```

`npm run check` 包含格式、文档、类型、Lint、覆盖率和 Expo Doctor。

文档检查：

```powershell
npm run docs:check
```

该命令验证必需文档、最后更新时间、npm 脚本引用、Markdown 文档路径和样例路径。

发版前性能预算：

```powershell
npm run check:release
```

该命令会额外执行 Android 导出并检查 HBC、资源总量、单资源和资源文件数预算。

依赖安装使用：

```powershell
npx expo install <package>
```

数据层测试：

```powershell
npm run test:data
```

测试运行在 Node 内置 SQLite 上，出现 `ExperimentalWarning: SQLite` 属于运行环境提示，不代表测试失败。

格式化：

```powershell
npm run format
npm run format:check
```

CI 使用 Node 22，并执行与 `npm run check` 相同的质量门禁。

禁止：

- 使用 `npm install` 强行添加原生依赖。
- 运行 `npm audit fix --force`。
- 按审计建议降级 Expo。

## VS Code

项目提供：

- `.vscode/settings.json`
- `.vscode/extensions.json`
- `.vscode/tasks.json`

推荐扩展：Expo Tools、ESLint、React Native Tools。

常用操作：

- `Ctrl + P`：打开文件
- `F12`：跳转定义
- `Shift + F12`：查看引用
- `Ctrl + Shift + M`：查看 Problems
- `Ctrl + Shift + B`：运行 TypeScript 检查
- `F5`：浏览器调试

项目不提供 Web/iOS 调试入口，最终验收以 Android 真机为准。

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
4. 搜索是否存在同类型组件、样式、Hook、工具函数或服务方法。
5. 优先复用或扩展现有模式，确认无法满足后再新增抽象。
6. 小步修改，不进行无关重构。
7. 运行测试、类型检查、lint 和 Android 导出。
8. 更新相关主文档和阶段历史。
9. 稳定后提交 Git。

## 同类参考优先

- 修改 UI 前先搜索同类按钮、列表行、弹层和状态样式。
- 修改业务逻辑前先搜索相同数据流、仓库方法和 Hook。
- 如果现有模式语义一致，直接复用或抽成共享实现。
- 如果现有模式不能满足需求，说明差异和为什么不复用。
- 不为一次性需求新增全局方法、语义令牌或抽象层。
- 新增条件样式时，必须说明为什么不能直接修改基础样式。

## 规划边界

规划阶段只确认页面流程、输入输出和数据结构。播放次数、间隔、分页数量和动画时长等细节，在实现对应功能前再确认。

## 报错处理

1. 先判断错误类别。
2. 找根因和最小复现路径。
3. 给出最小修复。
4. 说明验证方式和剩余风险。
5. 不轻易重装环境或推倒重来。

日志和诊断规则：

- 业务异常优先转换为 `AppError`，保留稳定错误码。
- 日志使用 `logger`，不要直接拼接 API Key、Authorization 或用户敏感数据。
- 诊断文本只保存在本地，不上传个人数据。

## 安全规则

- API Key 不写入源码、文档或聊天。
- 不提交 `.env`、签名文件、密码或 GitHub 凭证。
- Android Keystore 和密码必须单独备份。
