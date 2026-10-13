# Git 基础操作

## 最基础 5 个命令

在 VS Code 终端执行，当前目录应为：

```text
F:\English vocabulary app\Project\vocab-app
```

### 1. 查看当前状态

```powershell
git status --short --branch
```

看到 `working tree clean` 表示没有未保存的代码修改。

### 2. 查看具体改了什么

```powershell
git diff
```

红色 `-` 是删除内容，绿色 `+` 是新增内容。

### 3. 把修改加入待提交区

```powershell
git add .
```

执行后通常没有输出，属于正常现象。

### 4. 保存一个版本

```powershell
git commit -m "说明这次修改"
```

输出中会显示本次提交的编号和修改文件。

### 5. 查看提交历史

```powershell
git log --oneline --decorate -10
```

每行对应一个历史版本，最上面一行是最新版本。

## 回滚代码

### 放弃还没有提交的单个文件修改

```powershell
git restore -- '文件路径'
```

这会恢复文件到上一次提交的状态。

### 取消已经执行过 `git add .` 的文件

```powershell
git restore --staged .
```

文件修改仍然保留，只是不再处于待提交状态。

### 撤销某次已经提交的修改

```powershell
git revert 提交编号
```

Git 会创建一个新的反向提交，比直接删除历史更安全。

## 当前备份限制

目前只使用本地 Git，可以防止代码改错，但不能防止硬盘损坏。后续如果担心电脑故障，需要再建立 GitHub 私有仓库或其他外部备份。
