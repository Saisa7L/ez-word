# 性能预算

最后更新：2026-10-20 22:10

## 自动预算

性能预算脚本：

```powershell
npx expo export --platform android --output-dir .expo/check
npm run perf:budget
```

完整发版前检查：

```powershell
npm run check:release
```

| 指标 | 当前基线 | 失败阈值 |
|---|---:|---:|
| Android HBC | 5,703,318 B（5,569.6 KB） | 6 MB |
| 资源总量 | 775,027 B（756.9 KB） | 1 MB |
| 单资源最大值 | `assets/app/icon.png` 364,301 B | 512 KB |
| 资源文件数 | 18 | 24 |

CI 会先执行 `expo export`，再运行 `npm run perf:budget`。任一指标超过预算即失败。

## 固定性能约束

- 首页查询继续依赖 `idx_sessions_study_date`。
- 任务选词使用 `idx_words_active_status_word`。
- 单词复习和错题时间排序继续使用现有索引。
- 输入框答案保存在页面局部状态，不写入全局任务 Context。
- 页面图片优先使用压缩 PNG，加载前检查尺寸和体积。
- 不为一次性需求引入大型运行时依赖。

## 仍需真机采集

当前环境没有 Android Studio/Perfetto 或 adb，以下指标需要在后续构建 APK 时单独采集：

- 冷启动到首页可交互时间。
- 首页 SQLite 统计查询耗时。
- 填空和听力逐键输入帧率。
- 长列表滚动掉帧和内存峰值。
- 存档导入、CSV 导入和 AI 批量写库耗时。
- 最终 APK/AAB 体积。

建议预算：

- 首页首屏可交互：小于 1.5 秒。
- 任务输入按键响应：无持续掉帧，P95 小于 50ms。
- 普通列表滚动：稳定 55 FPS 以上。
- 20 MB 存档导入：有明确进度和可取消反馈。
