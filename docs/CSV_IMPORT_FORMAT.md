# CSV 单词导入格式

## 文件要求

- 文件扩展名必须是 `.csv`。
- 文件编码使用 UTF-8。
- 第一行必须是列名。
- 每一行代表一个单词。

## 推荐列名

```csv
word,meaning,phonetic,example
```

兼容的中文列名：

| 英文列名 | 中文列名 |
|---|---|
| `word` | `单词` |
| `meaning` | `释义`、`中文释义` |
| `phonetic` | `音标` |
| `example` | `sentence`、`例句` |

## 示例

```csv
word,meaning,phonetic,example
abandon,放弃；抛弃,/əˈbændən/,They had to abandon the old plan.
benefit,好处；受益,/ˈbenɪfɪt/,Regular exercise can benefit your health.
```

## 当前校验规则

1. 缺少 `word`、`meaning` 或 `phonetic` 列时，整个文件拒绝导入。
2. 单词和释义不能为空。
3. 音标列必须存在，但单个单词的音标暂时允许留空。
4. 同一个 CSV 内单词重复时，后面的重复行会被拒绝。
5. 数据库内已存在同一个单词时，更新它的释义、音标和修改时间。
6. `example` 列可选，旧版三列 CSV 仍然兼容。
7. 新 CSV 的例句为空时，不覆盖数据库中的已有例句。
8. 新 CSV 的例句非空时，覆盖已有例句并标记来源为 CSV。
9. 有问题的行会被跳过并返回行号和原因，不影响其他合法行导入。
