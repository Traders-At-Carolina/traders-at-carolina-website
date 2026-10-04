import { SignUp } from "@clerk/nextjs";
import { AuthFrame } from "@/components/admin/AuthFrame";

export const metadata = { title: "Accept admin invitation" };

/** Only reachable from an invitation link while Clerk is in Restricted sign-up mode (spec 06 §4). */
export default function Page() {
  return (
    <AuthFrame>
      <SignUp path="/admin/sign-up" signInUrl="/admin/sign-in" fallbackRedirectUrl="/admin" />
    </AuthFrame>
  );
}
