export type NavLink = { href: string; label: string };

/** Header and footer navigation (00 §11). Apply is rendered separately as a button. */
export const primaryNav: NavLink[] = [
  { href: "/about", label: "About" },
  { href: "/membership", label: "Membership" },
  { href: "/team", label: "Team" },
];
