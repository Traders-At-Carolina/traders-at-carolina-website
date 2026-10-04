import { SignIn } from "@clerk/nextjs";
import { AuthFrame } from "@/components/admin/AuthFrame";

export const metadata = { title: "Admin sign in" };

export default function Page() {
  return (
    <AuthFrame>
      <SignIn path="/admin/sign-in" signUpUrl="/admin/sign-up" fallbackRedirectUrl="/admin" />
    </AuthFrame>
  );
}
