
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
    <div className="min-h-screen flex">
      {/* Left Side - Purple Gradient with Branding (matches Auth page) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-800 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/60" />
        
        {/* Geometric Background Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-lg rotate-12 transform"></div>
        <div className="absolute top-40 left-40 w-24 h-24 border border-white/15 rounded-lg rotate-45 transform"></div>
        <div className="absolute top-60 left-32 w-16 h-16 border border-white/10 rounded-lg -rotate-12 transform"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="mb-8">
            <div className="w-12 h-12 mb-6">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Join Source Edge<br />
              Database Today! 🚀
            </h1>
          </div>
          
          <p className="text-lg text-white/90 leading-relaxed max-w-md">
            Get prepared for your upcoming interviews through our Database 
            of past questions and certified tips.
          </p>
          
          <div className="absolute bottom-8 left-12 text-white/60 text-sm">
            © 2026 Source Edge. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="text-right mb-8">
            <h2 className="text-2xl font-bold text-foreground">Source Edge</h2>
          </div>
          
          <PublicSignupForm variant="flat" />
        </div>
      </div>
    </div>
  );
};

export default PublicSignup;
