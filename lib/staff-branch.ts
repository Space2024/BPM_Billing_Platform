// ─── Staff Branch Resolver ─────────────────────────────────────────────────────
//
// Resolves which STORE a staff member is physically working at today, so the
// customer registration form can pre-select that store and lock it.
//
// How the match works
// ───────────────────
// The store master (`findAllStores`) exposes `storeCode` in `CONCERN-BRANCH`
// form — e.g. `SKTM-CBE3`, `TCS-HSR`, `SKJ-MYS`.
//
// The attendance endpoint (`/staff_present`) takes exactly that same
// `CONCERN-BRANCH` string as its `concernBranch` input and answers the question
// "is this EC number marked present at this concern-branch today?":
//
//   { ecno, concernBranch: "SKTM-HO" }  -> count 1 + the attendance row
//   { ecno, concernBranch: "TCS-CBE3" } -> count 0 (staff is not there)
//   concernBranch without a hyphen      -> success:false, format error
//
// It only validates a concern-branch we hand it; it will not tell us the branch
// outright. So we probe candidate `storeCode` values and keep the one that
// answers with a row. The QR code already carries the staff BRANCH ("HO",
// "CBE3", ...), which lets us try the handful of codes ending in that branch
// first and usually settle it in a single round trip.
//
// Every failure path returns null — the caller then leaves the store dropdown
// open rather than blocking registration on an attendance lookup.

import { StoreOption } from "@/types/billing";
import {
  STAFF_PRESENT_URL,
  STAFF_PRESENT_USER,
  STAFF_PRESENT_PASSWORD,
} from "@/app/composition/staff-configuration";

/** Per-request timeout for a single attendance probe. */
const PROBE_TIMEOUT_MS = 8000;

// ─── Endpoint types ────────────────────────────────────────────────────────────

interface StaffPresentRow {
  ECNO: string;
  ENAME: string;
  ATTN_DATE: string;
  ATTN_STATUS: string;
  SECTIONNAME: string;
  DESIGNATIONNAME: string;
  BRANCH: string;
  CONCERN: string;
}

interface StaffPresentResponse {
  success: boolean;
  count?: number;
  data?: StaffPresentRow[];
  message?: string;
}

