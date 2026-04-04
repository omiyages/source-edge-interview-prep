// ABOUTME: Dedicated Clerk sign-in route at /auth (linked from sitemap and legacy URLs)
import { SignIn } from "@clerk/react";

export default function Auth() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <SignIn routing="path" path="/auth" signUpUrl="/signup" />
    </div>
  );
}
