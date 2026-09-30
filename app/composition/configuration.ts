import { AppConfig } from "@/app/composition/types";

// Environment variables are read once, here. Next.js loads .env automatically,
// so nothing else in the app reaches for process.env — a call site that wants
// an endpoint imports the named constant instead.
//
// A NEXT_PUBLIC_ prefix means the value is inlined into the browser bundle.
// The staff attendance credentials deliberately carry no prefix: basic auth
// details must never leave the server.

const BLUPEACOCK_MEMBERSHIP_PLATFORM =
  process.env.NEXT_PUBLIC_BLUPEACOCK_MEMBERSHIP_PLATFORM || "";

const BLUPEACOCK_MEMBERSHIP_EMPOWERMENT =
  process.env.NEXT_PUBLIC_BLUPEACOCK_MEMBERSHIP_EMPOWERMENT || "";

const BLUPEACOCK_EMPLOYEE_DIRECTORY =
  process.env.NEXT_PUBLIC_BLUPEACOCK_EMPLOYEE_DIRECTORY ||
  "https://servicehub.spacetextiles.net/parkingsystem/v1/Parking-tcs-employee-data/";

const BLUPEACOCK_EMPLOYEE_DIRECTORY_TOKEN =
  process.env.NEXT_PUBLIC_BLUPEACOCK_EMPLOYEE_DIRECTORY_TOKEN ||
  "d74e48fa5689bf56d3b63cffcd20e7b4e7399488";

// Postal code lookup. Server-only: the browser reaches it through the gateway
// route, so the address never needs to be in the client bundle.
const BLUPEACOCK_PINCODE_LOOKUP =
  process.env.PINCODE_LOOKUP_URL || "https://cust.spacetextiles.net/Postal-Code-List";

/**
 * Whether the gateway may relay GraphQL.
 *
 * Off by default, and deliberately so. The gateway attaches the application's
 * bearer token server-side, so an open GraphQL channel would let anyone who can
 * reach the site issue arbitrary queries against the membership backend using
 * this app's credentials. Nothing here needs it: every GraphQL call runs on the
 * server and goes straight to the backend.
 *
 * Turn it on only once browser-side GraphQL exists and the gateway itself sits
 * behind authentication.
 */
const GATEWAY_ALLOW_GRAPHQL = process.env.GATEWAY_ALLOW_GRAPHQL === "true";

/**
 * Debug switch: return gateway responses as readable JSON instead of the
 * encoded body, so the DevTools Response tab renders the usual JSON tree.
 *
 * Server-side only, and intentionally not NEXT_PUBLIC_. It does not need to be:
 * the client only decodes a response carrying the encoding marker, so
 * withholding that marker turns the whole thing off from this side alone.
 *
 * Compared against the string "true" because every env value is a string, and a
 * bare truthiness check would treat "false" as on.
 */
const NETWORK_RESPONSE_JSON = process.env.NETWORK_RESPONSE_JSON === "true";

// Server-only: no NEXT_PUBLIC_ prefix, so these never reach the browser.
const STAFF_PRESENT_URL =
  process.env.NEXT_PUBLIC_STAFF_PRESENT_URL || "https://cust.spacetextiles.net/staff_present";
const STAFF_PRESENT_USER = process.env.NEXT_PUBLIC_STAFF_PRESENT_USER || "spacetextilesltd";
const STAFF_PRESENT_PASSWORD = process.env.NEXT_PUBLIC_STAFF_PRESENT_PASSWORD || "F2nFpKS5cUXIPvFS4i9H5EzAjt3sdluYObgNfPTMTpo=";

export {
  BLUPEACOCK_MEMBERSHIP_PLATFORM,
  BLUPEACOCK_PINCODE_LOOKUP,
  BLUPEACOCK_MEMBERSHIP_EMPOWERMENT,
  BLUPEACOCK_EMPLOYEE_DIRECTORY,
  BLUPEACOCK_EMPLOYEE_DIRECTORY_TOKEN,
  STAFF_PRESENT_URL,
  STAFF_PRESENT_USER,
  STAFF_PRESENT_PASSWORD,
  NETWORK_RESPONSE_JSON,
  GATEWAY_ALLOW_GRAPHQL,
};

const appConfig: AppConfig = {
  BLUPEACOCK_MEMBERSHIP_PLATFORM,
  BLUPEACOCK_PINCODE_LOOKUP,
  BLUPEACOCK_MEMBERSHIP_EMPOWERMENT,
  BLUPEACOCK_EMPLOYEE_DIRECTORY,
  BLUPEACOCK_EMPLOYEE_DIRECTORY_TOKEN,
  STAFF_PRESENT_URL,
  STAFF_PRESENT_USER,
  STAFF_PRESENT_PASSWORD,
};

export default appConfig;
