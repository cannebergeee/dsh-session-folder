/**
 * Browser half of `@dsh-external/dsh-session-folder`.
 *
 * Two entry points over the same Host capabilities:
 *
 * 1. **Session "..." menu** (`sidebar.workspaces.session.menu.item`) — one row
 *    that opens that Session's project folder in the local file manager.
 *    Right-clicking a Session row opens that same "..." menu at the row.
 * 2. **Right-click on a file name in the conversation** — a menu with open,
 *    reveal in the file manager, open in the associated editor (VS Code when
 *    the desktop registers it), and copy absolute / relative path.
 *
 * Paths: the Session row's folder comes from `SessionListState.byId[id].cwd`.
 * A conversation file chip carries its path in the `title` attribute (the chat
 * primitives put the full path there for both inline mentions and file links),
 * and the Session cwd that path is relative to comes from the main-view
 * Session. Nothing here retains a Session or loads history.
 *
 * Operations use the shipped `session.*` Remotes: `openWorkspacePath` verifies
 * the path through the composed filesystem before opening or revealing it, and
 * `workspacePathApplications` lists the desktop's registered handlers for one
 * file, whose ids are the values `openWorkspacePath({ application })` accepts.
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
    /** Display names and handler names that mean the VS Code editor. */
    const EDITOR_PATTERN = /visual studio code|vs ?code|vscode|code\.exe/i

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

    /** Right-click menu request: `{ x, y, title, rows(editor), loadEditor? }`. */
    const menuStore = createStore(null)
    /** Workspace id → directory, mirrored from the root workspace snapshot. */
    const workspacePathStore = createStore(new Map())
    /** Transient notice: `{ seq, text, tone }`. */
    const noticeStore = createStore(null)

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
     * Folder glyph.
     * @returns the icon.
     */
    function FolderIcon() {
      return h(
        Icon,
        {},
        h('path', {
          key: 'folder',
          d: 'M2.1 4.6c0-.7.6-1.3 1.3-1.3h2.1l1.3 1.5h5.4c.7 0 1.3.6 1.3 1.3v5.4c0 .7-.6 1.3-1.3 1.3H3.4c-.7 0-1.3-.6-1.3-1.3V4.6Z',
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
     * Code-editor glyph, used when the desktop reports no icon for the handler.
     * @returns the icon.
     */
    function CodeIcon() {
      return h(
        Icon,
        {},
        h('path', { key: 'left', d: 'M5.4 5.2 2.6 8l2.8 2.8' }),
        h('path', { key: 'right', d: 'M10.6 5.2 13.4 8l-2.8 2.8' }),
        h('path', { key: 'slash', d: 'M9.2 3.4 6.8 12.6' }),
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
     * Chain glyph for "copy link".
     * @returns the icon.
     */
    function LinkIcon() {
      return h(
        Icon,
        {},
        h('path', { key: 'left', d: 'M6.9 9.1 5.5 10.5a2.3 2.3 0 0 1-3.2-3.2l1.4-1.4' }),
        h('path', { key: 'right', d: 'M9.1 6.9l1.4-1.4a2.3 2.3 0 0 1 3.2 3.2l-1.4 1.4' }),
        h('path', { key: 'bar', d: 'M6.2 9.8 9.8 6.2' }),
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
     * file menu and the link menu share one surface. A request with
     * `loadEditor` resolves one extra row asynchronously; the menu re-clamps
     * when it arrives so the row never pushes itself off screen.
     * @returns the positioned menu, or null while closed.
     */
    function ContextMenu() {
      const request = useStore(menuStore)
      const ref = React.useRef(null)
      const [editor, setEditor] = React.useState(null)

      React.useEffect(() => {
        setEditor(null)
        if (request === null || typeof request.loadEditor !== 'function') return undefined
        let cancelled = false
        request.loadEditor().then(
          (next) => {
            if (!cancelled) setEditor(next === null ? null : next)
          },
          () => {},
        )
        return () => {
          cancelled = true
        }
      }, [request])

      /**
       * Keep the menu inside the viewport after any row-set change.
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

      // A new request places and focuses the menu; an extra editor row only
      // re-clamps it, so the keyboard focus the user already moved stays put.
      React.useLayoutEffect(() => {
        if (request === null) return undefined
        clamp(request.x, request.y)
        const first = ref.current === null ? null : ref.current.querySelector('[role="menuitem"]')
        if (first instanceof HTMLElement) first.focus()
        return undefined
      }, [request])

      React.useLayoutEffect(() => {
        if (request === null) return undefined
        clamp(request.x, request.y)
        return undefined
      }, [editor])

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
      for (const spec of request.rows(editor)) {
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

    /** Services the browser half reads: Session summaries, slots, copy, Remote. */
    const inject = ['sessions', 'slots', 'locale', 'remote', 'remote.session']

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
       * Rows of the file menu: open / reveal / editor, then the two copies.
       * The editor row is added only once the desktop answered which handlers
       * this file has, so the menu never offers an application it cannot launch.
       * @param absolute - absolute file path.
       * @param relative - path relative to the project folder.
       * @returns a row builder the menu calls with the resolved editor.
       */
      const fileMenuRows = (absolute, relative) => (editor) => {
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
        if (editor !== null && editor !== undefined) {
          rows.push({
            key: 'editor',
            label: editor.name,
            icon:
              typeof editor.icon === 'string'
                ? h('img', { src: editor.icon, alt: '', draggable: false })
                : h(CodeIcon, {}),
            onSelect: () => {
              void openOnHost({ path: absolute, application: editor.id })
            },
          })
        }
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
          icon: h(LinkIcon, {}),
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
       * List the desktop handlers registered for one file.
       * @param path - absolute path on the Host.
       * @returns the handlers, or null when the query failed.
       */
      const fileApplications = async (path) => {
        try {
          const result = await ctx.remote.session.workspacePathApplications({ path })
          if (result !== undefined && result !== null && result.ok === true && Array.isArray(result.value)) return result.value
          return null
        } catch (error) {
          console.warn('session folder: application query rejected', error)
          return null
        }
      }

      /** Per-path answer cache: the desktop query spawns a PowerShell read. */
      const editorCache = new Map()

      /**
       * Pick the VS Code handler out of this file's registered handlers.
       * Only a successful query is cached, so a failed one retries next time.
       * @param path - absolute path on the Host.
       * @returns the handler, or null when this desktop has none.
       */
      const loadEditor = async (path) => {
        const cached = editorCache.get(path)
        if (cached !== undefined) return cached
        const apps = await fileApplications(path)
        if (apps === null) return null
        let editor = null
        for (const app of apps) {
          const name = typeof app.name === 'string' ? app.name : ''
          const id = typeof app.id === 'string' ? app.id : ''
          if (EDITOR_PATTERN.test(name) || EDITOR_PATTERN.test(id)) {
            editor = app
            break
          }
        }
        if (editorCache.size >= 32) editorCache.clear()
        editorCache.set(path, editor)
        return editor
      }

      /**
       * Open this plugin's file menu for the conversation file chip under the
       * pointer. Mentions and file links are the primitives' buttons whose
       * class carries the `fileMention` local name and whose `title` attribute
       * is the path.
       * @param target - event target.
       * @param event - the contextmenu event.
       * @returns whether this handler consumed the event.
       */
      const openFileMenuAt = (target, event) => {
        const button = target.closest('button')
        if (!(button instanceof HTMLButtonElement)) return false
        // Input-reference chips carry the same `fileMention` class; theirs is a
        // composer `@name` spelling, not a resolved conversation file.
        if (button.hasAttribute('data-ref-chip')) return false
        const className = typeof button.className === 'string' ? button.className : ''
        if (!className.includes(FILE_MENTION_CLASS)) return false
        const raw = button.getAttribute('title')
        if (typeof raw !== 'string') return false
        const value = raw.trim()
        if (value === '' || value.startsWith('@')) return false
        event.preventDefault()
        const cwd = currentCwd()
        const absolute = isAbsolutePath(value) || cwd === undefined ? value : joinPath(cwd, value)
        const relative = isAbsolutePath(value) ? relativeTo(value, cwd) : value.replace(/^\.\//, '').replace(/\\/g, '/')
        menuStore.set({
          x: event.clientX,
          y: event.clientY,
          title: t('file.title'),
          rows: fileMenuRows(absolute, relative),
          loadEditor: () => loadEditor(absolute),
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
        menuStore.set({
          x: event.clientX,
          y: event.clientY,
          title: t('workspace.title'),
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
