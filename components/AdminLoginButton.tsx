import Link from "next/link";
import { LogIn } from "lucide-react";

/**
 * Circular admin sign-in, fixed in the bottom-right corner of every public page (spec 06 §4).
 * A plain link: Clerk only loads under /admin, so visitors download no auth code.
 */
export function AdminLoginButton() {
  return (
    <Link
      href="/admin/sign-in"
      prefetch={false}
      rel="nofollow"
      aria-label="Admin sign in"
      title="Admin sign in"
      className="fixed right-4 bottom-4 z-40 flex size-11 items-center justify-center rounded-full border border-rule bg-bone text-ink-2 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.25)] transition-colors duration-150 hover:text-navy focus-visible:text-navy print:hidden md:right-6 md:bottom-6"
    >
      <LogIn aria-hidden="true" className="size-5" strokeWidth={1.5} />
    </Link>
  );
}
