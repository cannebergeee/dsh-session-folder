# dsh-session-folder

> 给 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai) 的界面补上「本地路径」直通车：
> **右键会话行**打开项目目录，**右键对话里的文件名**打开 / 在资源管理器中定位 / 复制绝对或相对路径，
> **右键对话里的网址**用默认浏览器打开或复制链接，**右键工作区行**打开工作区目录；
> 另有 **分叉树视图**，按 fork 关系在侧边栏查看会话层级。

English: [README.en.md](README.en.md)

> 插件面板里的显示名：**右键增强**（English: Right-click Enhancements）。

> 已在 DeepSeek Harness 官方仓库的 **Show Your Plugins!** 讨论区发布：
> <https://github.com/deepseek-ai/deepseek-harness/discussions/10617>
>
> 最新 Release（v1.9.5，含 tgz）：<https://github.com/cannebergeee/dsh-session-folder/releases/tag/v1.9.5>

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
| ─── | 分隔线 |
| 复制绝对路径 | 复制文件绝对路径，顶部提示「已复制绝对路径」 |
| 复制相对路径 | 复制相对项目目录的路径；文件不在项目内时为绝对路径 |

键盘可用：`↑`/`↓` 移动、`Enter`/`Space` 执行、`Esc` 关闭；点外部、滚动、窗口失焦都会收起；菜单自动避让视口边缘。

### 3. 对话里的网址：右键菜单

**右键对话里的 http(s) 链接**（Markdown 链接）：

| 菜单行 | 行为 |
|---|---|
| 默认浏览器打开 | 交给桌面端的系统浏览器打开（`window.open` → 桌面壳的 window-open 策略 `shell.openExternal`） |
| 复制链接 | 复制解析后的绝对 URL |

菜单行的样式、键盘与关闭行为与文件菜单完全一致。

**用户消息里的引用也支持**：消息气泡中的 `@文件` / `@文件夹` 引用（宿主的 `ReferenceChip`，`title` 保留原始拼写 `@path`）同样能右键——去掉 `@` 与引号后按项目目录补全；文件夹引用给的是「在资源管理器中打开」。输入框里尚未发送的引用不处理（限定在已渲染的对话节点内）。

> 注意：用户消息的正文是纯文本渲染（宿主 `UserTextRun` = `<span>{text}</span>`，不做 Markdown/链接解析），所以用户手打的网址目前没有可右键的链接元素；助手消息里的 Markdown 链接才走「网址右键」。

**图片链接（`.png` 等）也支持**：助手消息里指向图片的 Markdown 链接，宿主为了内联预览会把 `title` 去掉，DOM 里只剩链接文字。因此这类链接的**真实目标从链接组件自身的 React props 里取**（该组件以 `{ file: { path } }` 构建，`file.path` 就是 markdown 里的原始目标），不依赖可见文字——`[看这里](shots/castle_launch1.png)` 这类标签与路径不同名的写法也能打开正确文件；只有当 props 取不到时才退回"标签像文件名"的猜测。

### 4. 工作区行：右键打开工作区目录

**右键工作区行** → 「在资源管理器中打开」，打开该工作区注册的目录。

> 工作区行的「…」菜单在宿主侧没有插件槽位（只有会话行的菜单槽），所以这一项目前挂在**右键**上；重命名 / 删除工作区仍走「…」。工作区目录来自根作用域的 workspace 快照（经 `useWorkspaces` 镜像为 id → 目录映射），因此重命名、新建、删除都自动跟随。

### 5. 分叉树视图：按 fork 关系看会话层级

**侧边栏「工作区」标题栏右侧的 ⑂ 图标**、**直接点击「工作区」文字**，或**会话 `…` 菜单里的「分叉树视图」** → 一个覆盖侧边栏 workspace 浏览区的树视图打开：

