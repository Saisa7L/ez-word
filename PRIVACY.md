# 隐私与数据处理

最后更新：2026-10-22 20:36

易词通采用本地优先设计。当前版本不要求账号登录，不连接自建服务器，也不包含遥测、广告或用户行为分析。

只有用户主动检查更新或下载更新时，App 才访问 GitHub、GitHub Raw 和 `ghproxy.net` 镜像。

## 保存在本机的数据

以下数据保存在 Android 应用私有目录中的 `vocabulary.db`：

- 用户导入的单词、释义、音标和例句。
- 学习状态、学习记录、错题和错题来源。
- 每日任务、复习、AI 和主题设置。
- 用户名、简介、头像、名片背景和文字样式。

用户主动导出的 JSON 存档会写入用户通过系统文件选择器指定的位置。存档包含业务数据，不包含 DeepSeek API Key。

## API Key

- DeepSeek API Key 由用户主动填写。
- API Key 使用 Android SecureStore 保存，不写入 SQLite、存档或项目源码。
- 用户可以在 AI 设置页清除 API Key。
- 日志和诊断文本会对 API Key、Authorization、password、secret 和 token 进行脱敏。
- 卸载 App 或清除应用数据通常会一并删除 SecureStore 中的 Key，具体行为以 Android 系统为准。

## DeepSeek 网络请求

只有用户主动测试连接或生成单词数据时，App 才会访问 `https://api.deepseek.com`。

- 连接测试会发送固定测试文本，不包含用户词库或个人资料。
- 生成音标和例句时，每批最多发送 10 个单词及其释义、现有音标。
- 请求会通过 Authorization 请求头携带用户填写的 API Key。
- 用户头像、个人简介、学习记录、错题本、主题和其他本地数据不会发送给 DeepSeek。

DeepSeek 对请求数据的处理受其自身服务条款和隐私政策约束。是否使用该功能由用户自行决定。

## 权限与文件访问

- 相册权限只在用户主动选择头像或名片背景时使用。
- CSV、存档导入和名片导出通过 Android 系统文件选择器完成。
- App 不申请相机或麦克风权限。
- App 不自动上传本地文件，也不会建立后台同步连接。
- App 使用 `REQUEST_INSTALL_PACKAGES` 权限打开 Android 系统安装器；用户仍需在系统中明确确认覆盖安装。

## 更新检查与下载

- 更新检查只读取公开版本清单和 GitHub Release 元数据，不上传本地数据。
- 国内镜像使用 `ghproxy.net` 转发 GitHub Raw 和 Release 下载；第三方镜像可能看到常规网络请求元数据。
- 下载的 APK 只用于校验大小和可选 MD5，然后交给 Android 系统安装器。
- Android 系统会继续校验新 APK 的包名和签名，镜像不能通过覆盖安装替换为不同签名的应用。
- 检查更新失败时只提示用户自行访问 GitHub Releases。

## 数据安全边界

- SQLite 数据库没有额外实现应用层加密，主要依赖 Android 应用沙箱隔离。
- 已 root 的设备、调试环境、系统备份或设备控制软件可能突破默认沙箱边界。
- 用户导出的 JSON 存档可能包含词库、学习记录和个人资料，应存放在可信位置。
- 公开分享问题前，请删除截图、日志和存档中的个人信息。

## 删除数据

- 可以在 App 内清除当前词库，历史学习记录和错题是否保留取决于页面提供的操作。
- 可以导出存档后再导入或覆盖现有数据。
- 卸载 App 或清除 Android 应用数据会删除应用私有目录中的数据。
- DeepSeek 服务端的数据处理不受本项目控制，需参考 DeepSeek 的服务条款。

## 变更与联系

隐私说明发生实质变化时会随发布记录更新。一般隐私问题请通过 [GitHub Issues](https://github.com/Saisa7L/ez-word/issues) 联系。安全漏洞请按 [SECURITY.md](SECURITY.md) 私下报告。
