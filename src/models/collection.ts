import type { IHttpRequest } from './httpRequest';

/**
 * A request saved inside a collection.
 */
export interface ICollectionRequest {
  /** Unique ID (UUID). */
  id: string;
  /** User-given name (e.g., "Get Users"). */
  name: string;
  /** Optional description. */
  description?: string;
  /** The full request model. */
  request: IHttpRequest;
  /** Creation timestamp (Unix ms). */
  createdAt: number;
  /** Last modification timestamp (Unix ms). */
  updatedAt: number;
}

/**
 * A collection grouping saved requests.
 */
export interface ICollection {
  /** Unique ID (UUID). */
  id: string;
  /** User-given name (e.g., "User Service API"). */
  name: string;
  /** Optional description. */
  description?: string;
  /** Saved requests in this collection. */
  requests: ICollectionRequest[];
  /** Optional: default environment ID for this collection. */
  environmentId?: string;
  /** Creation timestamp (Unix ms). */
  createdAt: number;
  /** Last modification timestamp (Unix ms). */
  updatedAt: number;
}
