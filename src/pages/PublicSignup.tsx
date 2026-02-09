
import { PublicSignupForm } from "@/components/PublicSignupForm";

const PublicSignup = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <PublicSignupForm />
      </div>
    </div>
  );
};

export default PublicSignup;
