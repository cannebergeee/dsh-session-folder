# dsh-session-folder

> Local-path shortcuts for the [DeepSeek Harness (DSH)](https://github.com/deepseek-ai) UI:
> **right-click a Session row** to open its project folder, and **right-click a file name in the conversation**
> to open it, reveal it in the file manager, open it in VS Code, or copy its absolute / relative path.

中文说明: [README.md](README.md)

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
| VS Code | Open the file in VS Code — shown only when the desktop registers VS Code for that file type |
| ─── | separator |
| Copy absolute path | Copy the absolute path, with a success notice |
| Copy relative path | Copy the path relative to the project folder (absolute when outside it) |

Keyboard: `↑`/`↓` to move, `Enter`/`Space` to run, `Esc` to dismiss; outside click, scroll, or window blur
closes it; the menu clamps itself into the viewport.

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
- **Open / reveal / VS Code**: all through the host's `session.openWorkspacePath` Remote, which verifies the
  path through the composed filesystem and then hands it to the desktop — default open, `action: 'reveal'`, or
  a registered `application` id.
- **VS Code row**: `session.workspacePathApplications` lists the desktop handlers registered for that file
  (Shell `SHAssocEnumHandlers` on Windows). The row appears only when VS Code is among them; nothing is faked.
- **Copy**: `navigator.clipboard.writeText`, with success/failure notices.
- **Styling**: exactly the host's menu and toast tokens (`--dsw-menu-surface-fill` +
  `--dsw-menu-backdrop-filter` translucent material, `--dsw-elevation-prominent`, `--dsw-radius-lg`,
  `--dsw-alias-menu-icon`, `--dsw-alias-toast-bg`, `--dsw-shadow-lv3` …), so it follows light and dark themes.
  No `dsh-client-ui-primitives` import; the rows are this plugin's own `role="menuitem"` buttons.

---

## Compatibility

- DSH `0.2.1-rc` line (needs the `sidebar.workspaces.session.menu.item` slot and the
  `session.openWorkspacePath` / `session.workspacePathApplications` Remotes).
- Requires a deployment that can hand paths to a local desktop (DSH Desktop, or a locally run Web build);
  open actions fail with a notice otherwise.
- Model-neutral: a browser UI plugin with no tools and no session writes.

## Known limitations

- **Menu position**: the Session right-click menu keeps the host anchor, so it opens at the `…` button rather
  than at the pointer (the host `Menu` only supports anchor positioning).
- **VS Code row depends on OS file associations**: without a VS Code handler registered for that extension the
  row is absent. Associate the type in Windows (Open with → choose VS Code) and retry; the OS caches
  associations, so a DSH restart may be needed.
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
