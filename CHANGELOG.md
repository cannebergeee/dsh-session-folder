# Changelog

## 1.7.2 — 2026-10-22

- **Copy link** now uses the same copy glyph as *Copy absolute path* / *Copy relative path* (two overlapping
  rounded rectangles). The previous chain glyph collapsed into an “S” at the menu's 14 px icon size.

## 1.7.1 — 2026-10-22

- **Fix**: the image-link menu opened the wrong paths, because v1.7.0 guessed the target from the visible
  label. The exact target is now read from the link component's own React props (`file.path`, the markdown
  destination), and the label is only the last resort when those props are unavailable.
- The props read stays local to the element being right-clicked (walking its own fiber ancestry, guarded by
  try/catch); the rest of the menu logic is unchanged.

## 1.7.0 — 2026-10-22

- **Image links** (Markdown links to `.png` and other image files) now get the file menu. The host removes
  `title` from such a link once its inline preview resolves, so the path is recovered from the **visible
  label** when that label looks like a file name, then resolved against the project folder.
- Links whose label is prose (not a file name) keep the browser menu; opening a guessed path that does not
  exist reports the usual failure notice.

## 1.6.0 — 2026-10-22

- **User-message references** now get the same menus: right-clicking an `@file` reference in a user bubble
  opens the file menu (open / reveal / VS Code / copy paths), and an `@folder` reference opens
  “Open in File Explorer”. The raw `@path` spelling is recovered from the chip's `title` attribute.
- Composer references stay untouched: the chip must live inside a rendered chat node.
- Documented host behavior: user-message text is plain (`UserTextRun`), so typed URLs are not anchors and
  keep no link menu.

## 1.5.0 — 2026-10-22

- **Right-click a workspace row** → **Open in File Explorer** for that workspace's directory. The workspace
  row's own `…` menu has no plugin slot, so the action lives on right-click; rename/delete stay on `…`.
- Workspace paths come from the root workspace snapshot (`useWorkspaces`), mirrored into an id → directory
  map by a renderless `shell.overlay` entry, so renames/creations/deletions follow live.

## 1.4.1 — 2026-10-22

- Plugin panel display name changed: **右键增强** / **Right-click Enhancements** (was “打开会话目录与文件右键菜单” /
  “Session Folder & File Actions”). Descriptions now mention the link menu too. No behaviour change.

## 1.4.0 — 2026-10-22

- **Right-click an http(s) link in the conversation** → link menu with **Open in default browser** and
  **Copy link**. The menu surface is now shared with the file menu (the request supplies its own rows).
- “Open in default browser” uses `window.open`, which the desktop shell's window-open policy denies and
  forwards to `shell.openExternal` (the system browser); a browser deployment opens a tab.

## 1.3.1 — 2026-10-22

- **Fix**: `cordis.patch.yml` still inserted the row under the pre-rename package name
  (`@local/dsh-session-folder`), so the Loader row resolved to a package that no longer existed and the
  plugin silently did not load. The patch now names `@dsh-external/dsh-session-folder`, matching
  `package.json` and the Client bundle id. v1.3.0 is superseded.

## 1.3.0 — 2026-10-22

- **Right-click a Session row** now opens that row's own `…` menu (same host menu, one extra trigger).
  The row's action seat keeps click propagation stopped, so right-click never selects or opens the Session.

## 1.2.0 — 2026-10-22

- **Right-click a file name in the conversation**: open, reveal in the file manager, open in VS Code,
  copy absolute path, copy relative path.
- Menu surfaces restyled with the host's menu material (`--dsw-menu-surface-fill` +
  `--dsw-menu-backdrop-filter`, `--dsw-elevation-prominent`), notices aligned with the host toast tokens.
- Desktop file-handler results cached per path, so the VS Code row is instant on repeat opens.

## 1.1.0 — 2026-10-22

- Dropped the first right-click prototype; kept the Session menu row only.

## 1.0.0 — 2026-10-22

- First release: an “Open in File Explorer” row in the Session `…` menu, backed by the host's
  `session.openWorkspacePath` Remote.
