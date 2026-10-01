/** LinkedIn mark (lucide 1.x ships no brand icons). Decorative; the link carries the accessible name. */
export function LinkedInIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" className={className} fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.83v1.5h.05c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.66 4.8 6.13v5.43h-4v-4.82c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.9h-4v-11Z" />
    </svg>
  );
}
