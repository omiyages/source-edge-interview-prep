
import { PublicSignupForm } from "@/components/PublicSignupForm";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Home, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PublicSignup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    navigate("/auth");
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary to-primary/80 p-8 text-center space-y-2">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Already Signed In</h2>
          </CardHeader>
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-gray-600">
              You are already signed in as <strong>{user.email}</strong>. You cannot create a new account while logged in.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/")} className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out & Register New Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <PublicSignupForm />
      </div>
    </div>
  );
};

export default PublicSignup;
