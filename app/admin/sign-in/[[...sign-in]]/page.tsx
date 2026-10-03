import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Admin sign in" };

export default function Page() {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-16">
      <SignIn path="/admin/sign-in" signUpUrl="/admin/sign-up" fallbackRedirectUrl="/admin" />
    </main>
  );
}
