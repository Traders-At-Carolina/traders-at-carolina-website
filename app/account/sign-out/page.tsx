import { SignOutNow } from "@/components/SignOutNow";

export const metadata = { title: "Signing out" };

/** Where the corner sign-out button lands: public pages run no Clerk, so this page (under /account's provider) ends the session and returns home. */
export default function Page() {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-16">
      <SignOutNow />
    </main>
  );
}
