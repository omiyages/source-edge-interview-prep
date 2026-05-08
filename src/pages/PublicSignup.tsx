// ABOUTME: Dedicated Clerk sign-up route at /signup (linked from sitemap and legacy URLs)
import { SignUp } from "@clerk/react";
import { Seo } from "@/components/Seo";

export default function PublicSignup() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Seo
        title="Create Your Account"
        description="Create an Omiyages account to unlock interview prep tracks, job-seeker resources, and progress tracking for tech roles in Japan."
        path="/signup"
        noindex
      />
      <SignUp routing="path" path="/signup" signInUrl="/" />
    </div>
  );
}
