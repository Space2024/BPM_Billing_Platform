/**
 * Shared result shape and error wrapper for the server actions in this folder.
 *
 * Deliberately no "use server" directive. This is a plain helper imported by
 * "use server" modules. Such a module may only export async functions, because
 * every export becomes a callable action endpoint, so the ActionResult type
 * could not live here at all if the directive were added.
 */

/**
 * The envelope every action returns.
 *
 * Written as a discriminated union rather than
 * `{ success: boolean; data: T | null; error: string | null }` so that checking
 * `result.success` narrows `data` to `T` for the caller. The looser shape
 * narrows nothing and leaves every consumer null-checking a value that cannot
 * be null on the success branch.
 */
export type ActionResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string };

/**
 * Run a server-side fetch and normalise the outcome to an ActionResult.
 *
 * @param what - the operation as a verb phrase, for example "look up mobile
 *   number" or "create billing registration". Used verbatim in the log line and
 *   in the fallback message, which reads `Failed to ${what}`.
 * @param run - the fetcher, already unwrapped to the payload the action exposes.
 */
export async function runAction<T>(
  what: string,
  run: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    return { success: true, data: await run(), error: null };
  } catch (error) {
    console.error(`[Server Action] Failed to ${what}:`, error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : `Failed to ${what}`,
    };
  }
}
