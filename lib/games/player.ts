/**
 * A random id for this browser, so anonymous scores can be grouped and later claimed by an account
 * (spec 03 §3.7). Storage can be missing or blocked: then the id lasts for this page load only.
 */

const KEY = "tac:games:player";
let fallback: string | undefined;

export function getPlayerId(): string {
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
    return id;
  } catch {
    fallback ??= crypto.randomUUID();
    return fallback;
  }
}
