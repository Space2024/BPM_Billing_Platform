import { DocumentNode } from "@apollo/client";

import { getServerApolloClient } from "@/app/apollo/lib/apollo-server-client";
import { ServerErrorHandler } from "@/app/apollo/dal-server/core/server-error-handler";
import { serverRequestLogger } from "@/app/apollo/dal-server/core/server-request-logger";
import type {
  ServerFetchOptions,
  ServerDALResponse,
} from "@/app/apollo/dal-server/types/server-dal-types";

/** Name of the operation in a document, for logging. */
function operationName(document: DocumentNode): string {
  for (const definition of document.definitions) {
    if (definition.kind === "OperationDefinition" && definition.name) {
      return definition.name.value;
    }
  }
  return "anonymous";
}

function newRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * The single way this app talks to the GraphQL backend.
 *
 * Never throws. Every outcome, including a network failure, comes back as
 * `{ data, error, loading: false }`, so a caller handles one shape instead of
 * wrapping each call in try/catch.
 */
class ServerGraphQLService {
  async query<TData = unknown, TVariables extends Record<string, unknown> = Record<string, unknown>>(
    query: DocumentNode,
    variables?: TVariables,
    options?: ServerFetchOptions
  ): Promise<ServerDALResponse<TData>> {
    const requestId = newRequestId();
    const name = operationName(query);
    serverRequestLogger.startRequest(requestId, name, variables);

    try {
      const client = getServerApolloClient({
        useBatching: options?.useBatching,
        headers: options?.headers,
        revalidate: options?.revalidate,
      });

      const result = await client.query<TData, TVariables>({
        query,
        variables: variables as TVariables,
        fetchPolicy: options?.fetchPolicy || "no-cache",
        errorPolicy: "all",
      });

      if (result.error) {
        ServerErrorHandler.logError(result.error, `query ${name}`);
        serverRequestLogger.errorRequest(requestId, result.error);
        return { data: null, error: result.error, loading: false };
      }

      serverRequestLogger.endRequest(requestId, result.data);
      return { data: result.data ?? null, error: null, loading: false };
    } catch (error) {
      const normalised = error instanceof Error ? error : new Error(String(error));
      ServerErrorHandler.logError(normalised, `query ${name}`);
      serverRequestLogger.errorRequest(requestId, normalised);
      return { data: null, error: normalised, loading: false };
    }
  }

  async mutate<TData = unknown, TVariables extends Record<string, unknown> = Record<string, unknown>>(
    mutation: DocumentNode,
    variables?: TVariables,
    options?: ServerFetchOptions
  ): Promise<ServerDALResponse<TData>> {
    const requestId = newRequestId();
    const name = operationName(mutation);
    serverRequestLogger.startRequest(requestId, name, variables);

    try {
      // Mutations are never batched and never cached.
      const client = getServerApolloClient({
        useBatching: false,
        headers: options?.headers,
      });

      const result = await client.mutate<TData, TVariables>({
        mutation,
        variables: variables as TVariables,
        fetchPolicy: "no-cache",
        errorPolicy: "all",
      });

      if (result.error) {
        ServerErrorHandler.logError(result.error, `mutation ${name}`);
        serverRequestLogger.errorRequest(requestId, result.error);
        return { data: null, error: result.error, loading: false };
      }

      serverRequestLogger.endRequest(requestId, result.data);
      return { data: result.data ?? null, error: null, loading: false };
    } catch (error) {
      const normalised = error instanceof Error ? error : new Error(String(error));
      ServerErrorHandler.logError(normalised, `mutation ${name}`);
      serverRequestLogger.errorRequest(requestId, normalised);
      return { data: null, error: normalised, loading: false };
    }
  }
}

export const serverGraphQLService = new ServerGraphQLService();

export { ServerGraphQLService };
