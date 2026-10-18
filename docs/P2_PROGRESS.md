# P2 个人资料页进度

最后更新：2026-10-18

## 当前状态

P2 个人资料名片页代码已实现，尚未提交，尚未通过真机验收。

交接时 Git：

- 分支：`main`
- HEAD：`cfbb36c Mark P1 archive foundation complete and start P2`
- P2 代码位于工作区未提交修改中

## 已实现内容

- “我的”页面“个人资料”入口可进入个人资料页
- 蓝色名片卡片布局
- 名片显示：
  - 头像
  - 用户名
  - 已学习天数
  - 已学习单词总数
  - 个人简介
- 用户名限制最多 8 个字符
- 用户名使用较小字号
- 头像尺寸已缩小
- 点击头像使用系统图片选择器选择图片
- 头像选择完成后进入系统原生 `1:1` 裁剪确认
- 点击用户名可修改用户名
- 点击个人简介可修改简介
- 点击相机按钮弹出菜单：
  - 更换名片背景
  - 保存名片图片
  - 取消
- 背景图片选择后进入系统原生 `2:3` 裁剪确认
- 背景图片保存到 `user_profile.background_data`
- 名片图片使用 `react-native-view-shot` 生成 PNG
- 名片图片保存使用 Android `StorageAccessFramework` 目录选择器
- 日历、书本 SVG 已保存到：
  - `assets/icons/calendar.svg`
  - `assets/icons/book.svg`
- 相机图标复用现有个人资料相机图标

## 数据库

数据库版本：v12。

`user_profile` 当前字段：

- `id`
- `display_name`
- `bio`
- `avatar_data`
- `background_data`
- `updated_at`

头像和背景使用 Base64 Data URI 保存，便于随 JSON 存档迁移。

## 本地存档

`user_profile` 已纳入存档，包含：

- 用户名
- 个人简介
- 头像
- 名片背景

通用设置继续通过 `app_settings` 保存。

## 依赖变化

当前保留：

- `expo-image-picker`
- `react-native-view-shot`

已移除：

- `expo-media-library`

移除原因：

- Expo Go 中缺少 `ExpoMediaLibraryNext` 原生模块
- Android 14/16 的 Expo Go 无法提供完整媒体库访问

## 名片图片保存说明

当前“保存名片图片”不会直接调用系统相册 API，而是：

1. 将名片视图截图到临时 PNG
2. 打开 Android 目录选择器
3. 用户选择 Pictures 等目录
4. App 将 PNG 写入所选目录

如果系统相册没有立即显示图片，可能需要等待媒体扫描或重新打开相册。

## 已知需要真机验收

- 个人资料页不再触发 `ExpoMediaLibraryNext` 模块错误
- 头像选择和裁剪
- 背景选择和裁剪
- 名片背景显示
- 用户名 8 字符限制
- 保存资料后重启 App 数据仍存在
- 保存名片 PNG 到 Pictures 目录
- 保存的 PNG 不包含相机按钮
- 存档导入导出后头像、背景、简介、用户名恢复

## 代码位置

- `src/app/settings/profile.tsx`
- `src/database/userProfileRepository.ts`
- `src/database/database.ts`
- `src/features/archive/archiveSnapshot.ts`
- `src/components/icons/ProfileStatIcons.tsx`
- `src/app/(tabs)/settings.tsx`
- `app.json`
- `package.json`
- `package-lock.json`
- `assets/icons/calendar.svg`
- `assets/icons/book.svg`

## 后续阶段

1. P2：完成真机验收
2. P3：关于页
3. P4：个人资料、关于页和本地存档联合验收
