/**
 * Shape of the application configuration assembled in `configuration.ts`.
 *
 * Every value is read from the environment with a string fallback, so each
 * field is a string. The two boolean switches, NETWORK_RESPONSE_JSON and
 * GATEWAY_ALLOW_GRAPHQL, are exported individually and are not part of it.
 */
export interface AppConfig {
  BLUPEACOCK_MEMBERSHIP_PLATFORM: string;
  BLUPEACOCK_PINCODE_LOOKUP: string;
  BLUPEACOCK_MEMBERSHIP_EMPOWERMENT: string;
  BLUPEACOCK_EMPLOYEE_DIRECTORY: string;
  BLUPEACOCK_EMPLOYEE_DIRECTORY_TOKEN: string;
}
