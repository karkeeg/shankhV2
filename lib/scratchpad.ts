/**
 * Client-side persistence for the Scratchpad (whiteboard) surface.
 *
 * Each scratchpad scene is stored in localStorage under a namespaced key:
 *   shankh_scratch_{scope}      — Excalidraw elements (serialized array)
 *
 * Scratchpads persist across reloads and navigation. They are ONLY cleared:
 *   1. explicitly by the user (Clear button on the board), or
 *   2. on logout, via clearAllScratchpads().
 */

const PREFIX = "shankh_scratch_";

/** Build the storage key for a given scope, e.g. scratchpadKey(`case-${id}`). */
export function scratchpadKey(scope: string): string {
  return `${PREFIX}${scope}`;
}

/** Called on logout — wipes every saved scratchpad scene. */
export function clearAllScratchpads(): void {
  try {
    if (typeof window === "undefined") return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // private browsing / quota — ignore
  }
}
