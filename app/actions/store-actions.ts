"use server";

import { runAction, type ActionResult } from "@/app/actions/action-result";
import { fetchStores } from "@/app/apollo/hooks/stores/fetch-stores-server";
import type { StoreOption } from "@/app/apollo/graphql/stores/store-types";

/** Every store, for the store picker. */
export async function getStores(): Promise<ActionResult<StoreOption[]>> {
  return runAction("load stores", () => fetchStores());
}
