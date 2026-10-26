# dsh-session-folder

> Local-path shortcuts for the [DeepSeek Harness (DSH)](https://github.com/deepseek-ai) UI:
> **right-click a Session row** to open its project folder, **right-click a file name in the conversation**
> to open it, reveal it in the file manager, or copy its absolute / relative path,
> **right-click an http(s) link** to open it in the default browser or copy it, and **right-click a workspace
> row** to open that workspace's directory. There is also a **fork-tree view** that browses Sessions by fork
> lineage in the sidebar.

中文说明: [README.md](README.md)

> Plugins panel name: **Right-click Enhancements** (中文：右键增强).

> Announced in the DeepSeek Harness **Show Your Plugins!** discussion:
> <https://github.com/deepseek-ai/deepseek-harness/discussions/10617>
>
> Latest release (v1.9.3, with a packed tgz):
> <https://github.com/cannebergeee/dsh-session-folder/releases/tag/v1.9.3>

---

## What you get

### 1. Session row → open the project folder

**Right-click any Session row** (or click the row's `…` as before) → that Session's own menu opens →
**“Open in File Explorer”**, placed after *Archive session* and before *Copy Session ID*.

Right-click opens the **same host menu**, just through an extra trigger, so pin / rename / fork / archive /
copy Session ID are all there — no second, drifting copy of the menu.

The target is the Session summary's `cwd`, i.e. the directory of the workspace that Session belongs to.

### 2. File name → context menu

**Right-click a file name in the conversation** (a clickable file chip in an assistant message, or a Markdown
link that points at a file):

| Row | Behavior |
|---|---|
| Open | Open the file with the OS default application |
| File Explorer | Reveal the file in the file manager (selected) |
| ─── | separator |
| Copy absolute path | Copy the absolute path, with a success notice |
| Copy relative path | Copy the path relative to the project folder (absolute when outside it) |

Keyboard: `↑`/`↓` to move, `Enter`/`Space` to run, `Esc` to dismiss; outside click, scroll, or window blur
closes it; the menu clamps itself into the viewport.

### 3. Web link → context menu

**Right-click an http(s) link in the conversation** (a Markdown link):

| Row | Behavior |
|---|---|
| Open in default browser | Hand the URL to the desktop's system browser (`window.open` → the shell's window-open policy calls `shell.openExternal`) |
| Copy link | Copy the resolved absolute URL |

The link menu shares the file menu's surface, keyboard handling, and dismissal.

**User-message references work too**: an `@file` / `@folder` reference in a user bubble (the host's
`ReferenceChip`, whose `title` keeps the raw `@path` spelling) opens the same menus — the `@` and the
grammar's quotes are stripped and the path is resolved against the project folder; a folder reference gets
“Open in File Explorer”. Pending references in the composer are left alone (the chip must be inside a
rendered chat node).

> Note: user-message text is plain (`UserTextRun` renders `<span>{text}</span>`, no Markdown or link
> parsing), so a URL typed by the user is not an anchor and has no link menu today. Only Markdown links in
> assistant messages go through the link menu.

**Image links (`.png` and friends) work too**: the host drops `title` from a Markdown link that points at
an image so it can show the inline preview, leaving only the link text in the DOM. The **exact target is read
from the link component's own React props** (it is built from `{ file: { path } }`, and `file.path` is the
target as written in the markdown), so a link whose label differs from its path still opens the right file;
only when those props are unavailable does the plugin fall back to a label that looks like a file name.

### 4. Workspace row → open the workspace folder

**Right-click a workspace row** → **Open in File Explorer**, opening the directory that workspace is registered on.

> The workspace row's `…` menu has no plugin slot on the host side (only the Session menu does), so this
> action lives on right-click; rename / delete workspace stay on `…`. The directory comes from the
> root-scope workspace snapshot (mirrored through `useWorkspaces` into an id → directory map), so renames,
> additions, and deletions are followed automatically.

### 5. Fork-tree view: Sessions by fork lineage

The **⑂ icon at the right of the sidebar's “Workspaces” header row**, **clicking the “Workspaces” label itself**,
or **“Fork tree view”** in a Session's `…` menu, opens a tree that covers the sidebar's workspace browser:

