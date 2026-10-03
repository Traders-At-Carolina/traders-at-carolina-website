import { SignIn } from "@clerk/nextjs";
import { AFTER_SIGN_IN } from "@/lib/games/save-score";

export const metadata = { title: "Sign in" };

/** Back to the games afterwards, where ?claim=1 moves this browser's earlier scores onto the account. */
export default function Page() {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-16">
      <SignIn path="/account/sign-in" signUpUrl="/account/sign-up" fallbackRedirectUrl={AFTER_SIGN_IN} signUpFallbackRedirectUrl={AFTER_SIGN_IN} />
    </main>
  );
}
