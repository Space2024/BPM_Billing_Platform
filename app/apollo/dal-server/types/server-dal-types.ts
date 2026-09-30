/**
 * Shapes shared across the server-side data access layer.
 */

import type { FetchPolicy } from "@apollo/client";

/**
 * What every data access call resolves to.
 *
 * The service never throws. Success carries `data` and a null `error`; any
 * failure, a network one included, carries a null `data` and the `error`.
 * `loading` is always false by the time a server call resolves, and is kept so
 * the envelope matches the client-side hook shape.
 */
export interface ServerDALResponse<TData> {
  data: TData | null;
  error: Error | null;
  loading: boolean;
}

/** Per-call options for a query or mutation. */
export interface ServerFetchOptions {
  /** Batch several operations into one HTTP request. Ignored for mutations. */
  useBatching?: boolean;
  /** Extra headers merged into the request. */
  headers?: Record<string, string>;
  /**
   * Seconds Next.js may reuse the HTTP response. Omitted means no HTTP caching,
   * the right default for anything customer specific. Ignored for mutations.
   */
  revalidate?: number;
  /** Apollo cache policy. Defaults to "no-cache". Ignored for mutations. */
  fetchPolicy?: FetchPolicy;
}

/**
 * An error normalised for logging.
 *
 * `name` and `message` are guaranteed; the rest is present only when the
 * failure carried it, a GraphQL error code or an HTTP status for instance.
 */
export interface ServerDALError extends Error {
  code?: string;
  statusCode?: number;
  graphQLErrors?: ReadonlyArray<unknown>;
  networkError?: unknown;
}
