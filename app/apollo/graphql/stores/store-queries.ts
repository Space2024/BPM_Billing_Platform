import { gql } from "@apollo/client";

export const GET_ALL_STORES = gql`
  query GetStoresForDropdown {
    findAllStores {
      storeCode
      storeId
      storeName
      storeType
      branchId
      location
    }
  }
`;