- **入口**：侧边栏「工作区」标题栏里的 28px **纯图标 ⑂**（不占宿主布局），位置按宿主图标组实测（左侧 8px、垂直中心对齐），**宿主搜索框展开时自动隐藏**；同时「工作区」文字本身也是可点击区域（方案 A 宽松胶囊：文字四周 3px × 9px、圆角 8，插件在其上覆盖透明按钮，不改宿主 DOM）。树打开后，点面板标题「分叉树」或右上角文件夹图标切回列表。
- **标题样式**：树面板标题沿用宿主「工作区」`sectionLabel` 的样式（14px / 400 / `--dsw-alias-label-tertiary`、line-height 20px），不带额外说明文字；右上角是**宿主同款 16px / 1px 描边文件夹图标**（关闭回列表）。
- **树行操作**：悬停行显示宿主风格的 `…` / 归档 / 置顶按钮；`…` 菜单按宿主顺序提供置顶、重命名、创建分叉、归档、在资源管理器中打开、分叉树视图、复制 Session ID（重命名带宿主快捷键提示，并弹出插件自己的输入框调用宿主 `session.rename`）；右键树行打开同一菜单；**右键工作区分组标题**也可“在资源管理器中打开”该工作区目录。归档运行中的会话会先确认“停止活动并归档”。置顶会排到同级最前。
- **标题显示**：静止态操作按钮不占宽度，标题拿到整行宽度；hover 时按宿主方式裁切/渐隐，并在指针停留标题上时缓慢横向滚动显示完整标题（`title` tooltip 同时保留）；横向滚动期间右键菜单不会被内部 scroll 事件误关。
- **拖拽调整层级**：把会话拖到另一行 → 成为它的子会话；拖到工作区分组标题 → 成为一级会话；循环与跨 workspace 的拖放会被拒绝，结果持久化。**只调整树视图层级，不改宿主 session header 里的真实 `parentSession`**（宿主没有写 API）；右键“恢复真实 fork 层级”可清除覆盖。
- **Workspace 分组**：每个工作区一节；会话按 fork 关系嵌套：父会话在前，分叉出的子会话缩进显示，孙级继续嵌套，带竖向连接线。
- **折叠**：带子节点的行有 chevron，可逐级展开 / 收起；工作区分组也可整体折叠；折叠状态记在 `localStorage`（`dsh-session-folder.fork-tree.collapsed.v1`），刷新后保持。
- **状态**：每行左侧与宿主原版一致 —— **运行中**是 14px 的旋转环（半透明 track + 呼吸 arc），等待确认为琥珀点、完成未读为绿点、空闲为灰点；状态来自 `useSessionStatus`，会实时刷新（不是静态图标）。
- **筛选**：顶部输入框按标题过滤，命中节点会自动带出其祖先（而不是只显示孤立结果）。
- **点击打开**：点树中任意节点，用 `ctx.uiWorkspace.openSession` 在主视图打开该会话；树保持打开，方便连续跳转。
- **关闭 / 切换**：点面板标题「分叉树」、右上角**文件夹图标**、`Esc`，或再点一次「工作区」栏的 ⑂ 图标，回到宿主原列表。

