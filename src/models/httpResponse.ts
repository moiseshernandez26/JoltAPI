import type { HttpMethod } from './httpRequest';

/**
 * A single response header.
 */
export interface IHttpResponseHeader {
  name: string;
  value: string;
}

/**
 * The complete HTTP response returned by httpService.
 */
export interface IHttpResponse {
  /** HTTP status code (e.g., 200, 404). */
  statusCode: number;
  /** HTTP status text (e.g., "OK", "Not Found"). */
  statusText: string;
  /** Response headers. */
  headers: IHttpResponseHeader[];
  /** Raw response body as a string. */
  body: string;
  /** Content-Type extracted from response headers. */
  contentType: string;
  /** Total round-trip time in milliseconds. */
  responseTimeMs: number;
  /** Size of the response body in bytes. */
  responseSizeBytes: number;
  /** Final URL after redirects. */
  requestUrl: string;
  /** The HTTP method used. */
  requestMethod: HttpMethod;
  /** Unix timestamp (ms) when the response was received. */
  timestamp: number;
}
