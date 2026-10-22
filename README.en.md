# dsh-session-folder

> Local-path shortcuts for the [DeepSeek Harness (DSH)](https://github.com/deepseek-ai) UI:
> **right-click a Session row** to open its project folder, **right-click a file name in the conversation**
> to open it, reveal it in the file manager, or copy its absolute / relative path,
> **right-click an http(s) link** to open it in the default browser or copy it, and **right-click a workspace
> row** to open that workspace's directory.

中文说明: [README.md](README.md)

> Plugins panel name: **Right-click Enhancements** (中文：右键增强).

> Announced in the DeepSeek Harness **Show Your Plugins!** discussion:
> <https://github.com/deepseek-ai/deepseek-harness/discussions/10617>

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

---

## Compatibility

- DSH `0.2.1-rc` line (needs the `sidebar.workspaces.session.menu.item` slot and the
  `session.openWorkspacePath` Remote).
- Requires a deployment that can hand paths to a local desktop (DSH Desktop, or a locally run Web build);
  open actions fail with a notice otherwise.
- Model-neutral: a browser UI plugin with no tools and no session writes.

## Known limitations

- **Menu position**: the Session right-click menu keeps the host anchor, so it opens at the `…` button rather
  than at the pointer (the host `Menu` only supports anchor positioning).
- **The file chip's path source is a host implementation detail**: if a future DSH release stops putting the
  path in `title`, the file right-click goes silent. The Session right-click and the `…` menu row are unaffected.
- A blank “New session” row has no action seat, so right-clicking it does nothing.

## Layout

| File | Role |
|---|---|
| `index.js` | Host half: an empty `apply`, only carrying the `dsh.client` Loader row |
| `client.js` | Browser half: Session menu row, file context menu, notices |
| `cordis.patch.yml` | Inserts the `session-folder` row |
| `locale/{en,zh}.json` | Title/description shown in the Plugins panel |
| `icon.svg` | Plugin icon |

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

[BSD-3-Clause](LICENSE)
