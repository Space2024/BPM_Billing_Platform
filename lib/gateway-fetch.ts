"use client";

import {
  GATEWAY_CHANNEL_HEADER,
  GATEWAY_CHANNEL_VALUE,
  GATEWAY_ENCODING_REQUEST_HEADER,
  GATEWAY_ENCODING_RESPONSE_HEADER,
  GATEWAY_ENCODING_VALUE,
  GATEWAY_SERVICE_HEADER,
  type GatewayService,
} from "@/app/apollo/lib/gateway-channel";

/**
 * Post a data request through the gateway.
 *
 * Two things make the Network tab uninformative to anyone reading over the
 * customer's shoulder, and neither is a secret:
 *
 * 1. The request goes to the URL of the page already open, not to an endpoint
 *    name. A `beforeFiles` rewrite keyed on the channel header puts it on the
 *    gateway handler, so the backend address is never in the browser at all.
 * 2. The response comes back gzipped as `application/octet-stream` with no
 *    `Content-Encoding`, so DevTools shows bytes rather than a JSON tree, and
 *    this function inflates them.
 *
 * Both degrade safely. A browser without `DecompressionStream` does not ask for
 * encoding, and the gateway then answers in plain text.
 */
export async function gatewayFetch<TResponse>(
  service: GatewayService,
  body: unknown,
  init?: { signal?: AbortSignal }
): Promise<TResponse> {
  const canDecode = typeof DecompressionStream !== "undefined";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    [GATEWAY_CHANNEL_HEADER]: GATEWAY_CHANNEL_VALUE,
    [GATEWAY_SERVICE_HEADER]: service,
  };

  if (canDecode) {
    headers[GATEWAY_ENCODING_REQUEST_HEADER] = GATEWAY_ENCODING_VALUE;
  }

  // The current page URL. The rewrite, not the path, decides where this lands.
  const target = window.location.pathname + window.location.search;

  const response = await fetch(target, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: init?.signal,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const encoded =
    response.headers.get(GATEWAY_ENCODING_RESPONSE_HEADER) === GATEWAY_ENCODING_VALUE;

  if (!encoded) {
    return (await response.json()) as TResponse;
  }

  const stream = response.body?.pipeThrough(new DecompressionStream("gzip"));
  if (!stream) {
    throw new Error("Gateway returned an encoded body with no stream to read");
  }

  const text = await new Response(stream).text();
  return JSON.parse(text) as TResponse;
}
