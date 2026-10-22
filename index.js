/**
 * Host half of the session-folder bundle. The feature is browser chrome: the
 * Client module registers the Session-menu row, the right-click menu, and the
 * failure notice, and reaches the Host desktop through the shipped
 * `session.openWorkspacePath` Remote. This half exists so the bundle has a
 * Loader row to carry its `dsh.client` declaration.
 */
export function apply() {}
