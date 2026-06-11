/**
 * User-facing string literals.
 * All strings displayed in the UI or messages should be defined here.
 */

export const STRINGS = {
  /** Panel title */
  PANEL_TITLE: 'JoltAPI',

  /** Request builder labels */
  REQUEST: {
    METHOD_LABEL: 'Method',
    URL_PLACEHOLDER: 'https://api.example.com/v1/resource',
    SEND_BUTTON: 'Send',
    SENDING: 'Sending...',
    TAB_HEADERS: 'Headers',
    TAB_BODY: 'Body',
    TAB_PARAMS: 'Params',
    TAB_AUTH: 'Auth',
  },

  /** Auth labels */
  AUTH: {
    NONE: 'None',
    BEARER: 'Bearer Token',
    BASIC: 'Basic Auth',
    API_KEY: 'API Key',
    BEARER_PLACEHOLDER: 'Enter bearer token',
    USERNAME_PLACEHOLDER: 'Username',
    PASSWORD_PLACEHOLDER: 'Password',
    KEY_NAME_PLACEHOLDER: 'Key name (e.g., X-API-Key)',
    KEY_VALUE_PLACEHOLDER: 'Key value',
  },

  /** Response viewer labels */
  RESPONSE: {
    STATUS: 'Status',
    TIME: 'Time',
    SIZE: 'Size',
    HEADERS: 'Headers',
    BODY: 'Body',
    COPY_BODY: 'Copy Body',
    COPY_HEADERS: 'Copy Headers',
    COPY_CURL: 'Copy as cURL',
    NO_RESPONSE: 'No response yet. Send a request to see results.',
    ERROR_TITLE: 'Request Failed',
  },

  /** Collections */
  COLLECTIONS: {
    NEW_COLLECTION: 'New Collection',
    SAVE_REQUEST: 'Save Request',
    IMPORT: 'Import',
    EXPORT: 'Export',
    DELETE_CONFIRM: 'Are you sure you want to delete this request?',
  },

  /** Environments */
  ENVIRONMENTS: {
    TITLE: 'Environments',
    NEW: 'New Environment',
    NO_ENVIRONMENTS: 'No environments defined.',
    VARIABLE_NAME: 'Variable Name',
    VARIABLE_VALUE: 'Variable Value',
    SECRET_TOGGLE: 'Secret',
  },

  /** History */
  HISTORY: {
    TITLE: 'History',
    NO_ENTRIES: 'No request history.',
    CLEAR: 'Clear History',
    CLEAR_CONFIRM: 'Clear all history entries?',
  },

  /** Proxy */
  PROXY: {
    TITLE: 'Proxy',
    HOST: 'Host',
    PORT: 'Port',
    USERNAME: 'Username',
    PASSWORD: 'Password',
    ENABLED: 'Use Proxy',
  },

  /** Errors */
  ERRORS: {
    NETWORK_ERROR: 'Network error. Check your connection and the URL.',
    TIMEOUT: 'Request timed out.',
    SSL_ERROR: 'SSL certificate verification failed. Disable SSL verification in settings if using a self-signed certificate.',
    INVALID_URL: 'The URL is not valid.',
    INVALID_JSON: 'The request body is not valid JSON.',
    UNKNOWN: 'An unexpected error occurred.',
  },
} as const;
