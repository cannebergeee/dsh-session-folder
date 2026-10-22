# dsh-session-folder

> 给 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai) 的界面补上「本地路径」直通车：
> **右键会话行**打开项目目录，**右键对话里的文件名**打开 / 在资源管理器中定位 / 用 VS Code 打开 / 复制绝对或相对路径。

English: [README.en.md](README.en.md)

---

## 功能

### 1. 会话：打开项目目录

**右键会话列表里的任意会话行**（或照旧点行尾的 `…`）→ 弹出该会话自己的操作菜单 → **「在资源管理器中打开」**（位于「归档会话」之后、「复制 Session ID」之前）。

右键触发的是**同一份宿主菜单**（只是多了一种打开方式），所以置顶 / 重命名 / 分叉 / 归档 / 复制 Session ID 全都在，不会出现两份不一致的菜单。

打开的目标是该会话 summary 的 `cwd`，也就是它所属工作区的目录。

### 2. 对话里的文件名：右键菜单

在对话正文里**右键文件名**（助手消息里带图标、可点击的文件 chip，或指向文件的 Markdown 链接）：

| 菜单行 | 行为 |
|---|---|
| 打开 | 用系统默认程序打开该文件 |
| 资源管理器 | 在资源管理器中定位并选中该文件 |
| VS Code | 用 VS Code 打开该文件（仅在桌面端确实把 VS Code 注册为该类型处理程序时出现） |
| ─── | 分隔线 |
| 复制绝对路径 | 复制文件绝对路径，顶部提示「已复制绝对路径」 |
| 复制相对路径 | 复制相对项目目录的路径；文件不在项目内时为绝对路径 |

键盘可用：`↑`/`↓` 移动、`Enter`/`Space` 执行、`Esc` 关闭；点外部、滚动、窗口失焦都会收起；菜单自动避让视口边缘。

---

## 安装

本包是一个 DSH bundle（`dsh.bundle` + `dsh.client`），**无需构建**：仓库直接提交了可运行的 `client.js` / `index.js`。

### A. 插件面板（推荐）

DSH → 设置 → 插件 → 安装 → **GitHub** → 填 `cannebergeee/dsh-session-folder` → 启用。

### B. 命令行

```bash
# 1) 作为依赖装进 profile
dsh plugin --profile <profile> add github:cannebergeee/dsh-session-folder

# 2) 在该 profile 的 package.json 里把它加入 bundles
#    "dsh": { "profile": { "bundles": [ "...", "@dsh-external/dsh-session-folder" ] } }

# 3) 重启 DSH
```

> 没装 git / 不方便走 GitHub 依赖时，可从 [Releases](https://github.com/cannebergeee/dsh-session-folder/releases) 下载打包好的 `.tgz`，解压到 `<profile>/node_modules/@dsh-external/dsh-session-folder` 后按 B 的第 2、3 步启用。

### C. 本地开发（不经过 GitHub）

```bash
dsh plugin --profile <profile> add link:/absolute/path/to/dsh-session-folder
# 同样把 "@dsh-external/dsh-session-folder" 加入 profile package.json 的 dsh.profile.bundles
```

### 卸载

设置 → 插件 → 停用 / 移除；或 `dsh plugin --profile <profile> remove @dsh-external/dsh-session-folder` 并从 `dsh.profile.bundles` 删掉这一行。

---

## 工作原理

插件只有很薄的一层逻辑，重活全部复用宿主已有能力：

- **会话目录**：浏览器侧 `ctx.sessions.list` 的 `SessionSummary.cwd`（点击时才读，不 retain 会话、不加载历史）。
- **会话右键**：页面级 `contextmenu` 监听命中会话行的 `data-row-key="session:<id>"` 后，激活该行动作区第一个按钮（即 `…` 触发器）——等价于左键点 `…`，菜单归属、定位、键盘行为都沿用宿主；`rowActions` 自带 `stopPropagation`，因此不会误选中/打开会话。
- **文件名 → 路径**：对话里的文件 chip 与文件链接由 Chat 原语渲染成 `button.fileMention`，其 `title` 属性就是该文件的路径（宿主 `producedFileMentions` 返回 `{ title: path }`，文件链接同理）；相对路径再按主视图会话的 `cwd` 拼成绝对路径。
- **打开 / 定位 / VS Code**：全部走宿主 `session.openWorkspacePath` Remote。宿主会先用组合文件系统校验路径，再交给桌面端：默认打开、`action: 'reveal'` 定位，或用 `application` 指定**已注册的**处理程序 id。
- **VS Code 行**：`session.workspacePathApplications` 查询该文件在本机注册的处理程序（Windows 走 Shell 的 `SHAssocEnumHandlers`），名字或句柄匹配 VS Code 时才显示——没有注册就不显示，不伪造可用性。
- **复制**：`navigator.clipboard.writeText`。
- **样式**：完全对齐宿主菜单与 toast 的 token（`--dsw-menu-surface-fill` + `--dsw-menu-backdrop-filter` 半透明材质、`--dsw-elevation-prominent`、`--dsw-radius-lg`、`--dsw-alias-menu-icon`、`--dsw-alias-toast-bg`、`--dsw-shadow-lv3` 等），亮/暗主题都跟随；未引入 `dsh-client-ui-primitives`，控件是本插件自己的 `role="menuitem"` 按钮。

---

## 兼容性

- DSH `0.2.1-rc` 系列（依赖 `sidebar.workspaces.session.menu.item` 槽位与 `session.openWorkspacePath` / `session.workspacePathApplications` Remote）。
- 需要「能把路径交给本机桌面」的部署：DSH Desktop，或本机运行的 Web 版；纯远程/无桌面环境下打开类操作会失败并给出提示。
- 不占用模型上下文：这是纯浏览器界面插件，不注册工具、不写会话。

## 已知限制

- **会话右键的菜单位置**沿用宿主菜单的锚点，弹在 `…` 按钮处，而不是鼠标坐标（宿主 `Menu` 只支持 anchor 定位）。
- **VS Code 行依赖系统文件关联**：Windows 未把 VS Code 注册为该扩展名处理程序时不会出现该行（可在 Windows「打开方式」里关联后再试，关联结果由系统缓存，必要时重启 DSH）。
- **文件 chip 的路径来源是宿主实现细节**：`title` 属性若在未来 DSH 版本中改变，文件右键会静默失效；会话右键与 `…` 菜单行不受影响。
- 空白「新会话」行没有 `rowActions`，右键不做任何事。

## 目录结构

| 文件 | 作用 |
|---|---|
| `index.js` | Host 半边：空 `apply`，仅为承载 `dsh.client` 声明的 Loader 行 |
| `client.js` | 浏览器半边：会话菜单行、文件右键菜单、提示条 |
| `cordis.patch.yml` | 插入 `session-folder` 行 |
| `locale/{en,zh}.json` | 插件面板里显示的标题与描述 |
| `icon.svg` | 插件图标 |

## 版本记录

见 [CHANGELOG.md](CHANGELOG.md)。

## License

[BSD-3-Clause](LICENSE)
