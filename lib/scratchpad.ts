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
