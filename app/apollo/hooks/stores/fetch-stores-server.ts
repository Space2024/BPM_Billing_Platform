import { serverGraphQLService } from "@/app/apollo/dal-server";
import { GET_ALL_STORES } from "@/app/apollo/graphql/stores/store-queries";
import type {
  GetAllStoresResponse,
  StoreOption,
} from "@/app/apollo/graphql/stores/store-types";

/**
 * The store master changes a few times a year and sits on the critical path of
 * the scanned QR page, so the response is reused for an hour.
 */
const STORE_CACHE_SECONDS = 3600;

/**
 * Every store, for the store picker.
 *
 * Returns an empty list rather than throwing when the backend is unreachable.
 * The store field is only needed at the registration step, so a customer can
 * still look their membership up while this is failing.
 */
export async function fetchStores(): Promise<StoreOption[]> {
  const { data, error } = await serverGraphQLService.query<GetAllStoresResponse>(
    GET_ALL_STORES,
    {},
    { revalidate: STORE_CACHE_SECONDS }
  );

  if (error) {
    console.error("[Server] fetchStores failed, returning empty list:", error.message);
    return [];
  }

  return data?.findAllStores ?? [];
}