> 这是**独立的树视图**，不是把宿主行改造成树：宿主会话行没有行内容/排序/折叠插槽，所以默认按「最近更新」排序、无法稳定嵌套。树视图只替换侧边栏的 **workspace 浏览区**，顶部的品牌 / 新会话与 header 的入口保持可用；打开期间宿主的搜索/分组暂时被覆盖，关闭后原样恢复。入口图标是插件画在「工作区」标题栏上的 overlay 按钮（宿主没有该 header 的插件槽），不改宿主源码。

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
- **打开 / 定位**：全部走宿主 `session.openWorkspacePath` Remote。宿主会先用组合文件系统校验路径，再交给桌面端：默认打开或 `action: 'reveal'` 定位。
- **复制**：`navigator.clipboard.writeText`。
- **网址右键**：对话里的 http(s) 链接是普通 `<a href target="_blank">`；「默认浏览器打开」用 `window.open(url, '_blank', 'noopener,noreferrer')`——桌面壳把新窗口一律 deny 并转成 `shell.openExternal`，所以落到系统默认浏览器；纯浏览器部署则是新标签页。
- **样式**：完全对齐宿主菜单与 toast 的 token（`--dsw-menu-surface-fill` + `--dsw-menu-backdrop-filter` 半透明材质、`--dsw-elevation-prominent`、`--dsw-radius-lg`、`--dsw-alias-menu-icon`、`--dsw-alias-toast-bg`、`--dsw-shadow-lv3` 等），亮/暗主题都跟随；未引入 `dsh-client-ui-primitives`，控件是本插件自己的 `role="menuitem"` 按钮。
- **分叉树**：数据来自根作用域标准 props 的 `useSessions` / `useWorkspaces` / `useSessionStatus`（`SessionListState` 的 `byId[id].parentId` + workspace 快照的 `items/archivedSessionIds` + 实时状态 map），在插件内按 `parentId` 组装父子关系；树面板是一个 `shell.overlay` 条目，用 `position: fixed` 精确覆盖 `[data-slot="sidebar.workspaces"]` 的可视区域；入口图标是同一 overlay 条目在「工作区」标题栏位置画的 26px 图标按钮（关闭态）：先量宿主该行图标组的最左边界，再放在其左侧 8px，避免与搜索/排序/新建图标重叠；打开后换成树面板；两者都用 `ResizeObserver` 跟随侧栏宽度/折叠变化。树的样式只用 `--dsw-*` token；打开会话复用宿主既有的 `ctx.uiWorkspace.openSession`（与官方 chat 包同一用法），不自行导航。

---

## 兼容性

- DSH `0.2.1-rc` 系列（依赖 `sidebar.workspaces.session.menu.item` / `shell.overlay` 槽位、`session.openWorkspacePath` Remote，以及 `ctx.sessions` / `ctx.uiWorkspace` 服务）。
- 需要「能把路径交给本机桌面」的部署：DSH Desktop，或本机运行的 Web 版；纯远程/无桌面环境下打开类操作会失败并给出提示。
- 不占用模型上下文：这是纯浏览器界面插件，不注册工具、不写会话。

## 已知限制

- **会话右键的菜单位置**沿用宿主菜单的锚点，弹在 `…` 按钮处，而不是鼠标坐标（宿主 `Menu` 只支持 anchor 定位）。
- **文件 chip 的路径来源是宿主实现细节**：`title` 属性若在未来 DSH 版本中改变，文件右键会静默失效；会话右键与 `…` 菜单行不受影响。
- 空白「新会话」行没有 `rowActions`，右键不做任何事。
- **分叉树是独立视图**：打开时覆盖侧边栏 workspace 浏览区（宿主搜索/分组暂时不可见），关闭后恢复；不把宿主会话行改成可折叠树。树只显示普通会话（排除 subagent、空白与归档），按 `updatedAt` 排序，不显示置顶/归档状态。入口图标用 `position:fixed` 叠加在宿主「工作区」标题栏上（宿主无 header 槽位），若宿主调整该栏布局，图标位置可能需要复核；打开状态不持久（每次启动默认关闭），折叠状态持久。

## 目录结构

| 文件 | 作用 |
|---|---|
| `index.js` | Host 半边：空 `apply`，仅为承载 `dsh.client` 声明的 Loader 行 |
| `client.js` | 浏览器半边：会话菜单行、文件右键菜单、提示条、分叉树视图 |
| `cordis.patch.yml` | 插入 `session-folder` 行 |
| `locale/{en,zh}.json` | 插件面板里显示的标题与描述 |
| `icon.svg` | 插件图标 |

## 版本记录

见 [CHANGELOG.md](CHANGELOG.md)。

## License

[BSD-3-Clause](LICENSE)
