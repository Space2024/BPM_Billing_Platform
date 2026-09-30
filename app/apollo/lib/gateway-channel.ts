/**
 * Contract between the browser and the gateway route.
 *
 * Nothing here is secret. These are the markers that let a data request travel
 * on a frontend URL and come back as opaque bytes.
 */

/**
 * Marks a request as belonging to the data channel.
 *
 * The browser posts data requests to the URL of the page it is already on, so
 * the Network tab shows a frontend route rather than a backend endpoint.
 * Routing is then decided by this header rather than by the path: the
 * `beforeFiles` rewrite in `next.config.ts` maps any request carrying it onto
 * the gateway handler.
 *
 * The header, not the HTTP method, is the discriminator on purpose. Next.js
 * server actions also POST to the current page URL; they never send this
 * header, so they keep reaching the page they belong to.
 *
 * The literal is repeated in `next.config.ts`, which cannot resolve the `@/`
 * alias. Change both together.
 */
export const GATEWAY_CHANNEL_HEADER = "x-request-channel";
export const GATEWAY_CHANNEL_VALUE = "1";

/**
 * Names the upstream a data request is for.
 *
 * The parking app's gateway fronts a single GraphQL endpoint and needs no such
 * selector. This app has two upstreams behind one gateway, so the request says
 * which one it wants. An unrecognised or absent value falls through to the
 * GraphQL endpoint.
 */
export const GATEWAY_SERVICE_HEADER = "x-request-service";

export const GATEWAY_SERVICE = {
  GRAPHQL: "graphql",
  PINCODE: "pincode",
} as const;

export type GatewayService = (typeof GATEWAY_SERVICE)[keyof typeof GATEWAY_SERVICE];

/**
 * Body encoding negotiation between the client and the gateway.
 *
 * The gateway gzips the response and deliberately does NOT set
 * `Content-Encoding`. A declared encoding is undone by the browser before
 * DevTools renders the body, which would put the readable JSON straight back.
 * Undeclared, DevTools has only compressed bytes to show, and the client
 * inflates them itself.
 *
 * Negotiated rather than assumed: the client only sends the request header when
 * it actually has `DecompressionStream`, and the gateway only encodes when
 * asked. Anything else, an old browser or a framework error page, falls back to
 * a plain body, so there is no path where the client cannot read the result.
 */
export const GATEWAY_ENCODING_REQUEST_HEADER = "x-request-encoding";
export const GATEWAY_ENCODING_RESPONSE_HEADER = "x-response-encoding";
export const GATEWAY_ENCODING_VALUE = "z";
