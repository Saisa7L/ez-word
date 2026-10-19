# P2 个人资料页进度

最后更新：2026-10-18

## 当前状态

P2 已完成并通过真机验收。

交接时 Git：

- 分支：`main`
- P2 功能提交以 `git log -1` 为准
- 以新聊天中实际的 `git status --short --branch` 和 `git log -1` 为准

## 已实现内容

- “我的”页面“个人资料”入口可进入个人资料页
- 名片背景默认为透明，选择背景后直接显示原图
- 名片显示：
  - 头像
  - 用户名
  - 已学习天数
  - 已学习单词总数
  - 个人简介
- 用户名限制最多 10 个字符，每行固定展示最多 5 个字符
- 头像使用圆形裁切预览，完整填满头像区域
- 头像区域带 1px 黑色描边
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
- 名片下方提供“更改名片字符颜色”入口
- 字体颜色使用全彩调色盘选择，支持饱和度和明度面板、色相条拖动
- 字符颜色同时作用于用户名、统计文字、简介、SVG 图标和相机图标
- 字符颜色保存到 `user_profile.card_content_color`
- 名片内所有文字默认使用白色填充、黑色 2px 描边
- 名片下方提供“调整文字描边”入口，可修改描边颜色和 0-5px 大小
- 描边颜色同样使用全彩调色盘，不使用预设色块按钮
- 描边颜色保存到 `user_profile.text_stroke_color`
- 描边大小保存到 `user_profile.text_stroke_width`
- “我的”页和首页头像会在资料保存后同步刷新
- 名片图片使用 `react-native-view-shot` 生成 PNG
- 名片图片保存使用 Android `StorageAccessFramework` 目录选择器
- 日历、书本 SVG 已保存到：
  - `assets/icons/calendar.svg`
  - `assets/icons/book.svg`
- 相机图标复用现有个人资料相机图标

## 数据库

数据库版本：v14。

`user_profile` 当前字段：

- `id`
- `display_name`
- `bio`
- `avatar_data`
- `background_data`
- `card_content_color`
- `text_stroke_color`
- `text_stroke_width`
- `updated_at`

头像和背景使用 Base64 Data URI 保存，便于随 JSON 存档迁移。

## 本地存档

`user_profile` 已纳入存档，包含：

- 用户名
- 个人简介
- 头像
- 名片背景
- 名片字符颜色
- 描边颜色
- 描边大小

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

## 真机验收结果

验收结论：通过。

- 个人资料页不再触发 `ExpoMediaLibraryNext` 模块错误
- 头像选择和裁剪通过
- 背景选择和裁剪通过
- 名片背景显示通过
- 用户名 10 字符限制和每行 5 字符换行通过
- 名片透明背景和背景照片显示通过
- 名片字符颜色切换，包括文字和 SVG 通过
- 字体颜色和描边颜色的全彩调色盘拖动选区通过
- 白色文字和可调黑色描边显示通过
- 描边颜色和 0-5px 大小切换通过
- 头像圆形填充及 1px 黑色描边通过
- “我的”页和首页头像同步通过
- 保存资料后重启 App 数据仍存在
- 保存名片 PNG 到 Pictures 目录通过
- 保存的 PNG 不包含相机按钮
- 存档导入导出后头像、背景、简介、用户名恢复通过

## 已完成的自动验收

验收日期：2026-10-18

- `npm run typecheck` 通过
- `npm run lint` 通过
- `npx expo install --check` 通过，依赖版本与 Expo SDK 57 匹配
- `npx expo-doctor` 通过，21/21 项检查无问题
- Android 离线导出通过，入口与 42 个资源均可打包
- 使用真实 SQLite 执行 v12 -> v14 和 v13 -> v14 升级通过，旧用户名会截断到 10 个字符，已有资料保留
- 旧版深色默认字色会升级为白色，自定义字色保持不变
- 个人资料读写通过，用户名限制、简介去空格、头像、背景、字色、描边颜色和描边大小均正确持久化
- 描边大小限制在 0-5px
- 存档导出、解析和恢复通过，头像、背景、简介、字色、描边、用户名和词库数据均可恢复
- v12、v13 存档缺少新版字段时可自动使用白色填充、黑色 2px 描边
- v10 -> v12 升级合并为单个事务，避免升级中途留下半完成表结构
- 名片截图改为在成功或失败时都释放临时文件
- 调色盘拖动改用窗口坐标，不再依赖可能为空的 `nativeEvent.locationX`

手机上的相机/相册权限、系统裁剪、目录选择器、截图视觉结果和重启 App 后的实际表现均已通过验收。

## 代码位置

- `src/app/settings/profile.tsx`
- `src/components/OutlinedText.tsx`
- `src/components/ColorPalette.tsx`
- `src/constants/profile.ts`
- `src/database/userProfileRepository.ts`
- `src/database/database.ts`
- `src/features/archive/archiveSnapshot.ts`
- `src/components/icons/ProfileStatIcons.tsx`
- `src/app/(tabs)/index.tsx`
- `src/app/(tabs)/settings.tsx`
- `app.json`
- `package.json`
- `package-lock.json`
- `assets/icons/calendar.svg`
- `assets/icons/book.svg`

## 后续阶段

1. P3 关于页已完成
2. P4 联合验收已完成
