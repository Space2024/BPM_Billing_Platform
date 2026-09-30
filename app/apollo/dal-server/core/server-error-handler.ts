/**
 * Consistent error formatting and logging for server-side data access.
 */

import type { ServerDALError } from "@/app/apollo/dal-server/types/server-dal-types";

export class ServerErrorHandler {
  /** Normalise anything thrown into a structured error. */
  static formatError(error: unknown): ServerDALError {
    if (error instanceof Error) {
      const serverError = error as ServerDALError;
      return {
        name: serverError.name || "ServerError",
        message: serverError.message,
        code: serverError.code,
        statusCode: serverError.statusCode,
        graphQLErrors: serverError.graphQLErrors,
        networkError: serverError.networkError,
        stack: serverError.stack,
      };
    }

    return { name: "UnknownError", message: String(error) };
  }

  /** Log an error with the operation that produced it. */
  static logError(error: unknown, context?: string): void {
    const formatted = this.formatError(error);

    console.error("[ServerErrorHandler]", context || "Error occurred", {
      name: formatted.name,
      message: formatted.message,
      code: formatted.code,
      statusCode: formatted.statusCode,
    });

    if (formatted.graphQLErrors?.length) {
      console.error("[ServerErrorHandler] GraphQL Errors:", formatted.graphQLErrors);
    }

    if (formatted.networkError) {
      console.error("[ServerErrorHandler] Network Error:", formatted.networkError);
    }

    if (process.env.NODE_ENV === "development" && formatted.stack) {
      console.error("[ServerErrorHandler] Stack:", formatted.stack);
    }
  }

  static isGraphQLError(error: unknown): boolean {
    const serverError = error as ServerDALError;
    return !!serverError?.graphQLErrors?.length;
  }

  static isNetworkError(error: unknown): boolean {
    const serverError = error as ServerDALError;
    return !!serverError?.networkError;
  }

  /**
   * Message safe to show a customer.
   *
   * In production a backend message can name internal fields or tables, so it is
   * replaced with a generic line. In development the real message is returned,
   * because that is when someone is reading it.
   */
  static getUserMessage(error: unknown): string {
    const formatted = this.formatError(error);

    if (process.env.NODE_ENV === "production") {
      return "An error occurred while processing your request";
    }

    return formatted.message;
  }
}

export const serverErrorHandler = new ServerErrorHandler();
