const GRADIENT_ID = "instagram-gradient";

/**
 * Instagram glyph in the brand's yellow-to-purple gradient (lucide 1.x ships no brand icons). Decorative; the link
 * carries the accessible name. Rendered once per page (the footer), so the gradient id is fixed.
 */
export function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id={GRADIENT_ID} x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset="0.25" stopColor="#FA7E1E" />
          <stop offset="0.5" stopColor="#D62976" />
          <stop offset="0.75" stopColor="#962FBF" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${GRADIENT_ID})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
      </g>
      <circle cx="17.5" cy="6.5" r="1" fill="#D62976" />
    </svg>
  );
}
