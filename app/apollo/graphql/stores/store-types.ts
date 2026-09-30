/**
 * Types for the store GraphQL operations.
 *
 * `StoreOption` is the shared type in `@/types/billing`, re-exported so the
 * Apollo layer imports from a single place.
 */

import type { StoreOption } from "@/types/billing";

export type { StoreOption } from "@/types/billing";

export interface GetAllStoresResponse {
  findAllStores: StoreOption[];
}
