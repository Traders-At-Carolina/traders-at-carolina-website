import { SignUp } from "@clerk/nextjs";
import { AFTER_SIGN_IN } from "@/lib/games/save-score";

export const metadata = { title: "Create an account" };

export default function Page() {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-16">
      <SignUp path="/account/sign-up" signInUrl="/account/sign-in" fallbackRedirectUrl={AFTER_SIGN_IN} signInFallbackRedirectUrl={AFTER_SIGN_IN} />
    </main>
  );
}