- **Entry**: a 28px **⑂ icon** in the sidebar's “Workspaces” header row (no host layout space), positioned from
  the measured host icon cluster — 8px to its left and vertically centered — and **hidden while the host search
  box is expanded**. The “Workspaces” label itself is also a click target (plan A: a roomier pill with 3px × 9px
  padding and an 8px radius; a transparent plugin overlay, with no host DOM change). While the tree is open,
  clicking the panel title or the folder icon switches back to the list.
- **Title style**: the panel title reuses the host “Workspaces” `sectionLabel` style (14px / 400 /
  `--dsw-alias-label-tertiary`, line-height 20px) with no extra hint copy; the top-right control uses the host's
  exact **16px / 1px-stroke closed-folder artwork** (closes back to the list).
- **Row actions**: hovering a row shows the host-style `…` / archive / pin buttons. The `…` menu offers pin,
  fork, archive, copy Session ID, open in File Explorer, and “Restore real fork lineage”; right-clicking a row
  opens the same menu. Archiving a running Session asks to stop activity first. Pinned Sessions sort first at
  their level.
- **Drag to re-nest**: drop a Session on another row to make it that row's child; drop it on a Workspace group
  header to make it a root Session. Cycles and cross-Workspace drops are rejected and the result is persisted.
  **This changes the plugin tree's display hierarchy only** — the host session header's `parentSession` is
  read-only and has no mutation API; use “Restore real fork lineage” to clear an override.
- **Grouped by workspace**, Sessions nest by fork lineage: a parent row is followed by its forked children,
  indented with guide lines; deeper forks keep nesting.
- **Collapse**: rows with children get a chevron; groups collapse as a whole. Collapse state is stored in
  `localStorage` (`dsh-session-folder.fork-tree.collapsed.v1`) and survives reloads.
- **Status**: each row's leading cell matches the host's own `StateDot` — **ongoing** is a 14px rotating ring
  (faint track plus a breathing arc), warning is an amber dot, unread completion green, idle neutral. The
  state comes from `useSessionStatus` and updates live, not from a static icon.
- **Filter**: the header input filters by title and keeps the matching node's ancestors visible.
- **Open**: clicking any node opens that Session in the main column through `ctx.uiWorkspace.openSession`;
  the tree stays open for continuous browsing.
- **Close / toggle**: click the panel title, the header **folder icon**, `Esc`, or the ⑂ icon in the Workspaces header again — the host list returns.

> This is a **separate tree view**, not a restyle of host rows: host Session rows expose no row-content,
> ordering, or collapse seat, so the default list stays sorted by “Last updated”. The view only replaces the
> **workspace browsing region**; the brand/new-session area above and the sidebar foot stay usable. While it is
> open the host's search/grouping is covered; closing restores it.

---

## Install

This package is a DSH bundle (`dsh.bundle` + `dsh.client`). **No build step**: the repository ships the
runnable `client.js` / `index.js`.

### A. Plugins panel (recommended)

DSH → Settings → Plugins → Install → **GitHub** → `cannebergeee/dsh-session-folder` → enable.

### B. Command line

```bash
# 1) add it as a profile dependency
dsh plugin --profile <profile> add github:cannebergeee/dsh-session-folder

# 2) add the package to that profile's bundles in package.json
#    "dsh": { "profile": { "bundles": [ "...", "@dsh-external/dsh-session-folder" ] } }

# 3) restart DSH
```

