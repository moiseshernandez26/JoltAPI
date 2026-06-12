/**
 * HTTP methods supported by JoltAPI.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Body types supported in the request builder.
 */
export type BodyType = 'none' | 'json' | 'form-data' | 'raw';

/**
 * Raw body content-type options.
 */
export type RawContentType =
  | 'text/plain'
  | 'application/json'
  | 'application/xml'
  | 'text/xml'
  | 'text/html'
  | 'application/javascript';

/**
 * Authentication type presets.
 */
export type AuthType = 'none' | 'bearer' | 'basic' | 'apiKey';

/**
 * A single key-value pair used in headers, query params, and form-data.
 */
export interface IKeyValuePair {
  /** Unique ID for React key and tracking. */
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

/**
 * Request body configuration.
 */
export interface IRequestBody {
  type: BodyType;
  /** JSON body: raw string that must parse as valid JSON. */
  jsonBody?: string;
  /** form-data: array of key-value pairs. */
  formData?: IKeyValuePair[];
  /** Form-data encoding: 'urlencoded' or 'multipart'. */
  formEncoding?: 'urlencoded' | 'multipart';
  /** Raw body: arbitrary text. */
  rawBody?: string;
  /** Content-type for raw body. */
  rawContentType?: RawContentType;
}

/**
 * Unified auth configuration — only relevant fields are populated per type.
 */
export interface IAuthConfig {
  type: AuthType;
  /** Bearer token value. */
  bearerToken?: string;
  /** Basic auth username. */
  basicUsername?: string;
  /** Basic auth password. */
  basicPassword?: string;
  /** API Key key name. */
  apiKeyName?: string;
  /** API Key value. */
  apiKeyValue?: string;
  /** API Key placement: 'header' or 'query'. */
  apiKeyPlacement?: 'header' | 'query';
}

/**
 * Proxy configuration for a single request.
 */
export interface IProxyConfig {
  enabled: boolean;
  host: string;
  port: number;
  /** Optional proxy authentication. */
  auth?: {
    username: string;
    password: string;
  };
}

/**
 * Settings that affect HTTP execution.
 */
export interface IHttpSettings {
  timeout: number;
  sslVerify: boolean;
  followRedirects: boolean;
  maxRedirects: number;
}

/**
 * Complete HTTP request model.
 */
export interface IHttpRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: IKeyValuePair[];
  queryParams: IKeyValuePair[];
  body: IRequestBody;
  auth: IAuthConfig;
  proxy: IProxyConfig;
  settings: IHttpSettings;
}

/**
 * The data actually sent to httpService after variable interpolation.
 */
export interface IResolvedHttpRequest {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: string;
  proxy?: IProxyConfig;
  timeout: number;
  sslVerify: boolean;
}
