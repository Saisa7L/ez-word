# P3 关于页进度

最后更新：2026-10-19

## 当前状态

P3 关于页已完成并通过真机验收。

## 已确认内容

- 软件正式名称：`易词通`
- 英文名：`Ez Word`
- 软件制作者：`憔悴样`
- 软件版本：`1.0.0`
- 构建号：`1`
- 检查更新：现阶段只显示入口，不实现联网
- GitHub 地址：暂用占位地址
- 问题反馈：暂用 GitHub Issues 占位地址
- 隐私说明：加入
- 开源许可证和版权信息：不加入

## 已实现内容

- “我的”页面“关于”入口可进入关于页
- 页面展示中英文软件名和一句话简介
- 软件版本从 Expo 配置读取，显示为 `1.0.0 (Build 1)`
- “检查更新”显示“暂未开放”
- GitHub 仓库和问题反馈显示占位地址
- 占位地址不可点击；后续填写真实地址后会自动变成可打开链接
- 软件制作者显示为“憔悴样”
- 增加“数据与隐私”说明
- `app.json` 软件名称改为“易词通”
- `app.json` Android 构建号设为 `1`

## 占位地址

- GitHub：`https://github.com/your-account/ez-word`
- 问题反馈：`https://github.com/your-account/ez-word/issues`

后续建立仓库后，修改 `src/constants/appInfo.ts` 中的地址即可。

## 隐私说明口径

- 本版本不连接自建服务器
- 词库、学习记录、错题本、个人资料和设置保存在本机
- 使用 DeepSeek 生成或测试例句时，相关单词内容会发送到 DeepSeek
- DeepSeek API Key 保存在本机安全存储中

## 自动验收

- `npm run typecheck` 通过
- `npm run lint` 通过
- `npx expo config --type public` 通过，名称为“易词通”，构建号为 1
- Android 离线导出通过

## 真机验收结果

验收结论：通过。

- “我的”页面“关于”入口可正常进入
- 中英文名称、版本号和构建号显示正确
- “检查更新”显示“暂未开放”
- GitHub 和问题反馈占位地址完整显示且不会跳转
- 软件制作者显示“憔悴样”
- 隐私说明排版和滚动正常
- 返回按钮可回到“我的”页面

## 代码位置

- `src/app/settings/about.tsx`
- `src/constants/appInfo.ts`
- `src/app/(tabs)/settings.tsx`
- `app.json`

## 后续阶段

1. P4：个人资料、关于页和本地存档联合验收
