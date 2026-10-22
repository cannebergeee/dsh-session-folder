# Changelog

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
