/**
 * Extension identifier — matches the "name" field in package.json.
 */
export const EXTENSION_ID = 'joltapi';

/**
 * VS Code command identifiers.
 */
export const COMMANDS = {
  OPEN: 'joltapi.open',
} as const;

/**
 * Webview panel configuration.
 */
export const WEBVIEW = {
  VIEW_TYPE: 'joltapi.mainPanel',
  TITLE: 'JoltAPI',
} as const;

/**
 * Default settings values.
 */
export const DEFAULTS = {
  TIMEOUT_MS: 30000,
  SSL_VERIFY: true,
  FOLLOW_REDIRECTS: true,
  MAX_REDIRECTS: 5,
  HISTORY_LIMIT: 50,
} as const;

/**
 * Storage paths relative to the workspace root.
 */
export const STORAGE = {
  BASE_DIR: '.joltapi',
  COLLECTIONS_DIR: '.joltapi/collections',
} as const;

/**
 * File filter patterns for import/export dialogs.
 */
export const FILE_FILTERS = {
  JOLTAPI: { 'JoltAPI Collection': ['json'] },
  ALL_JSON: { 'JSON Files': ['json'] },
  ALL: { 'All Files': ['*'] },
} as const;
