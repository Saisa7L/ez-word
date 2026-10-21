# 贡献指南

感谢你关注易词通。提交代码、文档、测试或问题报告前，请先阅读本指南。

## 开始之前

- 项目第一阶段只支持 Android，不接受新增 iOS、Web 或跨平台运行入口。
- 新功能、数据模型变化和较大重构应先创建 Issue，说明使用场景、影响范围和验证方式。
- 缺陷修复应尽量给出最小复现步骤，不把无关重构混入同一个 Pull Request。
- 不要在 Issue、提交、日志或截图中公开 API Key、签名文件、用户存档和个人资料。

一般问题、功能建议和隐私咨询请使用 [GitHub Issues](https://github.com/Saisa7L/ez-word/issues)。安全漏洞不要公开提交，处理方式见 [SECURITY.md](SECURITY.md)。

## 开发环境

- Node.js 22.5 或更高版本
- npm
- Android 真机和 Expo Go，或后续配置完成的 Android 开发环境

```powershell
git clone https://github.com/Saisa7L/ez-word.git
Set-Location ez-word
npm ci
npx expo start --lan
```

安装 Expo 原生依赖时使用 `npx expo install <package>`，不要使用不兼容的强制安装方式。

## 修改原则

1. 先阅读相关文档和现有实现，优先复用已有组件、Hook、仓库和工具函数。
2. 将改动限制在明确的模块和业务边界内。
3. 页面只负责路由、展示和局部交互，复杂事务放入 `features`、`application` 或 `database`。
4. SQL 只放在 `database`，原生 I/O 只放在 `services`。
5. 所有 Expo Router 导航必须经过 `src/utils/navigationActions.ts`。
6. 不改变已经收口的主题视觉规则，除非 Issue 明确要求。
7. 数据库或存档字段变化必须同步 schema、迁移、旧版本兼容和测试。

架构边界见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)，模块接口见 [docs/MODULE_REFERENCE.md](docs/MODULE_REFERENCE.md)。

## 分支与提交

- 从最新的 `main` 创建短生命周期分支。
- 分支名建议使用 `fix/...`、`feat/...`、`docs/...` 或 `chore/...`。
- 一个提交只处理一个可回滚主题。
- 提交信息使用简短英文，例如 `Fix wrong book pagination`。
- 不提交 `node_modules`、`.expo`、`.env`、签名文件、API Key 或用户数据。

## 检查要求

提交 Pull Request 前至少运行：

```powershell
npm run check
```

涉及 Android 资源、打包、导航、数据库迁移或发布配置时运行：

```powershell
npm run check:release
```

只修改文档或脚本命令时，也至少运行：

```powershell
npm run docs:check
```

如果无法运行某项检查，请在 Pull Request 中说明原因和尚未覆盖的风险。

## Pull Request 要求

- 说明问题、解决方式和用户可见变化。
- 列出实际运行的检查及结果。
- 附带必要的截图或复现步骤。
- 标记数据库、存档、导航、原生权限或隐私影响。
- 确认没有提交敏感信息和无关生成文件。

使用仓库中的 Pull Request 模板提交。持续集成通过后，由维护者审核合并。

## 文档变化

- 文档中的“最后更新”必须精确到分钟。
- 命令、路径和引用必须真实存在。
- 用户可见行为变化应更新对应主文档，而不是新增重复状态页。
- 文档修改后运行 `npm run docs:check`。

## 许可证

提交贡献即表示你同意贡献内容按本项目的 [MIT License](LICENSE) 发布，并确认你有权提交相关代码、文档和资源。
