/**
 * Browser half of `@dsh-external/dsh-session-folder`.
 *
 * Two entry points over the same Host capabilities:
 *
 * 1. **Session "..." menu** (`sidebar.workspaces.session.menu.item`) — one row
 *    that opens that Session's project folder in the local file manager.
 *    Right-clicking a Session row opens that same "..." menu at the row.
 * 2. **Right-click on a file name in the conversation** — a menu with open,
 *    reveal in the file manager, and copy absolute / relative path.
 *
 * Paths: the Session row's folder comes from `SessionListState.byId[id].cwd`.
 * A conversation file chip carries its path in the `title` attribute (the chat
 * primitives put the full path there for both inline mentions and file links),
 * and the Session cwd that path is relative to comes from the main-view
 * Session. Nothing here retains a Session or loads history.
 *
 * Operations use the shipped `session.openWorkspacePath` Remote, which verifies
 * the path through the composed filesystem before opening or revealing it.
 *
 * Everything here is browser chrome: the Host half is an empty `apply`.
 */
window.__ModuleLoader__.load({
  id: '@dsh-external/dsh-session-folder',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** Locale namespace owned by this bundle. */
    const NS = 'dsh-session-folder'
    /** How long a notice stays on screen. */
    const NOTICE_MS = 4500
    /** CSS-module local name the chat uses for file mention and file link chips. */
    const FILE_MENTION_CLASS = 'fileMention'
    /** `data-row-key` prefix the workspace browser gives one Session row. */
    const SESSION_ROW_PREFIX = 'session:'
    /** `data-row-key` prefix the workspace browser gives one workspace row. */
    const WORKSPACE_ROW_PREFIX = 'workspace:'

    const zh = {
      'menu.open': '在资源管理器中打开',
      'notice.noFolder': '该会话没有可打开的项目目录',
      'notice.failed': '无法打开项目目录，请重试',
      'file.title': '文件操作',
      'file.open': '打开',
      'file.reveal': '资源管理器',
      'file.copyAbsolute': '复制绝对路径',
      'file.copyRelative': '复制相对路径',
      'notice.copiedAbsolute': '已复制绝对路径',
      'notice.copiedRelative': '已复制相对路径',
      'notice.copyFailed': '复制失败，请重试',
      'notice.noPath': '无法确定该文件的路径',
      'url.title': '链接操作',
      'url.open': '默认浏览器打开',
      'url.copy': '复制链接',
      'notice.copiedLink': '已复制链接',
      'notice.openLinkFailed': '无法打开链接，请重试',
      'workspace.title': '工作区操作',
      'folder.title': '文件夹操作',
      'tree.toggle': '切换分叉树视图',
      'tree.title': '分叉树',
      'tree.filter': '筛选会话…',
      'tree.close': '返回会话列表',
      'tree.menu': '分叉树视图',
      'tree.untitled': '未命名会话',
      'tree.ungrouped': '未分组',
      'tree.noSessions': '没有可显示的会话',
      'tree.noMatches': '没有匹配的会话',
      'tree.toggleNode': '展开或折叠分叉',
      'tree.more': '更多操作',
      'tree.pin': '置顶会话',
      'tree.unpin': '取消置顶',
      'tree.fork': '创建分叉',
      'tree.archive': '归档会话',
      'tree.copyId': '复制会话 ID',
      'tree.openFolder': '在资源管理器中打开',
      'tree.resetParent': '恢复真实 fork 层级',
      'tree.archiveConfirm.title': '会话正在运行',
      'tree.archiveConfirm.stop': '停止活动并归档',
      'tree.archiveConfirm.cancel': '取消',
      'tree.notice.pinned': '已置顶',
      'tree.notice.unpinned': '已取消置顶',
      'tree.notice.archived': '已归档',
      'tree.notice.sessionIdCopied': '已复制会话 ID',
      'tree.notice.failed': '操作失败，请重试',
      'tree.drag.rootHint': '拖到分组标题成为一级会话',
    }
    const en = {
      'menu.open': 'Open in File Explorer',
      'notice.noFolder': 'This session has no project folder to open',
      'notice.failed': 'Could not open the project folder. Please try again.',
      'file.title': 'File actions',
      'file.open': 'Open',
      'file.reveal': 'File Explorer',
      'file.copyAbsolute': 'Copy absolute path',
      'file.copyRelative': 'Copy relative path',
      'notice.copiedAbsolute': 'Absolute path copied',
      'notice.copiedRelative': 'Relative path copied',
      'notice.copyFailed': 'Could not copy. Please try again.',
      'notice.noPath': 'Could not resolve this file path',
      'url.title': 'Link actions',
      'url.open': 'Open in default browser',
      'url.copy': 'Copy link',
      'notice.copiedLink': 'Link copied',
      'notice.openLinkFailed': 'Could not open the link. Please try again.',
      'workspace.title': 'Workspace actions',
      'folder.title': 'Folder actions',
      'tree.toggle': 'Toggle fork tree view',
      'tree.title': 'Fork tree',
      'tree.filter': 'Filter sessions…',
      'tree.close': 'Back to the session list',
      'tree.menu': 'Fork tree view',
      'tree.untitled': 'Untitled session',
      'tree.ungrouped': 'Ungrouped',
      'tree.noSessions': 'No sessions to show',
      'tree.noMatches': 'No matching sessions',
      'tree.toggleNode': 'Expand or collapse branches',
      'tree.more': 'More actions',
      'tree.pin': 'Pin session',
      'tree.unpin': 'Unpin session',
      'tree.fork': 'Fork session',
      'tree.archive': 'Archive session',
      'tree.copyId': 'Copy session ID',
      'tree.openFolder': 'Open in File Explorer',
      'tree.resetParent': 'Restore real fork lineage',
      'tree.archiveConfirm.title': 'This session is running',
      'tree.archiveConfirm.stop': 'Stop activity and archive',
      'tree.archiveConfirm.cancel': 'Cancel',
      'tree.notice.pinned': 'Pinned',
      'tree.notice.unpinned': 'Unpinned',
      'tree.notice.archived': 'Archived',
      'tree.notice.sessionIdCopied': 'Session ID copied',
      'tree.notice.failed': 'Action failed. Please try again.',
      'tree.drag.rootHint': 'Drop on a group header to make it a root session',
    }

    /**
     * Tokens and metrics copied verbatim from the host's own menu surface and
     * toast: `--dsw-menu-surface-fill` with the menu backdrop filter, the
     * prominent elevation whose 0.5px stroke comes from the elevation variable,
     * and 34px rows. No literal colors.
     */
    const CSS = [
      '.dsf-menuitem{display:flex;align-items:center;gap:6px;width:100%;min-height:34px;padding:6px 8px;border:none;border-radius:var(--dsw-radius-md);background:transparent;cursor:pointer;font-family:inherit;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary);text-align:left}',
      '.dsf-menuitem:hover:not(:disabled),.dsf-menuitem:focus-visible:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);outline:none}',
      '.dsf-menuitem:disabled{opacity:.4;cursor:not-allowed}',
      '.dsf-menuitem-icon{display:inline-flex;flex:none;width:14px;height:14px;align-items:center;justify-content:center;color:var(--dsw-alias-menu-icon)}',
      '.dsf-menuitem-icon svg{width:14px;height:14px}',
      '.dsf-menuitem-icon img{width:14px;height:14px;object-fit:contain}',
      '.dsf-menuitem-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dsf-menu{position:fixed;z-index:1100;box-sizing:border-box;min-width:144px;max-width:360px;padding:4px;display:flex;flex-direction:column;gap:0;border:0;border-radius:var(--dsw-radius-lg);background:var(--dsw-menu-surface-fill);backdrop-filter:var(--dsw-menu-backdrop-filter);--dsw-elevation-stroke-color:var(--dsw-alias-border-l1);box-shadow:var(--dsw-elevation-prominent);pointer-events:auto;font-family:inherit;outline:none}',
      '.dsf-menu-sep{height:.5px;margin:3px 2px;background:var(--dsw-alias-border-l2)}',
      '.dsf-notice{position:fixed;top:40px;left:50%;transform:translateX(-50%);z-index:1100;display:flex;align-items:center;gap:10px;width:max-content;max-width:min(640px,calc(100vw - 48px));padding:12px 16px;border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-toast-bg);color:var(--dsw-alias-toast-label);font-family:inherit;font-size:14px;line-height:22px;box-shadow:var(--dsw-shadow-lv3);pointer-events:none;animation:dsf-notice-in .18s ease-out}',
      '.dsf-notice-dot{flex:none;width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-state-error-primary)}',
      '.dsf-notice[data-tone=success] .dsf-notice-dot{background:var(--dsw-alias-state-success-primary)}',
      '@keyframes dsf-notice-in{from{opacity:0;transform:translate(-50%,-6px)}to{opacity:1;transform:translate(-50%)}}',
      '@media (prefers-reduced-motion:reduce){.dsf-notice{animation:none}}',
      /* Fork-tree view: a header-icon launcher + the panel that replaces the sidebar browser. */
      '.dsf-tree-launcher{position:fixed;z-index:6;box-sizing:border-box;width:28px;height:28px;padding:0;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;pointer-events:auto}',
      '.dsf-tree-launcher:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dsf-tree-launcher:focus-visible{outline:none;box-shadow:0 0 0 1px var(--dsw-alias-brand-primary)}',
      '.dsf-tree-label-hit{position:fixed;z-index:6;box-sizing:border-box;margin:0;padding:0;border:0;border-radius:8px;background:transparent;cursor:pointer;transition:background-color .14s ease}',
      '.dsf-tree-label-hit:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dsf-tree-label-hit:focus-visible{outline:none;box-shadow:0 0 0 1px var(--dsw-alias-brand-primary)}',
      '.dsf-tree-panel{position:fixed;z-index:5;box-sizing:border-box;display:flex;flex-direction:column;min-height:0;overflow:hidden;background:var(--dsw-specific-sidebar-fill);color:var(--dsw-alias-label-primary);pointer-events:auto;font-family:inherit}',
      '.dsf-tree-head{flex:none;display:flex;align-items:center;gap:4px;height:36px;margin-bottom:4px;margin-top:2px;padding:0 8px 0 4px}',
      '.dsf-tree-heading{flex:1;min-width:0;display:flex;align-items:center}',
      '.dsf-tree-heading-title{font-size:14px;font-weight:400;line-height:20px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0;border:0;background:transparent;font-family:inherit;text-align:left;cursor:pointer}',
      '.dsf-tree-heading-title:hover{color:var(--dsw-alias-label-primary)}',
      '.dsf-tree-heading-title:focus-visible{outline:none;box-shadow:0 0 0 1px var(--dsw-alias-brand-primary);border-radius:4px}',
      '.dsf-tree-close{flex:none;width:28px;height:28px;padding:0;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer}',
      '.dsf-tree-close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dsf-tree-close svg{width:16px;height:16px}',
      '.dsf-tree-search{flex:none;display:flex;align-items:center;gap:6px;height:30px;margin:2px 8px 8px;padding:0 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary)}',
      '.dsf-tree-search>svg{flex:none}',
      '.dsf-tree-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px}',
      '.dsf-tree-search input::placeholder{color:var(--dsw-alias-label-secondary);opacity:.8}',
      '.dsf-tree-scroll{flex:1;min-height:0;overflow-y:auto;padding:0 8px 10px;scrollbar-width:thin}',
      '.dsf-tree-scroll::-webkit-scrollbar{width:8px}',
      '.dsf-tree-scroll::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2);border-radius:99px;border:2px solid transparent;background-clip:padding-box}',
      '.dsf-tree-group{margin-top:6px}',
      '.dsf-tree-group-header{display:flex;align-items:center;gap:6px;height:30px;padding:0 6px;border-radius:7px;cursor:pointer;user-select:none;outline:none}',
      '.dsf-tree-group-header:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dsf-tree-group-header:focus-visible{box-shadow:0 0 0 1px var(--dsw-alias-brand-primary)}',
      '.dsf-tree-group-name{flex:1;min-width:0;font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dsf-tree-group-count{flex:none;font-size:10.5px;color:var(--dsw-alias-label-secondary)}',
      '.dsf-tree-group-body{padding-left:2px}',
      '.dsf-tree-node{min-width:0}',
      '.dsf-tree-children{margin-left:14px;padding-left:4px;border-left:1px solid var(--dsw-alias-border-l2)}',
      '.dsf-tree-children>.dsf-tree-node>.dsf-tree-row::before{content:"";position:absolute;left:-5px;top:15px;width:5px;border-top:1px solid var(--dsw-alias-border-l2)}',
      '.dsf-tree-row{position:relative;display:flex;align-items:center;height:30px;padding:0 7px;border-radius:7px;cursor:pointer;user-select:none;outline:none}',
      '.dsf-tree-row:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dsf-tree-row:focus-visible{box-shadow:0 0 0 1px var(--dsw-alias-brand-primary)}',
      '.dsf-tree-row.is-current{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dsf-tree-twisty{flex:none;width:16px;height:16px;padding:0;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);display:grid;place-items:center;cursor:pointer}',
      '.dsf-tree-twisty.is-spacer{visibility:hidden;cursor:default}',
      '.dsf-tree-twisty:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dsf-tree-chev{width:5px;height:5px;border-right:1.4px solid currentColor;border-bottom:1.4px solid currentColor;transform:rotate(45deg);margin-top:-2px;transition:transform .12s ease}',
      '.dsf-tree-twisty.is-collapsed .dsf-tree-chev{transform:rotate(-45deg);margin-top:0;margin-left:-2px}',
      '.dsf-tree-state-slot{position:relative;top:1px;width:16px;height:20px;display:inline-flex;align-items:center;justify-content:center;flex:none;margin-left:2px}',
      '.dsf-tree-spinner{flex:none;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary))}',
      '.dsf-tree-spinner-motion{transform-origin:center;animation:dsf-tree-spin 1.5s linear infinite}',
      '.dsf-tree-spinner-track,.dsf-tree-spinner-arc{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}',
      '.dsf-tree-spinner-track{opacity:.25}',
      '.dsf-tree-spinner-arc{stroke-dasharray:12 150;animation:dsf-tree-dash 1.5s ease-in-out infinite}',
      '@keyframes dsf-tree-spin{to{transform:rotate(360deg)}}',
      '@keyframes dsf-tree-dash{0%{stroke-dasharray:12 150;stroke-dashoffset:0}50%{stroke-dasharray:24 150;stroke-dashoffset:-6}100%{stroke-dasharray:12 150;stroke-dashoffset:0}}',
      '@media (prefers-reduced-motion:reduce){.dsf-tree-spinner-motion,.dsf-tree-spinner-arc{animation:none}.dsf-tree-spinner-arc{stroke-dasharray:18 150;stroke-dashoffset:-3}}',
      '.dsf-tree-dot{position:relative;display:inline-block;flex:none;width:10px;height:10px}',
      '.dsf-tree-dot::after{content:"";position:absolute;inset:20%;border-radius:50%;background:currentColor}',
      '.dsf-tree-dot[data-state=done]{color:var(--dsw-alias-state-success-primary)}',
      '.dsf-tree-dot[data-state=warning]{color:var(--dsw-alias-state-warn-primary)}',
      '.dsf-tree-dot[data-state=error]{color:var(--dsw-alias-state-error-primary)}',
      '.dsf-tree-dot[data-state=idle]{color:var(--dsw-alias-state-idle-primary)}',
      '.dsf-tree-title{flex:1;min-width:0;margin-left:4px;font-size:13px;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dsf-tree-count{flex:none;margin-left:6px;padding:0 5px;height:16px;display:inline-flex;align-items:center;border-radius:5px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);font-size:10px}',
      '.dsf-tree-actions{flex:none;display:flex;align-items:center;gap:1px;margin-left:4px;opacity:0;pointer-events:none;transition:opacity .12s ease}',
      '.dsf-tree-row:hover .dsf-tree-actions,.dsf-tree-row:focus-within .dsf-tree-actions{opacity:1;pointer-events:auto}',
      '.dsf-tree-row:hover .dsf-tree-count,.dsf-tree-row:focus-within .dsf-tree-count{display:none}',
      '.dsf-tree-action{width:22px;height:22px;padding:0;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer}',
      '.dsf-tree-action:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dsf-tree-action:focus-visible{outline:none;box-shadow:0 0 0 1px var(--dsw-alias-brand-primary)}',
      '.dsf-tree-action.is-pinned{color:var(--dsw-alias-brand-primary)}',
      '.dsf-tree-row.is-dragging{opacity:.55}',
      '.dsf-tree-row.is-drop-target{background:var(--dsw-alias-interactive-bg-hover);box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary)}',
      '.dsf-tree-group-header.is-drop-target{background:var(--dsw-alias-interactive-bg-hover);box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary)}',
      '@media (hover:none){.dsf-tree-actions{opacity:1;pointer-events:auto}}',
      '.dsf-tree-empty{padding:26px 16px;text-align:center;font-size:12px;line-height:1.7;color:var(--dsw-alias-label-secondary)}',
    ].join('')

    /**
     * Minimal snapshot store shared by the page-level surfaces.
     * @param initial - first value.
     * @returns get/set/subscribe, with stable identities.
     */
    function createStore(initial) {
      let state = initial
      const listeners = new Set()
      return {
        get() {
          return state
        },
        set(next) {
          state = next
          for (const listener of listeners) listener()
        },
        subscribe(listener) {
          listeners.add(listener)
          return () => {
            listeners.delete(listener)
          }
        },
      }
    }

    /** Right-click menu request: `{ x, y, title, rows() }`. */
    const menuStore = createStore(null)
    /** Workspace id → directory, mirrored from the root workspace snapshot. */
    const workspacePathStore = createStore(new Map())
    /** Transient notice: `{ seq, text, tone }`. */
    const noticeStore = createStore(null)
    /** Whether the fork-tree view covers the sidebar's workspace browser. */
    const treeOpenStore = createStore(false)
    /** Opens a Session in the main column; installed by `apply` (no slot injection needed). */
    let treeOpenSession = () => {}

    /**
     * Subscribe one component to a store.
     * @param store - snapshot store.
     * @returns the current value, re-rendering on change.
     */
    function useStore(store) {
      return React.useSyncExternalStore(store.subscribe, store.get, store.get)
    }

    /**
     * One inline SVG icon.
     * @param props.children - paths.
     * @param props.size - square edge in pixels.
     * @returns the icon.
     */
    function Icon(props) {
      const size = props.size === undefined ? 14 : props.size
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.25,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: 'false',
        },
        props.children,
      )
    }

    /**
     * Host-compatible closed-folder glyph (same 16px artwork and 1px stroke as
     * the workspace rows / add-workspace icon).
     * @param props.size - square edge in pixels (default 16).
     * @returns the icon.
     */
    function FolderIcon(props) {
      const size = props !== null && props !== undefined && props.size !== undefined ? props.size : 16
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 16 16',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
          strokeWidth: 1,
          'aria-hidden': true,
          focusable: 'false',
        },
        h('path', {
          key: 'outline',
          d: 'M1.50439 3.11059C1.50439 2.55831 1.95211 2.1106 2.50439 2.1106H5.43389C5.67773 2.1106 5.91318 2.19969 6.09593 2.36113L7.71649 3.79265C7.89924 3.95409 8.1347 4.04319 8.3785 4.04319H13.4958C14.0481 4.04319 14.4958 4.4909 14.4958 5.04319V12.8894C14.4958 13.4417 14.0481 13.8894 13.4958 13.8894H2.50439C1.95211 13.8894 1.50439 13.4417 1.50439 12.8894V4.04319V3.11059Z',
          stroke: 'currentColor',
        }),
        h('path', {
          key: 'line',
          d: 'M3.63501 7.66614H12.3647',
          stroke: 'currentColor',
        }),
      )
    }

    /**
     * Open-in-default-application glyph.
     * @returns the icon.
     */
    function OpenIcon() {
      return h(
        Icon,
        {},
        h('path', { key: 'box', d: 'M9.4 2.6h4v4' }),
        h('path', { key: 'arrow', d: 'M13.4 2.6 8.2 7.8' }),
        h('path', { key: 'frame', d: 'M12.4 9.9v2.4c0 .6-.5 1.1-1.1 1.1H3.8c-.6 0-1.1-.5-1.1-1.1V5c0-.6.5-1.1 1.1-1.1h2.5' }),
      )
    }

    /**
     * Copy glyph.
     * @returns the icon.
     */
    function CopyIcon() {
      return h(
        Icon,
        {},
        h('rect', { key: 'front', x: 2.6, y: 2.6, width: 7.6, height: 7.6, rx: 1.4 }),
        h('path', { key: 'back', d: 'M5.8 13.4h6.2c.8 0 1.4-.6 1.4-1.4V5.8' }),
      )
    }

    /**
     * Globe glyph for "open in the default browser".
     * @returns the icon.
     */
    function GlobeIcon() {
      return h(
        Icon,
        {},
        h('circle', { key: 'globe', cx: 8, cy: 8, r: 5.6 }),
        h('path', { key: 'equator', d: 'M2.6 8h10.8' }),
        h('path', { key: 'meridian', d: 'M8 2.4c1.5 1.6 2.3 3.5 2.3 5.6S9.5 12 8 13.6C6.5 12 5.7 10.1 5.7 8S6.5 4 8 2.4Z' }),
      )
    }

    /**
     * One `role="menuitem"` row, matching the host menu row metrics.
     * @param props.label - visible text.
     * @param props.icon - leading icon.
     * @param props.onSelect - activation callback.
     * @param props.tabIndex - optional tab order.
     * @returns the row.
     */
    function MenuItem(props) {
      return h(
        'button',
        {
          type: 'button',
          role: 'menuitem',
          className: 'dsf-menuitem',
          tabIndex: props.tabIndex,
          onClick: props.onSelect,
        },
        h('span', { key: 'icon', className: 'dsf-menuitem-icon' }, props.icon),
        h('span', { key: 'label', className: 'dsf-menuitem-label' }, props.label),
      )
    }

    /**
     * The Session "..." menu row: dismiss the menu, then open the folder.
     * The button keeps the host's own tab order, like every host row.
     * @param props.sessionId - the row's Session.
     * @param props.useMenuOpenState - injected hook returning the menu state pair.
     * @param props.openFolder - injected Host operation.
     * @param props.t - bound locale translate.
     * @returns the menu row.
     */
    function SessionFolderMenuItem(props) {
      const { sessionId, useMenuOpenState, openFolder, t } = props
      const setMenuOpen = useMenuOpenState()[1]
      return h(MenuItem, {
        label: t('menu.open'),
        icon: h(FolderIcon, {}),
        onSelect: () => {
          setMenuOpen(false)
          openFolder(sessionId)
        },
      })
    }

    /**
     * The right-click menu surface: the request supplies its own rows, so the
     * file menu, the folder menu, and the link menu share one surface.
     * @returns the positioned menu, or null while closed.
     */
    function ContextMenu() {
      const request = useStore(menuStore)
      const ref = React.useRef(null)

      /**
       * Keep the menu inside the viewport.
       * @param x - preferred left edge.
       * @param y - preferred top edge.
       */
      const clamp = (x, y) => {
        const el = ref.current
        if (el === null) return
        const rect = el.getBoundingClientRect()
        const pad = 8
        const left = Math.min(Math.max(pad, x), Math.max(pad, window.innerWidth - rect.width - pad))
        const top = Math.min(Math.max(pad, y), Math.max(pad, window.innerHeight - rect.height - pad))
        el.style.left = String(left) + 'px'
        el.style.top = String(top) + 'px'
      }

      // A new request places the menu and focuses its first row.
      React.useLayoutEffect(() => {
        if (request === null) return undefined
        clamp(request.x, request.y)
        const first = ref.current === null ? null : ref.current.querySelector('[role="menuitem"]')
        if (first instanceof HTMLElement) first.focus()
        return undefined
      }, [request])

      React.useEffect(() => {
        if (request === null) return undefined
        const close = () => menuStore.set(null)
        const onPointerDown = (event) => {
          const el = ref.current
          if (el !== null && event.target instanceof Node && el.contains(event.target)) return
          close()
        }
        const onKeyDown = (event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            close()
            return
          }
          const items = Array.from(ref.current ? ref.current.querySelectorAll('[role="menuitem"]') : [])
          if (items.length === 0) return
          const index = items.indexOf(document.activeElement)
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            const step = event.key === 'ArrowDown' ? 1 : -1
            const next = (index + step + items.length) % items.length
            if (items[next] instanceof HTMLElement) items[next].focus()
            return
          }
          if ((event.key === 'Enter' || event.key === ' ') && index !== -1) {
            event.preventDefault()
            items[index].click()
          }
        }
        const onScroll = () => close()
        document.addEventListener('pointerdown', onPointerDown, true)
        document.addEventListener('keydown', onKeyDown, true)
        window.addEventListener('scroll', onScroll, true)
        window.addEventListener('blur', onScroll)
        return () => {
          document.removeEventListener('pointerdown', onPointerDown, true)
          document.removeEventListener('keydown', onKeyDown, true)
          window.removeEventListener('scroll', onScroll, true)
          window.removeEventListener('blur', onScroll)
        }
      }, [request])

      if (request === null) return null
      const run = (action) => {
        menuStore.set(null)
        action()
      }
      const rows = []
      for (const spec of request.rows()) {
        if (spec.separator === true) {
          rows.push(h('div', { key: spec.key, className: 'dsf-menu-sep', role: 'separator' }))
          continue
        }
        rows.push(
          h(MenuItem, {
            key: spec.key,
            label: spec.label,
            icon: spec.icon,
            tabIndex: -1,
            onSelect: () => run(spec.onSelect),
          }),
        )
      }
      return h(
        'div',
        {
          ref,
          className: 'dsf-menu',
          role: 'menu',
          'aria-label': request.title,
          style: { left: String(request.x) + 'px', top: String(request.y) + 'px' },
        },
        rows,
      )
    }

    /**
     * Frame-level notice, replayed per request sequence.
     * @returns the notice, or null while none is showing.
     */
    function SessionFolderNotice() {
      const notice = useStore(noticeStore)
      if (notice === null) return null
      return h(
        'div',
        { key: notice.seq, className: 'dsf-notice', role: 'status', 'data-tone': notice.tone },
        h('span', { key: 'dot', className: 'dsf-notice-dot', 'aria-hidden': true }),
        h('span', { key: 'text' }, notice.text),
      )
    }

    /**
     * Publishes the workspace catalog (id → directory) for the page-level
     * context-menu listener. `shell.overlay` entries receive the root
     * `useWorkspaces` selector hook and stay mounted, so the map follows
     * renames, creations, and deletions without the listener reading the DOM.
     * @param props.useWorkspaces - root workspace snapshot selector.
     * @returns nothing; this entry renders no UI.
     */
    function WorkspacePathBridge(props) {
      if (typeof props.useWorkspaces !== 'function') return null
      return h(WorkspacePathProbe, { useWorkspaces: props.useWorkspaces })
    }

    /**
     * Subscribes the workspace snapshot and mirrors it into the module store.
     * @param props.useWorkspaces - root workspace snapshot selector.
     * @returns null.
     */
    function WorkspacePathProbe(props) {
      const items = props.useWorkspaces((state) => state.items)
      React.useEffect(() => {
        const map = new Map()
        for (const item of items || []) {
          const id = item === null || item === undefined ? undefined : item.workspaceId
          const path = item === null || item === undefined ? undefined : item.path
          if (typeof id === 'string' && typeof path === 'string' && path !== '') map.set(id, path)
        }
        workspacePathStore.set(map)
      }, [items])
      return null
    }

    /* ------------------------------------------------------------------ *
     * Fork-tree view (option ③): a plugin-owned tree over the sidebar's
     * workspace browser. The host renders no row-content/ordering seat, so
     * this surface deliberately replaces the browser region instead of
     * restyling host rows; every node is clickable and opens its Session.
     * ------------------------------------------------------------------ */

    /** localStorage key for collapsed tree nodes. */
    const TREE_COLLAPSED_KEY = 'dsh-session-folder.fork-tree.collapsed.v1'
    /** localStorage key for view-level parent overrides. */
    const TREE_PARENTS_KEY = 'dsh-session-folder.fork-tree.parents.v1'

    /**
     * Read persisted view-level parent overrides.
     * @returns a plain object mapping child id to parent id or null (root).
     */
    function loadTreeParents() {
      try {
        const raw = window.localStorage.getItem(TREE_PARENTS_KEY)
        if (raw === null) return {}
        const parsed = JSON.parse(raw)
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
        const result = {}
        for (const [childId, parentId] of Object.entries(parsed)) {
          if (typeof childId !== 'string' || childId === '') continue
          if (parentId === null) result[childId] = null
          else if (typeof parentId === 'string' && parentId !== '') result[childId] = parentId
        }
        return result
      } catch (error) {
        return {}
      }
    }

    /**
     * Persist view-level parent overrides.
     * @param parents - child id to parent id/null map.
     */
    function saveTreeParents(parents) {
      try {
        window.localStorage.setItem(TREE_PARENTS_KEY, JSON.stringify(parents))
      } catch (error) {
        // Storage is best-effort; the tree stays usable without it.
      }
    }

    /**
     * Read the persisted collapsed node ids.
     * @returns a Set of node ids; empty when storage is unavailable.
     */
    function loadTreeCollapsed() {
      try {
        const raw = window.localStorage.getItem(TREE_COLLAPSED_KEY)
        if (raw === null) return new Set()
        const parsed = JSON.parse(raw)
        return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [])
      } catch (error) {
        return new Set()
      }
    }

    /**
     * Persist collapsed node ids.
     * @param collapsed - node ids to store.
     */
    function saveTreeCollapsed(collapsed) {
      try {
        window.localStorage.setItem(TREE_COLLAPSED_KEY, JSON.stringify([...collapsed]))
      } catch (error) {
        // Storage is best-effort; the tree stays usable without it.
      }
    }

    /**
     * Fork glyph for the footer action, menu row, and panel header.
     * @param props.size - square edge in pixels.
     * @returns the icon.
     */
    function BranchIcon(props) {
      const size = props !== null && props !== undefined && props.size !== undefined ? props.size : 14
      return h(
        Icon,
        { size },
        h('circle', { key: 'a', cx: 8, cy: 2.8, r: 1.35, fill: 'currentColor', stroke: 'none' }),
        h('circle', { key: 'b', cx: 4.1, cy: 13, r: 1.35, fill: 'currentColor', stroke: 'none' }),
        h('circle', { key: 'c', cx: 11.9, cy: 13, r: 1.35, fill: 'currentColor', stroke: 'none' }),
        h('path', { key: 'lines', d: 'M8 4.2v2.3M4.1 11.6V6.5h7.8v5.1' }),
      )
    }

    /**
     * Search glyph for the tree filter.
     * @returns the icon.
     */
    function SearchIcon() {
      return h(
        Icon,
        {},
        h('circle', { key: 'lens', cx: 7.2, cy: 7.2, r: 4.1 }),
        h('path', { key: 'handle', d: 'm10.4 10.4 2.8 2.8' }),
      )
    }

    /**
     * Ellipsis glyph for the row action menu.
     * @returns the icon.
     */
    function EllipsisIcon() {
      return h(
        Icon,
        {},
        h('circle', { key: 'a', cx: 3.3, cy: 8, r: 1.05, fill: 'currentColor', stroke: 'none' }),
        h('circle', { key: 'b', cx: 8, cy: 8, r: 1.05, fill: 'currentColor', stroke: 'none' }),
        h('circle', { key: 'c', cx: 12.7, cy: 8, r: 1.05, fill: 'currentColor', stroke: 'none' }),
      )
    }

    /**
     * Pin glyph; filled for a pinned row, outline otherwise.
     * @param props.filled - whether the row is pinned.
     * @param props.size - square edge in pixels.
     * @returns the icon.
     */
    function PinIcon(props) {
      const filled = props !== null && props !== undefined && props.filled === true
      const size = props !== null && props !== undefined && props.size !== undefined ? props.size : 14
      return h(
        Icon,
        { size },
        h('path', {
          key: 'pin',
          d: 'M9.9 1.8 14.2 6.1 11.9 6.7 9.5 9.1 9.8 11.4 4.6 6.2 6.9 6.5 9.3 4.1 9.9 1.8Z',
          fill: filled ? 'currentColor' : 'none',
        }),
        h('path', { key: 'needle', d: 'M5.2 10.8 2.1 13.9' }),
      )
    }

    /**
     * Archive-box glyph.
     * @returns the icon.
     */
    function ArchiveIcon() {
      return h(
        Icon,
        {},
        h('path', { key: 'lid', d: 'M2.2 2.6h11.6v2.5H2.2z' }),
        h('path', { key: 'box', d: 'M3.2 5.1h9.6v8.3H3.2z' }),
        h('path', { key: 'slot', d: 'M6.2 7.7h3.6' }),
      )
    }

    /**
     * Copy glyph for the Session-id menu row.
     * @returns the icon.
     */
    function CopyIcon() {
      return h(
        Icon,
        {},
        h('rect', { key: 'back', x: 2.2, y: 5.1, width: 7.2, height: 8.7, rx: 1.1 }),
        h('path', { key: 'front', d: 'M6.1 5.1V3.4c0-.7.5-1.2 1.2-1.2h5.3c.7 0 1.2.5 1.2 1.2v6.1c0 .7-.5 1.2-1.2 1.2h-1.7' }),
      )
    }

    /**
     * Display title of one Session-list row.
     * @param row - row from `SessionListState.byId`.
     * @param t - bound locale translate.
     * @returns the title shown in the tree.
     */
    function treeTitle(row, t) {
      const title = row.displayTitle !== undefined ? row.displayTitle : row.title
      if (typeof title === 'string' && title.trim() !== '') return title
      return t('tree.untitled')
    }

    /**
     * Whether one Session-list row belongs in the fork tree.
     * @param row - row from `SessionListState.byId`.
     * @param archived - archive id set from the workspace snapshot.
     * @returns true for ordinary, visible Sessions.
     */
    function treeVisible(row, archived) {
      if (row === null || row === undefined) return false
      if (row.blank === true) return false
      if (row.origin === 'subagent') return false
      if (archived.has(row.id)) return false
      return true
    }

    /**
     * Build the Workspace-grouped fork forest.
     * @param sessions - Session-list snapshot.
     * @param workspaces - Workspace snapshot.
     * @param ungroupedLabel - localized label for Sessions outside every Workspace.
     * @param parentOverrides - view-level child -> parent (or null) overrides.
     * @returns groups with root and child lists; empty groups are dropped.
     */
    function buildForest(sessions, workspaces, ungroupedLabel, parentOverrides) {
      const rows = sessions !== null && sessions !== undefined && sessions.byId !== undefined ? sessions.byId : {}
      const items = workspaces !== null && workspaces !== undefined && Array.isArray(workspaces.items) ? workspaces.items : []
      const archived = new Set(
        workspaces !== null && workspaces !== undefined && Array.isArray(workspaces.archivedSessionIds)
          ? workspaces.archivedSessionIds
          : [],
      )
      const pinned = new Set(
        workspaces !== null && workspaces !== undefined && Array.isArray(workspaces.pinnedSessionIds)
          ? workspaces.pinnedSessionIds
          : [],
      )
      const overrides = parentOverrides !== null && typeof parentOverrides === 'object' ? parentOverrides : {}
      const makeGroup = (key, title, members) => {
        const byId = new Map(members.map((row) => [row.id, row]))
        const parentOf = (row) => {
          if (Object.prototype.hasOwnProperty.call(overrides, row.id)) {
            const override = overrides[row.id]
            if (override === null) return null
            if (typeof override === 'string' && override !== row.id && byId.has(override)) return override
          }
          const real = row.parentId
          return typeof real === 'string' && real !== row.id && byId.has(real) ? real : null
        }
        // Resolve effective parent links first, then break cycles introduced by
        // a stale/naive view-level override: a cycle's row falls back to root.
        const parentMap = new Map()
        for (const row of members) parentMap.set(row.id, parentOf(row))
        for (const row of members) {
          const seen = new Set([row.id])
          let cursor = parentMap.get(row.id)
          while (cursor !== null && cursor !== undefined) {
            if (seen.has(cursor)) {
              parentMap.set(row.id, null)
              break
            }
            seen.add(cursor)
            cursor = parentMap.get(cursor)
          }
        }
        const children = new Map()
        const roots = []
        for (const row of members) {
          const parentId = parentMap.get(row.id)
          if (parentId === null || parentId === undefined) {
            roots.push(row)
          } else {
            const kids = children.get(parentId)
            if (kids === undefined) children.set(parentId, [row])
            else kids.push(row)
          }
        }
        const pinnedFirst = (left, right) => {
          const leftPinned = pinned.has(left.id) ? 1 : 0
          const rightPinned = pinned.has(right.id) ? 1 : 0
          if (leftPinned !== rightPinned) return rightPinned - leftPinned
          return (right.updatedAt || 0) - (left.updatedAt || 0)
        }
        roots.sort(pinnedFirst)
        for (const kids of children.values()) kids.sort(pinnedFirst)
        return { key, title, roots, children, total: members.length }
      }
      const groups = []
      const accounted = new Set()
      for (const workspace of items) {
        const ids = Array.isArray(workspace.sessionIds) ? workspace.sessionIds : []
        const members = []
        for (const id of ids) {
          const row = rows[id]
          if (row === undefined) continue
          accounted.add(id)
          if (treeVisible(row, archived)) members.push(row)
        }
        groups.push(makeGroup(workspace.workspaceId, workspace.title || workspace.path || '', members))
      }
      const strays = Object.values(rows).filter(
        (row) => row !== undefined && row !== null && !accounted.has(row.id) && treeVisible(row, archived),
      )
      if (strays.length > 0) groups.push(makeGroup('', ungroupedLabel, strays))
      return groups.filter((group) => group.total > 0)
    }

    /**
     * The Session currently shown in the main column.
     * @param sessions - Session-list snapshot.
     * @returns its id, or undefined while no Session is retained by the main view.
     */
    function currentTreeSessionId(sessions) {
      if (sessions === null || sessions === undefined || sessions.byId === undefined) return undefined
      const rows = sessions.byId
      for (const id of Object.keys(rows)) {
        const row = rows[id]
        const retained = row !== null && row !== undefined ? row.retainedBy : undefined
        if (retained !== null && retained !== undefined && (retained.mainView || 0) > 0) return id
      }
      return undefined
    }

    /**
     * Ids visible under a title filter: matches plus their ancestors.
     * @param groups - derived forest groups.
     * @param query - raw filter input.
     * @returns the visible id set, or null when the filter is empty.
     */
    function collectVisibleTreeIds(groups, query) {
      const needle = query.trim().toLowerCase()
      if (needle === '') return null
      const visible = new Set()
      const visit = (group, row) => {
        let matched = treeTitle(row, () => '').toLowerCase().includes(needle)
        for (const kid of group.children.get(row.id) || []) {
          if (visit(group, kid)) matched = true
        }
        if (matched) visible.add(row.id)
        return matched
      }
      for (const group of groups) for (const root of group.roots) visit(group, root)
      return visible
    }

    /**
     * Session state dot copied from the host's `StateDot`: a breathing/rotating
     * ring for ongoing work, a 6px core for every settled state.
     * @param props.state - `ongoing`, `warning`, `done`, `error`, or `idle`.
     * @returns the dot.
     */
    function TreeStateDot(props) {
      if (props.state === 'ongoing') {
        return h(
          'svg',
          {
            className: 'dsf-tree-spinner',
            viewBox: '0 0 24 24',
            width: 14,
            height: 14,
            'aria-hidden': true,
            focusable: 'false',
          },
          h(
            'g',
            { key: 'motion', className: 'dsf-tree-spinner-motion' },
            h('circle', { key: 'track', className: 'dsf-tree-spinner-track', cx: 12, cy: 12, r: 9.5 }),
            h('circle', { key: 'arc', className: 'dsf-tree-spinner-arc', cx: 12, cy: 12, r: 9.5 }),
          ),
        )
      }
      return h('span', { className: 'dsf-tree-dot', 'data-state': props.state, 'aria-hidden': true })
    }

    /**
     * Count running direct subagent children exactly like the host row.
     * @param sessions - Session-list snapshot.
     * @param statuses - live status map, when available.
     * @param parentId - parent Session id.
     * @returns the number of running direct subagents.
     */
    function runningTreeChildren(sessions, statuses, parentId) {
      if (sessions === null || sessions === undefined || sessions.projectionsBySession === undefined) return 0
      const projection = sessions.projectionsBySession[parentId]
      const catalog = projection !== null && projection !== undefined && projection.values !== undefined ? projection.values.subagentCatalog : undefined
      if (!Array.isArray(catalog)) return 0
      let count = 0
      for (const child of catalog) {
        const status = statuses !== undefined && typeof statuses.get === 'function' ? statuses.get(child.id) : undefined
        const running = status !== undefined && status !== null && status.running !== undefined
          ? status.running === true
          : sessions.byId !== undefined && sessions.byId[child.id] !== undefined && sessions.byId[child.id].running === true
        if (running) count += 1
      }
      return count
    }

    /**
     * Resolve one row's primary status exactly like the host row: pending
     * interaction is primary, live activity (including running subagents)
     * outranks completion reminders.
     * @param row - Session-list row.
     * @param status - live `SessionStatusSnapshot` for the row, when present.
     * @param runningChildren - running direct subagent count.
     * @returns the `StateDot` state.
     */
    function treeDotState(row, status, runningChildren) {
      if (status !== null && status !== undefined) {
        if (status.pendingInteraction !== undefined && status.pendingInteraction !== null) return 'warning'
        if (status.running === true || runningChildren > 0) return 'ongoing'
        if (status.completionUnread === true) return 'done'
        return 'idle'
      }
      return row.running === true || runningChildren > 0 ? 'ongoing' : 'idle'
    }

    /**
     * Whether the given target is a descendant of the ancestor in the current
     * (override-applied) tree. Used to reject cycle-producing drops.
     * @param groups - derived forest groups.
     * @param ancestorId - prospective dragged parent.
     * @param targetId - prospective drop target.
     * @returns true when targetId sits under ancestorId.
     */
    function treeHasDescendant(groups, ancestorId, targetId) {
      for (const group of groups) {
        const stack = [...(group.children.get(ancestorId) || [])]
        while (stack.length > 0) {
          const node = stack.pop()
          if (node.id === targetId) return true
          stack.push(...(group.children.get(node.id) || []))
        }
      }
      return false
    }

    /**
     * Recursive tree rows for one Workspace group.
     * @param props.group - derived group.
     * @param props.roots - rows to render at this level.
     * @param props.level - ARIA level of this level's rows.
     * @param props.visible - filtered id set, or null when unfiltered.
     * @param props.collapsed - collapsed node ids.
     * @param props.currentId - selected Session id.
     * @param props.pinned - pinned Session id set.
     * @param props.stateOf - resolves one row's `StateDot` state.
     * @param props.onToggle - collapse toggle callback.
     * @param props.onOpen - open-Session callback.
     * @param props.onPinToggle - pin/unpin callback.
     * @param props.onArchive - archive callback.
     * @param props.onMenu - row menu callback (row, x, y).
     * @param props.drag - drag/drop state and callbacks.
     * @param props.t - bound locale translate.
     * @returns the tree rows.
     */
    function TreeNodes(props) {
      const { group, roots, level, visible, collapsed, currentId, pinned, stateOf, onToggle, onOpen, onPinToggle, onArchive, onMenu, drag, t } = props
      return roots.map((row) => {
        const children = group.children.get(row.id) || []
        const shownChildren = visible === null ? children : children.filter((child) => visible.has(child.id))
        const isCollapsed = visible === null && collapsed.has(row.id)
        const expanded = shownChildren.length > 0 && !isCollapsed
        const isPinned = pinned.has(row.id)
        const isDragging = drag.active !== null && drag.active.id === row.id
        const isDropTarget = drag.drop !== null && drag.drop.kind === 'row' && drag.drop.id === row.id
        return h(
          'div',
          { key: row.id, className: 'dsf-tree-node' },
          h(
            'div',
            {
              className:
                'dsf-tree-row' +
                (row.id === currentId ? ' is-current' : '') +
                (isDragging ? ' is-dragging' : '') +
                (isDropTarget ? ' is-drop-target' : ''),
              role: 'treeitem',
              'data-session-id': row.id,
              'aria-level': level,
              'aria-expanded': shownChildren.length > 0 ? String(expanded) : undefined,
              'aria-selected': row.id === currentId,
              tabIndex: 0,
              draggable: true,
              onClick: () => onOpen(row.id),
              onContextMenu: (event) => {
                event.preventDefault()
                onMenu(row, event.clientX, event.clientY)
              },
              onDragStart: (event) => {
                if (event.target instanceof Element && event.target.closest('button') !== null) {
                  event.preventDefault()
                  return
                }
                event.dataTransfer.effectAllowed = 'move'
                try {
                  event.dataTransfer.setData('text/plain', row.id)
                } catch (error) {
                  // Some embedded browsers deny custom drag payloads; the
                  // plugin drag state below still carries the row id.
                }
                drag.start(row, group.key)
              },
              onDragEnd: drag.end,
              onDragOver: (event) => {
                if (!drag.canDropRow(row, group.key)) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                drag.overRow(row, group.key)
              },
              onDrop: (event) => {
                if (!drag.canDropRow(row, group.key)) return
                event.preventDefault()
                drag.dropRow(row, group.key)
              },
              onKeyDown: (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpen(row.id)
                } else if (event.key === 'ArrowRight' && shownChildren.length > 0 && isCollapsed) {
                  event.preventDefault()
                  onToggle(row.id)
                } else if (event.key === 'ArrowLeft' && shownChildren.length > 0 && !isCollapsed) {
                  event.preventDefault()
                  onToggle(row.id)
                }
              },
            },
            shownChildren.length > 0
              ? h(
                  'button',
                  {
                    key: 'twisty',
                    type: 'button',
                    className: 'dsf-tree-twisty' + (isCollapsed ? ' is-collapsed' : ''),
                    'aria-label': t('tree.toggleNode'),
                    onClick: (event) => {
                      event.stopPropagation()
                      onToggle(row.id)
                    },
                  },
                  h('span', { key: 'chev', className: 'dsf-tree-chev' }),
                )
              : h('span', { key: 'twisty', className: 'dsf-tree-twisty is-spacer' }),
            h('span', { key: 'state', className: 'dsf-tree-state-slot' }, h(TreeStateDot, { state: stateOf(row) })),
            h('span', { key: 'title', className: 'dsf-tree-title' }, treeTitle(row, t)),
            shownChildren.length > 0
              ? h('span', { key: 'count', className: 'dsf-tree-count' }, String(shownChildren.length))
              : null,
            h(
              'span',
              {
                key: 'actions',
                className: 'dsf-tree-actions',
                onClick: (event) => event.stopPropagation(),
                onPointerDown: (event) => event.stopPropagation(),
              },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsf-tree-action',
                  title: t('tree.more'),
                  'aria-label': t('tree.more'),
                  onClick: (event) => {
                    event.stopPropagation()
                    const rect = event.currentTarget.getBoundingClientRect()
                    onMenu(row, rect.left, rect.bottom + 4)
                  },
                },
                h(EllipsisIcon, {}),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsf-tree-action',
                  title: t('tree.archive'),
                  'aria-label': t('tree.archive'),
                  onClick: (event) => {
                    event.stopPropagation()
                    onArchive(row)
                  },
                },
                h(ArchiveIcon, {}),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsf-tree-action' + (isPinned ? ' is-pinned' : ''),
                  title: t(isPinned ? 'tree.unpin' : 'tree.pin'),
                  'aria-label': t(isPinned ? 'tree.unpin' : 'tree.pin'),
                  onClick: (event) => {
                    event.stopPropagation()
                    onPinToggle(row, isPinned)
                  },
                },
                h(PinIcon, { filled: isPinned }),
              ),
            ),
          ),
          expanded
            ? h(
                'div',
                { key: 'children', className: 'dsf-tree-children', role: 'group' },
                h(TreeNodes, { ...props, roots: shownChildren, level: level + 1 }),
              )
            : null,
        )
      })
    }

    /**
     * Workspace-grouped tree body.
     * @param props.groups - derived forest groups.
     * @returns the group rows.
     */
    function TreeGroups(props) {
      const { groups, visible, collapsed, onToggle, drag, t } = props
      const rendered = []
      for (const group of groups) {
        const groupKey = 'ws:' + group.key
        const roots = visible === null ? group.roots : group.roots.filter((row) => visible.has(row.id))
        if (visible !== null && roots.length === 0) continue
        const groupCollapsed = visible === null && collapsed.has(groupKey)
        const isDropTarget = drag.drop !== null && drag.drop.kind === 'group' && drag.drop.key === group.key
        rendered.push(
          h(
            'div',
            { key: groupKey, className: 'dsf-tree-group' },
            h(
              'div',
              {
                className: 'dsf-tree-group-header' + (isDropTarget ? ' is-drop-target' : ''),
                role: 'treeitem',
                'aria-level': 1,
                'aria-expanded': String(!groupCollapsed),
                tabIndex: 0,
                title: drag.active === null ? undefined : t('tree.drag.rootHint'),
                onClick: () => onToggle(groupKey),
                onKeyDown: (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onToggle(groupKey)
                  }
                },
                onDragOver: (event) => {
                  if (!drag.canDropGroup(group.key)) return
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  drag.overGroup(group.key)
                },
                onDrop: (event) => {
                  if (!drag.canDropGroup(group.key)) return
                  event.preventDefault()
                  drag.dropGroup(group.key)
                },
              },
              h(
                'span',
                {
                  key: 'twisty',
                  className: 'dsf-tree-twisty' + (groupCollapsed ? ' is-collapsed' : ''),
                  'aria-hidden': true,
                },
                h('span', { key: 'chev', className: 'dsf-tree-chev' }),
              ),
              h('span', { key: 'name', className: 'dsf-tree-group-name' }, group.title),
              h('span', { key: 'count', className: 'dsf-tree-group-count' }, String(group.total)),
            ),
            groupCollapsed
              ? null
              : h(
                  'div',
                  { key: 'body', className: 'dsf-tree-group-body' },
                  roots.length === 0
                    ? h('div', { key: 'empty', className: 'dsf-tree-empty' }, t('tree.noSessions'))
                    : h(TreeNodes, { ...props, group, roots, level: 2 }),
                ),
          ),
        )
      }
      return rendered
    }

    /**
     * Track the sidebar workspace region while the tree is open or closed.
     * Also measures the host header's icon cluster so the closed-state launcher
     * can sit left of those buttons instead of at a fixed offset.
     * @param active - whether measurement is needed.
     * @returns the region rect plus the header icons' left edge, or null.
     */
    function useSidebarRegion(active) {
      const [rect, setRect] = React.useState(null)
      React.useEffect(() => {
        if (!active) {
          setRect(null)
          return undefined
        }
        let frame = 0
        let attempts = 0
        const schedule = () => {
          if (frame === 0) frame = window.requestAnimationFrame(measure)
        }
        const measure = () => {
          frame = 0
          let element = null
          const anchor = document.querySelector('[data-slot="sidebar.workspaces"]')
          if (anchor !== null) element = anchor.firstElementChild
          if (!(element instanceof HTMLElement)) {
            const fallback = document.querySelector('[data-slot="sidebar"]')
            if (fallback !== null) element = fallback.firstElementChild
          }
          if (!(element instanceof HTMLElement)) {
            if (attempts < 60) {
              attempts += 1
              schedule()
            }
            return
          }
          const bounds = element.getBoundingClientRect()
          if (bounds.width < 160 || bounds.height < 120) {
            setRect(null)
            return
          }
          let headerLeft = null
          let headerCenterY = null
          let minLeft = Number.POSITIVE_INFINITY
          let centerSum = 0
          let centerCount = 0
          for (const button of element.querySelectorAll('button')) {
            if (!(button instanceof HTMLElement)) continue
            const box = button.getBoundingClientRect()
            if (box.width < 1 || box.height < 1) continue
            if (box.top < bounds.top - 1 || box.top > bounds.top + 48) continue
            if (box.right > bounds.right + 1) continue
            if (box.left < minLeft) minLeft = box.left
            centerSum += box.top + box.height / 2
            centerCount += 1
          }
          if (Number.isFinite(minLeft)) headerLeft = minLeft
          if (centerCount > 0) headerCenterY = centerSum / centerCount
          let searchOpen = false
          for (const input of element.querySelectorAll('input')) {
            if (!(input instanceof HTMLElement)) continue
            const box = input.getBoundingClientRect()
            if (box.width < 20 || box.height < 1) continue
            if (box.top < bounds.top - 1 || box.top > bounds.top + 48) continue
            searchOpen = true
            break
          }
          let labelLeft = null
          let labelTop = null
          let labelWidth = null
          let labelHeight = null
          const header = element.firstElementChild
          if (header instanceof HTMLElement) {
            const candidate = header.firstElementChild
            if (candidate instanceof HTMLElement && candidate.tagName === 'SPAN') {
              const box = candidate.getBoundingClientRect()
              if (box.width > 8 && box.height > 8) {
                labelLeft = box.left
                labelTop = box.top
                labelWidth = box.width
                labelHeight = box.height
              }
            }
          }
          const next = {
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
            headerLeft,
            headerCenterY,
            searchOpen,
            labelLeft,
            labelTop,
            labelWidth,
            labelHeight,
          }
          const sameNumber = (a, b) => a === b || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 0.5)
          setRect((previous) => {
            if (previous === null) return next
            return Math.abs(previous.left - next.left) < 0.5 &&
              Math.abs(previous.top - next.top) < 0.5 &&
              Math.abs(previous.width - next.width) < 0.5 &&
              Math.abs(previous.height - next.height) < 0.5 &&
              sameNumber(previous.headerLeft, next.headerLeft) &&
              sameNumber(previous.headerCenterY, next.headerCenterY) &&
              sameNumber(previous.labelLeft, next.labelLeft) &&
              sameNumber(previous.labelTop, next.labelTop) &&
              sameNumber(previous.labelWidth, next.labelWidth) &&
              sameNumber(previous.labelHeight, next.labelHeight) &&
              previous.searchOpen === next.searchOpen
              ? previous
              : next
          })
        }
        schedule()
        const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null
        const columnAnchor = document.querySelector('[data-slot="sidebar"]')
        const column = columnAnchor === null ? null : columnAnchor.firstElementChild
        if (observer !== null && column instanceof HTMLElement) observer.observe(column)
        const regionAnchor = document.querySelector('[data-slot="sidebar.workspaces"]')
        const region = regionAnchor === null ? null : regionAnchor.firstElementChild
        if (observer !== null && region instanceof HTMLElement) observer.observe(region)
        // Search open/close is a DOM swap without a size change; pointer/key/focus
        // events schedule a re-measure after React commits.
        document.addEventListener('focusin', schedule, true)
        document.addEventListener('focusout', schedule, true)
        document.addEventListener('pointerdown', schedule, true)
        document.addEventListener('keydown', schedule, true)
        window.addEventListener('resize', schedule)
        return () => {
          if (frame !== 0) window.cancelAnimationFrame(frame)
          if (observer !== null) observer.disconnect()
          document.removeEventListener('focusin', schedule, true)
          document.removeEventListener('focusout', schedule, true)
          document.removeEventListener('pointerdown', schedule, true)
          document.removeEventListener('keydown', schedule, true)
          window.removeEventListener('resize', schedule)
        }
      }, [active])
      return rect
    }

    /**
     * The fork-tree entry: an icon launcher in the Workspace section header
     * while closed, and the tree panel covering the sidebar browser while open.
     * @param props.useSessions - root Session-list selector hook.
     * @param props.useWorkspaces - root Workspace selector hook.
     * @param props.useSessionStatus - root live status selector hook.
     * @param props.t - bound locale translate.
     * @returns the launcher icon or the panel.
     */
    function ForkTreePanel(props) {
      const open = useStore(treeOpenStore)
      const sessions = typeof props.useSessions === 'function' ? props.useSessions((state) => state) : undefined
      const workspaces = typeof props.useWorkspaces === 'function' ? props.useWorkspaces((state) => state) : undefined
      const statuses = typeof props.useSessionStatus === 'function' ? props.useSessionStatus((state) => state) : undefined
      const [filter, setFilter] = React.useState('')
      const [collapsed, setCollapsed] = React.useState(loadTreeCollapsed)
      const [parents, setParents] = React.useState(loadTreeParents)
      const [dragActive, setDragActive] = React.useState(null)
      const [dragDrop, setDragDrop] = React.useState(null)
      const rect = useSidebarRegion(true)
      const t = typeof props.t === 'function' ? props.t : (key) => key
      React.useEffect(() => {
        saveTreeCollapsed(collapsed)
      }, [collapsed])
      React.useEffect(() => {
        saveTreeParents(parents)
      }, [parents])
      React.useEffect(() => {
        if (!open) return undefined
        const onKeyDown = (event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            treeOpenStore.set(false)
          }
        }
        document.addEventListener('keydown', onKeyDown, true)
        return () => document.removeEventListener('keydown', onKeyDown, true)
      }, [open])
      if (rect === null) return null
      if (!open) {
        if (rect.searchOpen === true) return null
        const headerLeft = typeof rect.headerLeft === 'number' ? rect.headerLeft : rect.left + rect.width - 130
        const centerY = typeof rect.headerCenterY === 'number' ? rect.headerCenterY : rect.top + 18
        const left = Math.max(rect.left + 8, headerLeft - 8 - 28)
        const parts = []
        if (typeof rect.labelLeft === 'number' && rect.labelWidth !== null && rect.labelWidth > 8) {
          parts.push(
            h('button', {
              key: 'label',
              type: 'button',
              className: 'dsf-tree-label-hit',
              style: {
                left: String(rect.labelLeft - 9) + 'px',
                top: String(rect.labelTop - 3) + 'px',
                width: String(rect.labelWidth + 18) + 'px',
                height: String(rect.labelHeight + 6) + 'px',
              },
              'aria-label': t('tree.toggle'),
              title: t('tree.toggle'),
              onClick: () => treeOpenStore.set(true),
            }),
          )
        }
        parts.push(
          h(
            'button',
            {
              key: 'launcher',
              type: 'button',
              className: 'dsf-tree-launcher',
              style: {
                left: String(left) + 'px',
                top: String(centerY - 14) + 'px',
              },
              'aria-label': t('tree.toggle'),
              title: t('tree.toggle'),
              onClick: () => treeOpenStore.set(true),
            },
            h(BranchIcon, { size: 15 }),
          ),
        )
        return h(React.Fragment, null, parts)
      }
      if (sessions === undefined || workspaces === undefined) return null
      const groups = buildForest(sessions, workspaces, t('tree.ungrouped'), parents)
      const visible = filter.trim() === '' ? null : collectVisibleTreeIds(groups, filter)
      const currentId = currentTreeSessionId(sessions)
      const pinned = new Set(
        workspaces !== null && workspaces !== undefined && Array.isArray(workspaces.pinnedSessionIds)
          ? workspaces.pinnedSessionIds
          : [],
      )
      const notify = typeof props.notify === 'function' ? props.notify : () => {}
      const pinSession = typeof props.pinSession === 'function' ? props.pinSession : null
      const unpinSession = typeof props.unpinSession === 'function' ? props.unpinSession : null
      const archiveSession = typeof props.archiveSession === 'function' ? props.archiveSession : null
      const forkSession = typeof props.forkSession === 'function' ? props.forkSession : null
      const copySessionId = typeof props.copySessionId === 'function' ? props.copySessionId : null
      const openFolder = typeof props.openFolder === 'function' ? props.openFolder : null
      const stateOf = (row) => treeDotState(
        row,
        statuses !== undefined && typeof statuses.get === 'function' ? statuses.get(row.id) : undefined,
        runningTreeChildren(sessions, statuses, row.id),
      )
      const onOpen = (id) => treeOpenSession(id)
      const onToggle = (id) => {
        setCollapsed((previous) => {
          const next = new Set(previous)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })
      }
      const pinToggle = (row, isPinned) => {
        const action = isPinned ? unpinSession : pinSession
        if (action === null) return
        Promise.resolve(action(row.id)).then(
          () => notify(t(isPinned ? 'tree.notice.unpinned' : 'tree.notice.pinned'), 'success'),
          () => notify(t('tree.notice.failed'), 'error'),
        )
      }
      const forkRow = (row) => {
        if (forkSession === null) return
        Promise.resolve(forkSession(row.id)).catch(() => notify(t('tree.notice.failed'), 'error'))
      }
      const archiveRow = (row) => {
        if (archiveSession === null) return
        const finish = () => notify(t('tree.notice.archived'), 'success')
        const failHard = () => notify(t('tree.notice.failed'), 'error')
        const fail = (error) => {
          const active = error instanceof Error &&
            error.name === 'WorkspaceArchiveError' &&
            error.rpcError !== undefined && error.rpcError !== null &&
            error.rpcError.code === 'workspace/session-active'
          if (!active) {
            failHard()
            return
          }
          menuStore.set({
            x: Math.max(16, Math.round(window.innerWidth / 2 - 120)),
            y: Math.max(16, Math.round(window.innerHeight / 2 - 80)),
            title: t('tree.archiveConfirm.title'),
            rows: () => [
              {
                key: 'stop',
                label: t('tree.archiveConfirm.stop'),
                icon: h(ArchiveIcon, {}),
                onSelect: () => {
                  Promise.resolve(archiveSession(row.id, { stopActivity: true })).then(finish, failHard)
                },
              },
              {
                key: 'cancel',
                label: t('tree.archiveConfirm.cancel'),
                onSelect: () => {},
              },
            ],
          })
        }
        Promise.resolve(archiveSession(row.id)).then(finish, fail)
      }
      const resetParent = (row) => {
        setParents((previous) => {
          if (!Object.prototype.hasOwnProperty.call(previous, row.id)) return previous
          const next = { ...previous }
          delete next[row.id]
          return next
        })
      }
      const openRowMenu = (row, x, y) => {
        const isPinned = pinned.has(row.id)
        const rows = [
          {
            key: 'pin',
            label: t(isPinned ? 'tree.unpin' : 'tree.pin'),
            icon: h(PinIcon, { filled: isPinned }),
            onSelect: () => pinToggle(row, isPinned),
          },
          {
            key: 'fork',
            label: t('tree.fork'),
            icon: h(BranchIcon, {}),
            onSelect: () => forkRow(row),
          },
          {
            key: 'archive',
            label: t('tree.archive'),
            icon: h(ArchiveIcon, {}),
            onSelect: () => archiveRow(row),
          },
          { key: 'sep-1', separator: true },
          {
            key: 'copy-id',
            label: t('tree.copyId'),
            icon: h(CopyIcon, {}),
            onSelect: () => {
              if (copySessionId !== null) void copySessionId(row.id)
            },
          },
          {
            key: 'open-folder',
            label: t('tree.openFolder'),
            icon: h(FolderIcon, {}),
            onSelect: () => {
              if (openFolder !== null) void openFolder(row.id)
            },
          },
        ]
        if (Object.prototype.hasOwnProperty.call(parents, row.id)) {
          rows.push({ key: 'sep-2', separator: true })
          rows.push({
            key: 'reset-parent',
            label: t('tree.resetParent'),
            icon: h(BranchIcon, {}),
            onSelect: () => resetParent(row),
          })
        }
        menuStore.set({ x, y, title: treeTitle(row, t), rows: () => rows })
      }
      const drag = {
        active: dragActive,
        drop: dragDrop,
        start: (row, groupKey) => {
          setDragActive({ id: row.id, groupKey })
          setDragDrop(null)
        },
        end: () => {
          setDragActive(null)
          setDragDrop(null)
        },
        canDropRow: (row, groupKey) =>
          dragActive !== null &&
          dragActive.groupKey === groupKey &&
          dragActive.id !== row.id &&
          !treeHasDescendant(groups, dragActive.id, row.id),
        canDropGroup: (groupKey) => dragActive !== null && dragActive.groupKey === groupKey,
        overRow: (row) => setDragDrop({ kind: 'row', id: row.id }),
        overGroup: (groupKey) => setDragDrop({ kind: 'group', key: groupKey }),
        dropRow: (row, groupKey) => {
          if (dragActive === null || dragActive.groupKey !== groupKey || dragActive.id === row.id) return
          if (treeHasDescendant(groups, dragActive.id, row.id)) return
          setParents((previous) => ({ ...previous, [dragActive.id]: row.id }))
          setDragActive(null)
          setDragDrop(null)
        },
        dropGroup: (groupKey) => {
          if (dragActive === null || dragActive.groupKey !== groupKey) return
          setParents((previous) => ({ ...previous, [dragActive.id]: null }))
          setDragActive(null)
          setDragDrop(null)
        },
      }
      const noMatches = visible !== null && visible.size === 0
      return h(
        'section',
        {
          className: 'dsf-tree-panel',
          style: {
            left: String(rect.left) + 'px',
            top: String(rect.top) + 'px',
            width: String(rect.width) + 'px',
            height: String(rect.height) + 'px',
          },
          'aria-label': t('tree.title'),
        },
        h(
          'div',
          { className: 'dsf-tree-head' },
          h(
            'div',
            { className: 'dsf-tree-heading' },
            h(
              'button',
              {
                type: 'button',
                className: 'dsf-tree-heading-title',
                title: t('tree.close'),
                'aria-label': t('tree.close'),
                onClick: () => treeOpenStore.set(false),
              },
              t('tree.title'),
            ),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dsf-tree-close',
              'aria-label': t('tree.close'),
              title: t('tree.close'),
              onClick: () => treeOpenStore.set(false),
            },
            h(FolderIcon, { key: 'folder', size: 16 }),
          ),
        ),
        h(
          'div',
          { className: 'dsf-tree-search' },
          h(SearchIcon, {}),
          h('input', {
            value: filter,
            placeholder: t('tree.filter'),
            'aria-label': t('tree.filter'),
            onChange: (event) => setFilter(event.target.value),
          }),
        ),
        noMatches
          ? h('div', { className: 'dsf-tree-empty' }, t('tree.noMatches'))
          : groups.length === 0
            ? h('div', { className: 'dsf-tree-empty' }, t('tree.noSessions'))
            : h(
                'div',
                { className: 'dsf-tree-scroll', role: 'tree', 'aria-label': t('tree.title') },
                h(TreeGroups, {
                  groups,
                  visible,
                  collapsed,
                  currentId,
                  pinned,
                  stateOf,
                  onToggle,
                  onOpen,
                  onPinToggle: pinToggle,
                  onArchive: archiveRow,
                  onMenu: openRowMenu,
                  drag,
                  t,
                }),
              ),
      )
    }

    /**
     * Session "..." menu row that opens the tree view.
     * @param props.useMenuOpenState - injected hook returning the menu state pair.
     * @param props.t - bound locale translate.
     * @returns the menu row.
     */
    function ForkTreeMenuItem(props) {
      const { useMenuOpenState } = props
      const t = typeof props.t === 'function' ? props.t : (key) => key
      const setMenuOpen = useMenuOpenState()[1]
      return h(MenuItem, {
        label: t('tree.menu'),
        icon: h(BranchIcon, {}),
        onSelect: () => {
          setMenuOpen(false)
          treeOpenStore.set(true)
        },
      })
    }

    /** Services the browser half reads: Session summaries, slots, copy, Remote. */
    const inject = ['sessions', 'slots', 'locale', 'remote', 'remote.session', 'uiWorkspace']

    /**
     * Client plugin body.
     * @param ctx - the Client root context.
     */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-session-folder: dictionaries')
      const t = ctx.locale.bind(NS)

      ctx.effect(() => {
        const style = document.createElement('style')
        style.dataset.plugin = '@dsh-external/dsh-session-folder'
        style.textContent = CSS
        document.head.appendChild(style)
        return () => {
          style.remove()
        }
      }, 'dsh-session-folder: styles')

      let noticeTimer = null
      ctx.effect(() => () => {
        if (noticeTimer !== null) clearTimeout(noticeTimer)
        noticeTimer = null
      }, 'dsh-session-folder: notice timer')

      /**
       * Announce one outcome.
       * @param text - localized message.
       * @param tone - `success` or `error`.
       */
      const notify = (text, tone) => {
        const current = noticeStore.get()
        noticeStore.set({ seq: current === null ? 1 : current.seq + 1, text, tone })
        if (noticeTimer !== null) clearTimeout(noticeTimer)
        noticeTimer = setTimeout(() => {
          noticeTimer = null
          noticeStore.set(null)
        }, NOTICE_MS)
      }

      /** Guards a second launch while a Host call is in flight. */
      let launching = false

      /**
       * Run one `openWorkspacePath` request and report failure through the notice.
       * @param payload - path plus optional reveal action or application id.
       * @returns whether the Host accepted the operation.
       */
      const openOnHost = async (payload) => {
        if (launching) return false
        launching = true
        try {
          const result = await ctx.remote.session.openWorkspacePath(payload)
          if (result !== undefined && result !== null && result.ok === true) return true
          notify(t('notice.failed'), 'error')
          return false
        } catch (error) {
          console.warn('session folder: open rejected', error)
          notify(t('notice.failed'), 'error')
          return false
        } finally {
          launching = false
        }
      }

      /**
       * Open one Session's project folder in the local file manager.
       * @param sessionId - the row whose folder to open.
       */
      const openFolder = async (sessionId) => {
        const byId = ctx.sessions.list.getSnapshot().byId || {}
        const row = byId[sessionId]
        const path = row === undefined ? undefined : row.cwd
        if (typeof path !== 'string' || path === '') {
          notify(t('notice.noFolder'), 'error')
          return
        }
        await openOnHost({ path })
      }

      /**
       * Write one string to the clipboard and report the outcome.
       * @param text - value to copy.
       * @param message - localized success message.
       */
      const copyText = async (text, message) => {
        if (typeof text !== 'string' || text === '') {
          notify(t('notice.noPath'), 'error')
          return
        }
        try {
          await navigator.clipboard.writeText(text)
          notify(message, 'success')
        } catch (error) {
          console.warn('session folder: copy rejected', error)
          notify(t('notice.copyFailed'), 'error')
        }
      }

      /**
       * Hand one http(s) URL to the desktop. The shell's window-open policy
       * denies the popup and forwards http(s) URLs to the system browser
       * (`shell.openExternal`); a plain browser deployment opens a new tab.
       * @param url - absolute http(s) URL.
       */
      const openExternal = (url) => {
        try {
          window.open(url, '_blank', 'noopener,noreferrer')
        } catch (error) {
          console.warn('session folder: open link rejected', error)
          notify(t('notice.openLinkFailed'), 'error')
        }
      }

      /**
       * Rows of the file menu: open / reveal, then the two copies.
       * @param absolute - absolute file path.
       * @param relative - path relative to the project folder.
       * @returns a row builder for the shared menu.
       */
      const fileMenuRows = (absolute, relative) => () => {
        const rows = [
          {
            key: 'open',
            label: t('file.open'),
            icon: h(OpenIcon, {}),
            onSelect: () => {
              void openOnHost({ path: absolute })
            },
          },
          {
            key: 'reveal',
            label: t('file.reveal'),
            icon: h(FolderIcon, {}),
            onSelect: () => {
              void openOnHost({ path: absolute, action: 'reveal' })
            },
          },
        ]
        rows.push({ key: 'sep', separator: true })
        rows.push(
          {
            key: 'abs',
            label: t('file.copyAbsolute'),
            icon: h(CopyIcon, {}),
            onSelect: () => {
              void copyText(absolute, t('notice.copiedAbsolute'))
            },
          },
          {
            key: 'rel',
            label: t('file.copyRelative'),
            icon: h(CopyIcon, {}),
            onSelect: () => {
              void copyText(relative, t('notice.copiedRelative'))
            },
          },
        )
        return rows
      }

      /**
       * Rows of the link menu.
       * @param url - absolute http(s) URL.
       * @returns a row builder for the shared menu.
       */
      const linkMenuRows = (url) => () => [
        {
          key: 'open',
          label: t('url.open'),
          icon: h(GlobeIcon, {}),
          onSelect: () => {
            openExternal(url)
          },
        },
        {
          key: 'copy',
          label: t('url.copy'),
          icon: h(CopyIcon, {}),
          onSelect: () => {
            void copyText(url, t('notice.copiedLink'))
          },
        },
      ]

      /**
       * The cwd of the Session shown in the main view, which is the base a
       * conversation file path is relative to.
       * @returns the workspace directory, or undefined without one.
       */
      const currentCwd = () => {
        const rows = Object.values(ctx.sessions.list.getSnapshot().byId || {})
        let main
        let fallback
        for (const row of rows) {
          if (typeof row.cwd !== 'string' || row.cwd === '') continue
          if (fallback === undefined) fallback = row
          const retained = row.retainedBy === undefined ? 0 : row.retainedBy.mainView || 0
          if (retained <= 0) continue
          if (main === undefined || row.updatedAt > main.updatedAt) main = row
        }
        if (main !== undefined) return main.cwd
        return fallback === undefined ? undefined : fallback.cwd
      }

      /**
       * Show the one-row "open this directory" menu at a pointer position.
       * @param path - absolute directory.
       * @param x - pointer x.
       * @param y - pointer y.
       * @param title - accessible name of the menu.
       */
      const showFolderMenu = (path, x, y, title) => {
        menuStore.set({
          x,
          y,
          title,
          rows: () => [
            {
              key: 'open',
              label: t('menu.open'),
              icon: h(FolderIcon, {}),
              onSelect: () => {
                void openOnHost({ path })
              },
            },
          ],
        })
      }

      /**
       * Open this plugin's file (or folder) menu for the conversation reference
       * under the pointer. Two shapes reach here:
       *  - assistant file mentions and file links, whose `title` is the path;
       *  - user-message `@file` / `@folder` references, whose `title` is the raw
       *    spelling (`@path`, possibly quoted) and whose navigation stays in the
       *    chat bubble.
       * @param target - event target.
       * @param event - the contextmenu event.
       * @returns whether this handler consumed the event.
       */
      const openFileMenuAt = (target, event) => {
        const button = target.closest('button')
        if (!(button instanceof HTMLButtonElement)) return false
        const className = typeof button.className === 'string' ? button.className : ''
        if (!className.includes(FILE_MENTION_CLASS)) return false
        const rawTitle = button.getAttribute('title')
        const referenceKind = button.getAttribute('data-ref-chip')
        let value = ''
        let folder = false
        if (referenceKind === null) {
          if (typeof rawTitle === 'string' && rawTitle.trim() !== '') {
            value = rawTitle.trim()
          } else {
            // An image link drops `title` once the chat can preview it, so the
            // path is read from the link component's props; only when that is
            // unavailable fall back to a label that happens to name a file.
            const fromProps = pathFromReactProps(button)
            if (typeof fromProps === 'string' && fromProps !== '') {
              value = fromProps
            } else {
              value = (button.textContent === null ? '' : button.textContent).trim()
              if (!looksLikeFilePath(value)) return false
            }
          }
          if (value === '' || value.startsWith('@')) return false
        } else {
          if (typeof rawTitle !== 'string') return false
          // Only file and folder references name a path; session, skill, and
          // command chips carry a label instead. They also belong to the chat
          // itself, so the composer's pending references stay untouched.
          if (referenceKind !== 'file' && referenceKind !== 'folder') return false
          if (button.closest('[data-chat-node-key]') === null) return false
          value = stripReference(rawTitle, referenceKind === 'folder')
          if (value === '') return false
          folder = referenceKind === 'folder'
        }
        const cwd = currentCwd()
        const absolute = isAbsolutePath(value) || cwd === undefined ? value : joinPath(cwd, value)
        event.preventDefault()
        if (folder) {
          showFolderMenu(absolute, event.clientX, event.clientY, t('folder.title'))
          return true
        }
        const relative = isAbsolutePath(value) ? relativeTo(value, cwd) : value.replace(/^\.\//, '').replace(/\\/g, '/')
        menuStore.set({
          x: event.clientX,
          y: event.clientY,
          title: t('file.title'),
          rows: fileMenuRows(absolute, relative),
        })
        return true
      }

      /**
       * Open this plugin's link menu for an http(s) anchor under the pointer.
       * @param target - event target.
       * @param event - the contextmenu event.
       * @returns whether this handler consumed the event.
       */
      const openLinkMenuAt = (target, event) => {
        const anchor = target.closest('a[href]')
        if (!(anchor instanceof HTMLAnchorElement)) return false
        let url
        try {
          url = new URL(anchor.href)
        } catch (error) {
          return false
        }
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
        event.preventDefault()
        menuStore.set({
          x: event.clientX,
          y: event.clientY,
          title: t('url.title'),
          rows: linkMenuRows(url.href),
        })
        return true
      }

      /**
       * Open the plugin's workspace menu on right-click. The workspace row's
       * own "..." menu has no extension slot, so this plugin offers its one
       * workspace action (open the folder) on the row itself; rename and delete
       * stay on "...".
       * @param target - event target.
       * @param event - the contextmenu event.
       * @returns whether this handler consumed the event.
       */
      const openWorkspaceMenuAt = (target, event) => {
        const row = target.closest('[data-row-key]')
        if (!(row instanceof HTMLElement)) return false
        const key = row.getAttribute('data-row-key')
        if (typeof key !== 'string' || !key.startsWith(WORKSPACE_ROW_PREFIX)) return false
        const workspaceId = key.slice(WORKSPACE_ROW_PREFIX.length)
        if (workspaceId === '') return false
        const path = workspacePathStore.get().get(workspaceId)
        if (typeof path !== 'string' || path === '') return false
        event.preventDefault()
        showFolderMenu(path, event.clientX, event.clientY, t('workspace.title'))
        return true
      }

      /**
       * Open one Session row's own "..." menu on right-click. The menu belongs
       * to the workspace browser; activating its trigger button is exactly what
       * a left click on "..." does, so every row it carries — including this
       * plugin's folder row — behaves the same.
       * @param target - event target.
       * @param event - the contextmenu event.
       */
      const openSessionMenuAt = (target, event) => {
        const row = target.closest('[data-row-key]')
        if (!(row instanceof HTMLElement)) return
        const key = row.getAttribute('data-row-key')
        if (typeof key !== 'string' || !key.startsWith(SESSION_ROW_PREFIX)) return
        if (key.length <= SESSION_ROW_PREFIX.length) return
        const actions = row.querySelector('[class*="rowActions"]')
        if (!(actions instanceof HTMLElement)) return
        // The menu trigger is the first button of the row's action seat; the
        // row-action slot buttons follow it.
        const trigger = actions.querySelector('button')
        if (!(trigger instanceof HTMLButtonElement)) return
        event.preventDefault()
        trigger.click()
      }

      // Page-level right-click: a conversation file name opens the file menu,
      // an http(s) link opens the link menu, and a Session row opens that row's
      // own menu at the row.
      ctx.effect(() => {
        const onContextMenu = (event) => {
          const target = event.target
          if (!(target instanceof Element)) return
          if (openFileMenuAt(target, event)) return
          if (openLinkMenuAt(target, event)) return
          if (openWorkspaceMenuAt(target, event)) return
          openSessionMenuAt(target, event)
        }
        document.addEventListener('contextmenu', onContextMenu, true)
        return () => {
          document.removeEventListener('contextmenu', onContextMenu, true)
          menuStore.set(null)
        }
      }, 'dsh-session-folder: context menus')

      ctx.slots.inject('sidebar.workspaces.session.menu.item', () =>
        ctx.slots.register(
          {
            name: 'sidebar.workspaces.session.menu.item',
            id: 'dsh-session-folder.open-explorer',
            order: 440,
            locale: NS,
            inject: () => ({ openFolder }),
          },
          SessionFolderMenuItem,
        ),
      )

      ctx.slots.inject('shell.overlay', () =>
        ctx.slots.register({ name: 'shell.overlay', id: 'dsh-session-folder.workspace-paths', order: 19 }, WorkspacePathBridge),
      )

      ctx.slots.inject('shell.overlay', () =>
        ctx.slots.register({ name: 'shell.overlay', id: 'dsh-session-folder.file-menu', order: 20 }, ContextMenu),
      )

      ctx.slots.inject('shell.overlay', () =>
        ctx.slots.register({ name: 'shell.overlay', id: 'dsh-session-folder.notice', order: 21 }, SessionFolderNotice),
      )

      /**
       * Open one Session in the main column through the workspace navigation
       * face; the tree panel stays open so the user can keep browsing.
       * @param sessionId - Session to open.
       */
      /**
       * Open one Session in the main column through the workspace navigation
       * face; the tree panel stays open so the user can keep browsing.
       * @param sessionId - Session to open.
       */
      treeOpenSession = (sessionId) => {
        if (typeof sessionId !== 'string' || sessionId === '') return
        try {
          ctx.uiWorkspace.openSession(sessionId)
        } catch (error) {
          console.warn('session folder: open session rejected', error)
        }
      }

      ctx.slots.inject('sidebar.workspaces.session.menu.item', () =>
        ctx.slots.register(
          {
            name: 'sidebar.workspaces.session.menu.item',
            id: 'dsh-session-folder.fork-tree-menu',
            order: 445,
            locale: NS,
          },
          ForkTreeMenuItem,
        ),
      )

      ctx.slots.inject('shell.overlay', () =>
        ctx.slots.register(
          {
            name: 'shell.overlay',
            id: 'dsh-session-folder.fork-tree',
            order: 18,
            locale: NS,
            inject: () => ({
              pinSession: (sessionId) => ctx.uiWorkspace.pinSession(sessionId),
              unpinSession: (sessionId) => ctx.uiWorkspace.unpinSession(sessionId),
              archiveSession: (sessionId, options) => ctx.uiWorkspace.archiveSession(sessionId, options),
              forkSession: (sessionId) => ctx.uiWorkspace.forkSession(sessionId),
              copySessionId: (sessionId) => copyText(sessionId, t('tree.notice.sessionIdCopied')),
              openFolder: (sessionId) => openFolder(sessionId),
              notify,
            }),
          },
          ForkTreePanel,
        ),
      )
    }

    /**
     * Whether a path is absolute in either spelling the Host accepts.
     * @param value - path to classify.
     * @returns true for a POSIX, Windows drive, or UNC path.
     */
    function isAbsolutePath(value) {
      return value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value) || value.startsWith('\\\\')
    }

    /**
     * Whether a link label plausibly names a file, which is the last resort for
     * a link whose path is unavailable.
     * @param value - visible label.
     * @returns true when the label can be treated as a path.
     */
    function looksLikeFilePath(value) {
      if (value === '' || value.length > 260) return false
      if (/\s/.test(value)) return false
      return /\.[A-Za-z0-9]{1,10}$/.test(value)
    }

    /**
     * Recover the file path of the chat link that owns `node` from its React
     * props. The chat builds a file link from `{ file: { path } }` and drops the
     * `title` attribute as soon as an inline preview exists, so the props are
     * the only place the exact target survives; the visible label may differ.
     * @param node - element whose fiber ancestry to inspect.
     * @returns the path, or undefined when no ancestor carries one.
     */
    function pathFromReactProps(node) {
      let fiber
      try {
        const key = Object.keys(node).find((name) => name.startsWith('__reactFiber$') || name.startsWith('__reactInternalInstance$'))
        if (key === undefined) return undefined
        fiber = node[key]
        for (let depth = 0; fiber !== null && fiber !== undefined && depth < 40; depth += 1) {
          const props = fiber.memoizedProps
          const file = props !== null && typeof props === 'object' ? props.file : undefined
          const path = file !== null && typeof file === 'object' ? file.path : undefined
          if (typeof path === 'string' && path !== '') return path
          fiber = fiber.return
        }
      } catch (error) {
        return undefined
      }
      return undefined
    }

    /**
     * Recover the path from a durable reference's raw spelling, which carries the
     * `@` prefix and the file-reference grammar's optional quotes.
     * @param raw - raw token, e.g. `@docs/a.md` or `@"my folder`.
     * @param folder - whether a trailing slash belongs to the grammar.
     * @returns the path, or an empty string when the token names nothing.
     */
    function stripReference(raw, folder) {
      let value = raw.trim()
      if (value.startsWith('@')) value = value.slice(1).trim()
      if (value.startsWith('"')) value = value.slice(1)
      if (value.endsWith('"')) value = value.slice(0, -1)
      if (folder) value = value.replace(/[\\/]+$/, '')
      return value.trim()
    }

    /**
     * Join a workspace directory and a relative path, normalizing separators so
     * a copied absolute path reads as one spelling.
     * @param base - absolute directory.
     * @param child - relative path.
     * @returns the joined path.
     */
    function joinPath(base, child) {
      const separator = base.includes('\\') ? '\\' : '/'
      const normalized = separator === '\\' ? child.replace(/\//g, '\\') : child.replace(/\\/g, '/')
      return base.replace(/[\\/]+$/, '') + separator + normalized.replace(/^[\\/]+/, '')
    }

    /**
     * Express an absolute path relative to a workspace directory.
     * @param absolute - absolute file path.
     * @param base - absolute directory, when known.
     * @returns the relative path, or the absolute path outside that directory.
     */
    function relativeTo(absolute, base) {
      if (typeof base !== 'string' || base === '') return absolute
      const normalize = (value) => value.replace(/\\/g, '/').replace(/\/+$/, '')
      const target = normalize(absolute)
      const root = normalize(base)
      const caseInsensitive = /^[A-Za-z]:/.test(target)
      const head = caseInsensitive ? target.toLowerCase() : target
      const tail = caseInsensitive ? root.toLowerCase() : root
      if (head === tail) return ''
      if (head.startsWith(tail + '/')) return target.slice(root.length + 1)
      return absolute
    }

    return { inject, apply }
  },
})
