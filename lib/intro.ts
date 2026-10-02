/** When the head script drops html.intro: just after the CSS timeline in app/globals.css (2.15s) ends. */
export const INTRO_DURATION_MS = 2400;

/** Length of the quick fade a key press, click or scroll cuts to. */
const SKIP_MS = 250;

/**
 * Inlined in <head> by app/layout.tsx so the decision lands before first paint (spec 01 §3.6).
 * Plays on every full load of `/` unless reduced motion is preferred; the overlay itself is CSS-only,
 * and this script also ends it, so a slow hydration can never leave it stuck on screen.
 */
export const introScript = `(function () {
  var d = document.documentElement;
  if (location.pathname !== "/" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var events = ["keydown", "pointerdown", "wheel", "touchmove"];
  var timer;
  function off() {
    events.forEach(function (e) { removeEventListener(e, skip, true); });
  }
  function done() {
    off();
    d.classList.remove("intro", "intro-skip");
  }
  function skip() {
    off();
    clearTimeout(timer);
    d.classList.add("intro-skip");
    timer = setTimeout(done, ${SKIP_MS});
  }
  d.classList.add("intro");
  timer = setTimeout(done, ${INTRO_DURATION_MS});
  events.forEach(function (e) { addEventListener(e, skip, { capture: true, passive: true }); });
})();`;