> No git, or you'd rather not depend on GitHub? Download the packed `.tgz` from
> [Releases](https://github.com/cannebergeee/dsh-session-folder/releases), unpack it into
> `<profile>/node_modules/@dsh-external/dsh-session-folder`, then finish steps 2–3 of B.

### C. Local development (no GitHub)

```bash
dsh plugin --profile <profile> add link:/absolute/path/to/dsh-session-folder
# add "@dsh-external/dsh-session-folder" to dsh.profile.bundles as above
```

### Uninstall

Settings → Plugins → disable / remove, or
`dsh plugin --profile <profile> remove @dsh-external/dsh-session-folder` and drop the row from `dsh.profile.bundles`.

---

## How it works

The plugin is a thin browser half; the heavy lifting stays in the host:

- **Session folder**: the client reads `SessionSummary.cwd` from `ctx.sessions.list` at click time — it never
  retains a Session or loads history.
- **Session right-click**: a page-level `contextmenu` listener recognizes the row's
  `data-row-key="session:<id>"` and activates the first button of that row's action seat, which is the `…`
  trigger — exactly what a left click does. The row's action seat stops click propagation, so right-click never
  selects or opens the Session.
- **File name → path**: the chat primitives render file chips and file links as `button.fileMention` whose
  `title` attribute carries the path (the host's `producedFileMentions` returns `{ title: path }`; file links
  do the same). A relative path is joined with the main-view Session's `cwd`.
- **Open / reveal**: all through the host's `session.openWorkspacePath` Remote, which verifies the path
  through the composed filesystem and then hands it to the desktop — default open or `action: 'reveal'`.
- **Copy**: `navigator.clipboard.writeText`, with success/failure notices.
- **Web links**: an http(s) link is a plain `<a href target="_blank">`; “Open in default browser” uses
  `window.open(url, '_blank', 'noopener,noreferrer')` — the desktop shell denies every new window and forwards
  http(s) URLs to `shell.openExternal`, so it lands in the system browser; a plain browser deployment opens a tab.
- **Styling**: exactly the host's menu and toast tokens (`--dsw-menu-surface-fill` +
  `--dsw-menu-backdrop-filter` translucent material, `--dsw-elevation-prominent`, `--dsw-radius-lg`,
  `--dsw-alias-menu-icon`, `--dsw-alias-toast-bg`, `--dsw-shadow-lv3` …), so it follows light and dark themes.
  No `dsh-client-ui-primitives` import; the rows are this plugin's own `role="menuitem"` buttons.
- **Fork tree**: data comes from the root-scope `useSessions` / `useWorkspaces` / `useSessionStatus` standard
  props (`SessionListState.byId[id].parentId`, the workspace snapshot's `items` / `archivedSessionIds`, and the
  live status map); the plugin assembles the parent/child forest itself. The panel is a `shell.overlay` entry
  positioned with `position: fixed` over `[data-slot="sidebar.workspaces"]`; the closed-state entry point is a
  26px icon button the same overlay paints over the host's “Workspaces” header row (the host exposes no header
  slot). Its position is measured from the host icon cluster's left edge and placed 8px to its left, so it never
  overlaps the search/sort/add buttons; both states follow the sidebar through `ResizeObserver`. It styles only
  with `--dsw-*` tokens; opening a Session reuses the host's `ctx.uiWorkspace.openSession` (the same call the
  official chat package makes) instead of navigating itself.

---

## Compatibility

- DSH `0.2.1-rc` line (needs the `sidebar.workspaces.session.menu.item` / `shell.overlay` slots, the
  `session.openWorkspacePath` Remote, and the `ctx.sessions` / `ctx.uiWorkspace` services).
- Requires a deployment that can hand paths to a local desktop (DSH Desktop, or a locally run Web build);
  open actions fail with a notice otherwise.
- Model-neutral: a browser UI plugin with no tools and no session writes.

## Known limitations

- **Menu position**: the Session right-click menu keeps the host anchor, so it opens at the `…` button rather
  than at the pointer (the host `Menu` only supports anchor positioning).
- **The file chip's path source is a host implementation detail**: if a future DSH release stops putting the
  path in `title`, the file right-click goes silent. The Session right-click and the `…` menu row are unaffected.
- A blank “New session” row has no action seat, so right-clicking it does nothing.
- **The fork tree is a separate view**: it covers the sidebar's workspace browser while open (host search and
  grouping are temporarily hidden) and restores it on close; it does not turn host rows into a collapsible
  tree. It shows ordinary Sessions only (subagent, blank, and archived rows are omitted), sorted by `updatedAt`,
  without pin/archive badges. The closed-state entry is an overlay icon painted over the host's “Workspaces”
  header row (the host offers no header slot), so a host layout change may require re-checking its position; the
  open state is not persisted (closed after a restart), while the collapse state is.

## Layout

| File | Role |
|---|---|
| `index.js` | Host half: an empty `apply`, only carrying the `dsh.client` Loader row |
| `client.js` | Browser half: Session menu row, file context menu, notices, fork-tree view |
| `cordis.patch.yml` | Inserts the `session-folder` row |
| `locale/{en,zh}.json` | Title/description shown in the Plugins panel |
| `icon.svg` | Plugin icon |

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

[BSD-3-Clause](LICENSE)
