
// ABOUTME: User dashboard page component for regular users
// ABOUTME: Redirects admin users to admin dashboard automatically

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const UserDashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  console.log('🎯 UserDashboard Debug:', {
    hasUser: !!user,
    userEmail: user?.email,
    loading,
    isAdmin,
    currentUrl: window.location.pathname
  });

  // Handle admin redirect
  useEffect(() => {
    if (!loading && isAdmin) {
      console.log('🚫 UserDashboard: User is admin, redirecting to admin dashboard');
      navigate('/admin', { replace: true });
    }
  }, [loading, isAdmin, navigate]);

  // Show loading state while authentication is being resolved
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is admin (will redirect)
  if (isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Render user dashboard for regular users
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {user?.email}!
          </h1>
          <p className="text-lg text-gray-600">
            Your personalized learning dashboard
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
            <p className="text-gray-600">Track your learning journey and achievements.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Assigned Courses</h2>
            <p className="text-gray-600">Access your assigned training materials.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Resources</h2>
            <p className="text-gray-600">Browse available learning resources.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
