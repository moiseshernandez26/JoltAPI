import type { IHttpRequest } from './httpRequest';
import type { IHttpResponse } from './httpResponse';

/**
 * A single entry in the request history.
 */
export interface IHistoryEntry {
  /** Unique ID (UUID). */
  id: string;
  /** The request as it was sent. */
  request: IHttpRequest;
  /** The response received. */
  response: IHttpResponse;
  /** Timestamp when the request was made (Unix ms). */
  createdAt: number;
}
