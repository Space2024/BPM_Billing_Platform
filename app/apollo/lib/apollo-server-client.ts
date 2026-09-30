import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

import {
  BLUPEACOCK_MEMBERSHIP_PLATFORM,
  BLUPEACOCK_MEMBERSHIP_EMPOWERMENT,
} from "@/app/composition/configuration";

/**
 * Resolve the GraphQL endpoint to an absolute URL.
 *
 * Server-side fetch, which is all this app does, requires an absolute URL. When
 * the configured endpoint is a relative path the server calls its own route
 * handler over loopback.
 *
 * Always plain HTTP for that loopback call. In production the Node process
 * listens on HTTP and TLS is terminated upstream, so building an https loopback
 * URL fails the handshake and turns every server action into a 500.
 */
function getGraphQLEndpoint(): string {
  const endpoint = BLUPEACOCK_MEMBERSHIP_PLATFORM;

  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }

  const port = process.env.PORT || "3000";
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `http://127.0.0.1:${port}${path}`;
}

export interface ServerApolloClientOptions {
  /** Batch several operations into one HTTP request. */
  useBatching?: boolean;
  /** Extra headers merged into every request. */
  headers?: Record<string, string>;
  /**
   * Seconds to let Next.js reuse the HTTP response.
   *
   * Omitted means no HTTP caching at all, which is the right default for
   * anything customer specific. The store master passes a value here because it
   * changes a few times a year and sits on the critical path of the scanned QR
   * page.
   */
  revalidate?: number;
}

/**
 * Build a server-side Apollo Client.
 *
 * @see {@link getServerApolloClient} for the per-call factory the data access
 * layer uses.
 */
export function createServerApolloClient(options?: ServerApolloClientOptions) {
  const { useBatching = false, headers = {}, revalidate } = options || {};

  // Next.js patches global fetch and caches responses by default. Apollo's
  // fetchPolicy only governs Apollo's own store, never the HTTP layer, so the
  // caching decision has to be made here.
  const nextFetch: typeof fetch = (input, init) =>
    revalidate === undefined
      ? fetch(input, { ...init, cache: "no-store" })
      : fetch(input, { ...init, next: { revalidate } });

  const linkOptions = {
    uri: getGraphQLEndpoint(),
    fetch: nextFetch,
  };

  const httpLink = useBatching
    ? new BatchHttpLink({
        ...linkOptions,
        batchMax: 10,
        batchInterval: 10,
        batchKey: (operation) => {
          const context = operation.getContext();
          return JSON.stringify({ headers: context.headers || {} });
        },
      })
    : new HttpLink(linkOptions);

  const authLink = setContext((_, { headers: contextHeaders }) => ({
    headers: {
      ...contextHeaders,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(BLUPEACOCK_MEMBERSHIP_EMPOWERMENT && {
        Authorization: `Bearer ${BLUPEACOCK_MEMBERSHIP_EMPOWERMENT}`,
      }),
      "x-request-id": `server-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      ...headers,
    },
  }));

  // Structural types rather than `any`: the error link is handed a wider union
  // than this code reads, and naming only the fields that are logged keeps the
  // callback honest about what it touches.
  interface LoggedGraphQLError {
    message: string;
    path?: readonly (string | number)[];
    extensions?: Record<string, unknown>;
  }
  interface LoggedErrorResponse {
    graphQLErrors?: readonly LoggedGraphQLError[];
    networkError?: Error & { statusCode?: number };
  }

  const errorLink = onError((errorResponse) => {
    const { graphQLErrors, networkError } = errorResponse as LoggedErrorResponse;

    graphQLErrors?.forEach((err) => {
      console.error("[Server GraphQL Error]:", {
        message: err.message,
        path: err.path,
        extensions: err.extensions,
      });
    });

    if (networkError) {
      console.error("[Server Network Error]:", {
        message: networkError.message,
        statusCode: networkError.statusCode,
      });
    }
  });

  const client = new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
    ssrMode: true,
    // errorPolicy is deliberately absent. Apollo 4 requires a default one to be
    // declared through module augmentation before it type checks, and the data
    // access layer already passes errorPolicy: "all" on every call, so a
    // default here would only be a second place to keep in step.
    defaultOptions: {
      query: { fetchPolicy: "no-cache" },
      mutate: { fetchPolicy: "no-cache" },
    },
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[Server Apollo Client] Endpoint:", getGraphQLEndpoint());
  }

  return client;
}

/**
 * A fresh client for a single call.
 *
 * Deliberately not a singleton. One InMemoryCache living for the lifetime of the
 * Node process is shared by every visitor, so one customer's lookup can be
 * served to the next from cache even under fetchPolicy no-cache, because Apollo
 * consults its own store before deciding whether to hit the network. On an app
 * where every query is keyed to a mobile number that is a data leak, not just a
 * staleness bug. A new client costs about a millisecond.
 */
export function getServerApolloClient(options?: ServerApolloClientOptions) {
  return createServerApolloClient(options);
}