/** A confirmed staff-at-branch match, tied back to a store in the master. */
export interface StaffBranchMatch {
  /** The `storeCode` that the attendance endpoint confirmed, e.g. "SKTM-CBE3". */
  storeCode: string;
  /** Concern part of the code, e.g. "SKTM". */
  concern: string;
  /** Branch part of the code, e.g. "CBE3". */
  branch: string;
  staffName: string;
  attnStatus: string;
  /** The store row from the master that owns this code. */
  store: StoreOption;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** `/staff_present` rejects any concernBranch that is not CONCERN-BRANCH. */
function isProbableConcernBranch(code: string | null | undefined): boolean {
  if (!code) return false;
  return /^[A-Za-z0-9]+-[A-Za-z0-9]+$/.test(code.trim());
}

/** Branch segment of a store code — "SKTM-CBE3" -> "CBE3". */
export function branchOfStoreCode(code: string): string {
  const trimmed = code.trim();
  const idx = trimmed.indexOf("-");
  return idx === -1 ? "" : trimmed.slice(idx + 1);
}

/** Concern segment of a store code — "SKTM-CBE3" -> "SKTM". */
export function concernOfStoreCode(code: string): string {
  const trimmed = code.trim();
  const idx = trimmed.indexOf("-");
  return idx === -1 ? trimmed : trimmed.slice(0, idx);
}

function authHeader(): string | null {
  if (!STAFF_PRESENT_USER || !STAFF_PRESENT_PASSWORD) return null;
  const encoded = Buffer.from(
    `${STAFF_PRESENT_USER}:${STAFF_PRESENT_PASSWORD}`
  ).toString("base64");
  return `Basic ${encoded}`;
}

// ─── Single probe ──────────────────────────────────────────────────────────────

/**
 * Ask the attendance endpoint whether `ecno` is present at `concernBranch` today.
 * Resolves to the attendance row on a hit, or null on a miss / any failure.
 */
async function probeStaffPresent(
  ecno: string,
  concernBranch: string,
  auth: string
): Promise<StaffPresentRow | null> {
  try {
    const res = await fetch(STAFF_PRESENT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify({ ecno, concernBranch }),
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as StaffPresentResponse;
    if (!json.success) return null;
    if (!json.data?.length) return null;

    return json.data[0];
  } catch {
    // Network error, timeout or malformed body — treated as "not matched".
    return null;
  }
}

// ─── Candidate ordering ────────────────────────────────────────────────────────

/**
 * Split store codes into the ones worth trying first (branch segment equals the
 * branch the QR code carried) and everything else.
 */
function orderCandidates(
  stores: StoreOption[],
  branchHint?: string | null
): { preferred: StoreOption[]; rest: StoreOption[] } {
  const usable = stores.filter((s) => isProbableConcernBranch(s.storeCode));
  const hint = branchHint?.trim().toUpperCase() ?? "";

  if (!hint) return { preferred: [], rest: usable };

  const preferred: StoreOption[] = [];
  const rest: StoreOption[] = [];

  for (const store of usable) {
    // Match either the branch segment ("CBE3") or the whole code ("SKTM-CBE3"),
    // since the QR may already carry a full concern-branch string.
    const branch = branchOfStoreCode(store.storeCode).toUpperCase();
    const full = store.storeCode.trim().toUpperCase();
    if (branch === hint || full === hint) preferred.push(store);
    else rest.push(store);
  }

  return { preferred, rest };
}

/** Probe a batch of candidates together and return the first confirmed match. */
async function firstMatch(
  ecno: string,
  candidates: StoreOption[],
  auth: string
): Promise<StaffBranchMatch | null> {
  if (!candidates.length) return null;

  const results = await Promise.all(
    candidates.map(async (store) => ({
      store,
      row: await probeStaffPresent(ecno, store.storeCode.trim(), auth),
    }))
  );

  for (const { store, row } of results) {
    if (!row) continue;
    const code = store.storeCode.trim();
    return {
      storeCode: code,
      concern: row.CONCERN || concernOfStoreCode(code),
      branch: row.BRANCH || branchOfStoreCode(code),
      staffName: row.ENAME || "",
      attnStatus: row.ATTN_STATUS || "",
      store,
    };
  }

  return null;
}

// ─── Public resolver ───────────────────────────────────────────────────────────

/**
 * Find the store whose `storeCode` matches the branch the staff member is
 * present at today.
 *
 * @param ecno       EC number from the scanned QR code.
 * @param stores     Store master rows (`findAllStores`).
 * @param branchHint BRANCH (or full CONCERN-BRANCH) from the QR code. Used only
 *                   to try the likeliest codes first.
 *
 * Returns null when the staff member is not present at any store branch — head
 * office staff are the normal case here, since "HO" owns no store code — or
 * when credentials are missing or the endpoint is unreachable. The caller must
 * treat null as "let the customer pick the store".
 */
export async function resolveStaffStore(
  ecno: string,
  stores: StoreOption[],
  branchHint?: string | null
): Promise<StaffBranchMatch | null> {
  const trimmedEcno = ecno?.trim();
  if (!trimmedEcno || !stores.length) return null;

  const auth = authHeader();
  if (!auth) {
    console.warn(
      "resolveStaffStore: staff attendance credentials are not set (NEXT_PUBLIC_STAFF_PRESENT_USER / NEXT_PUBLIC_STAFF_PRESENT_PASSWORD) — skipping branch lock."
    );
    return null;
  }

  const { preferred, rest } = orderCandidates(stores, branchHint);

  // Likeliest codes first: for a QR carrying branch "CBE3" this is usually one
  // or two probes instead of the whole master.
  const hit = await firstMatch(trimmedEcno, preferred, auth);
  if (hit) return hit;

  return firstMatch(trimmedEcno, rest, auth);
}
