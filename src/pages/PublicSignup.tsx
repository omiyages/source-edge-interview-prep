// ABOUTME: Dedicated Clerk sign-up route at /signup (linked from sitemap and legacy URLs)
import { SignUp } from "@clerk/react";

export default function PublicSignup() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <SignUp routing="path" path="/signup" signInUrl="/auth" />
    </div>
  );
}
