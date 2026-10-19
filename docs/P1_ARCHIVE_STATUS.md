# P1 本地存档阶段状态

最后更新：2026-10-18

功能提交：`a0d77d3 Add local archive and user profile data`

## 结论

P1 本地存档基础已完成。

## 导出

- 使用 Android 系统目录选择器保存 JSON 存档
- 包含词库、例句、学习记录、错题本、学习完成记录
- 包含用户名 `user_profile`
- 包含全部通用设置 `app_settings`
- 不包含 DeepSeek API Key

## 导入

- 使用 Android 文件选择器读取存档
- 校验文件格式、存档版本和数据库版本
- 导入前显示单词、学习、错题和完成记录数量
- 在单个 SQLite 事务中整体替换数据
- 导入失败自动回滚

## 用户资料基础

- 数据库升级到 v10
- 新增 `user_profile` 表
- 默认用户名改为 `User`
- 已有“憔悴样”默认值自动迁移为 `User`
- 首页用户名从 SQLite 读取

## 我的页面

- 使用固定绿色头部和白色卷轴面板
- 本地存档使用用户提供的 SVG
- 原始 SVG 保存为 `assets/icons/settings-archive.svg`
- “更换头像”入口改为“个人资料”

## 后续

P2、P3、P4 均已完成。存档现已包含完整个人资料并兼容 P1 的 v10 存档，详见 `P4_PROGRESS.md`。
