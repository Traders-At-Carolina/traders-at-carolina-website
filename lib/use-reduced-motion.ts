import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";

/** Live `prefers-reduced-motion: reduce`. False on the server; hydration corrects it for visitors who ask for less motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
