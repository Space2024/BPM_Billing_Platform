import { NextRequest, NextResponse } from "next/server";
import zlib from "zlib";
import { promisify } from "util";

import {
  BLUPEACOCK_MEMBERSHIP_PLATFORM,
  BLUPEACOCK_MEMBERSHIP_EMPOWERMENT,
  BLUPEACOCK_PINCODE_LOOKUP,
  NETWORK_RESPONSE_JSON,
  GATEWAY_ALLOW_GRAPHQL,
} from "@/app/composition/configuration";
import {
  GATEWAY_ENCODING_REQUEST_HEADER,
  GATEWAY_ENCODING_RESPONSE_HEADER,
  GATEWAY_ENCODING_VALUE,
  GATEWAY_SERVICE,
  GATEWAY_SERVICE_HEADER,
} from "@/app/apollo/lib/gateway-channel";

// Async rather than the sync variants: a sync call would block the event loop
// for every concurrent request.
const gzip = promisify(zlib.gzip);

/**
 * Resolve the upstream a request is asking for.
 *
 * Anything unrecognised, including a missing header, falls through to the
 * GraphQL endpoint, which is the default channel.
 */
function resolveUpstream(request: NextRequest): { url: string; auth?: string } {
  const service = request.headers.get(GATEWAY_SERVICE_HEADER);

  if (service === GATEWAY_SERVICE.PINCODE) {
    return { url: BLUPEACOCK_PINCODE_LOOKUP };
  }

  return {
    url: BLUPEACOCK_MEMBERSHIP_PLATFORM,
    auth: BLUPEACOCK_MEMBERSHIP_EMPOWERMENT,
  };
}

/**
 * Serialise a gateway response.
 *
 * When the client has advertised that it can decode, the JSON is gzipped and
 * returned WITHOUT a `Content-Encoding` header. That omission is the whole
 * point: a declared encoding is transparently undone by the browser before
 * DevTools renders the body, so the Response tab would show the JSON tree
 * again. Undeclared, DevTools has only compressed bytes to show, and the client
 * inflates them itself.
 *
 * This costs nothing on the wire. It is the same compression the server would
 * have applied anyway, moved here.
 *
 * `application/octet-stream` is correct for the encoded branch and also stops
 * Next's own compression from re-compressing an already compressed body. The
 * plain branch keeps `text/plain`, which stays in the compressible set.
 *
 * Setting NETWORK_RESPONSE_JSON=true forces the readable branch for debugging.
 * No client change is needed: the browser only decodes a response carrying the
 * marker, so withholding it is enough.
 *
 * Used for every response, errors included, so the shape never varies.
 */
async function gatewayResponse(
  request: NextRequest,
  body: unknown,
  status: number
): Promise<NextResponse> {
  const json = JSON.stringify(body);

  if (NETWORK_RESPONSE_JSON) {
    return new NextResponse(json, {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  const clientCanDecode =
    request.headers.get(GATEWAY_ENCODING_REQUEST_HEADER) === GATEWAY_ENCODING_VALUE;

  if (!clientCanDecode) {
    return new NextResponse(json, {
      status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  const encoded = await gzip(Buffer.from(json, "utf8"));

  return new NextResponse(new Uint8Array(encoded), {
    status,
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store, max-age=0",
      [GATEWAY_ENCODING_RESPONSE_HEADER]: GATEWAY_ENCODING_VALUE,
    },
  });
}

function errorBody(message: string, code: string, extra?: Record<string, unknown>) {
  return { errors: [{ message, extensions: { code, ...extra } }] };
}

/**
 * Data gateway.
 *
 * Sits between the browser and the backends so that nothing in the Network tab
 * names an upstream. The browser posts to the URL of the page it is on, a
 * rewrite in `next.config.ts` routes it here by header, and the real address is
 * read from the server-only composition layer.
 */
export async function POST(request: NextRequest) {
  const service = request.headers.get(GATEWAY_SERVICE_HEADER);

  // The GraphQL channel carries the application's bearer token, so relaying it
  // for an unauthenticated caller would hand out the app's credentials. It stays
  // closed until something actually needs it and the gateway sits behind auth.
  if (service !== GATEWAY_SERVICE.PINCODE && !GATEWAY_ALLOW_GRAPHQL) {
    return gatewayResponse(
      request,
      errorBody("This gateway channel is not enabled", "CHANNEL_DISABLED"),
      403
    );
  }

  const upstream = resolveUpstream(request);

  if (!upstream.url) {
    return gatewayResponse(
      request,
      errorBody("Gateway upstream is not configured", "GATEWAY_MISCONFIGURED"),
      500
    );
  }

  try {
    const payload = await request.text();

    const response = await fetch(upstream.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(upstream.auth && { Authorization: `Bearer ${upstream.auth}` }),
        ...(request.headers.get("x-request-id") && {
          "x-request-id": request.headers.get("x-request-id") || "",
        }),
      },
      body: payload,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Gateway] Upstream error:", response.status, errorText.slice(0, 500));

      return gatewayResponse(
        request,
        errorBody(`Backend returned ${response.status}`, "BACKEND_ERROR", {
          statusCode: response.status,
        }),
        response.status
      );
    }

    const data = await response.json();

    if (data?.errors?.length) {
      console.error("[Gateway] GraphQL errors:", JSON.stringify(data.errors));
    }

    return gatewayResponse(request, data, 200);
  } catch (error) {
    console.error("[Gateway] Proxy error:", error);

    return gatewayResponse(
      request,
      errorBody(
        error instanceof Error ? error.message : "Internal server error",
        "INTERNAL_SERVER_ERROR"
      ),
      500
    );
  }
}
