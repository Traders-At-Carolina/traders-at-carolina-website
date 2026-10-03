import { SignUp } from "@clerk/nextjs";

export const metadata = { title: "Accept admin invitation" };

/** Only reachable from an invitation link while Clerk is in Restricted sign-up mode (spec 06 §4). */
export default function Page() {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-16">
      <SignUp path="/admin/sign-up" signInUrl="/admin/sign-in" fallbackRedirectUrl="/admin" />
    </main>
  );
}
