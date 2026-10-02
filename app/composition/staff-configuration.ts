import "server-only";

// Staff attendance lookup settings.
//
// Kept apart from configuration.ts on purpose. That file is imported by the
// employee form, which runs in the browser, and Next.js copies the value of
// every NEXT_PUBLIC_ variable it reads straight into the built code. Reading the
// password there would ship it to every customer's phone.
//
// This module is server-only: the import above makes the build fail if anything
// in the browser ever imports it, so the values are inlined into server code
// alone.
//
// Both spellings are read. NEXT_PUBLIC_ names are what AWS Amplify is set up
// with, and they work there because Next.js bakes them in at build time, while
// Amplify does not pass plain variables to the running server. The plain names
// keep local .env files working.

const STAFF_PRESENT_URL =
  process.env.NEXT_PUBLIC_STAFF_PRESENT_URL ||
  process.env.STAFF_PRESENT_URL ||
  "https://cust.spacetextiles.net/staff_present";

const STAFF_PRESENT_USER =
  process.env.NEXT_PUBLIC_STAFF_PRESENT_USER ||
  process.env.STAFF_PRESENT_USER ||
  "spacetextilesltd";

const STAFF_PRESENT_PASSWORD =
  process.env.NEXT_PUBLIC_STAFF_PRESENT_PASSWORD ||
  process.env.STAFF_PRESENT_PASSWORD ||
  "F2nFpKS5cUXIPvFS4i9H5EzAjt3sdluYObgNfPTMTpo=";

export { STAFF_PRESENT_URL, STAFF_PRESENT_USER, STAFF_PRESENT_PASSWORD };
