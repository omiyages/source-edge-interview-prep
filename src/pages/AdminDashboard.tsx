
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { LayoutHeader } from "@/components/LayoutHeader";

interface StatsCardProps {
  title: string;
  value: string | number | JSX.Element;
  isLoading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, isLoading }) => (
  <Card className="card-interactive">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {isLoading ? <Skeleton className="h-6 w-16" /> : <div className="text-2xl font-bold">{value}</div>}
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<{ users: number; courses: number; tracks: number }>({
    users: 0,
    courses: 0,
    tracks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile?.role !== 'admin') {
      return;
    }

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // For now, we'll use mock data since we don't have a backend API
        // This can be replaced with real API calls when backend is available
        setTimeout(() => {
          setStats({
            users: 150,
            courses: 25,
            tracks: 8
          });
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user, profile, navigate]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <LayoutHeader title="Admin Dashboard" />
      
      {profile?.role !== 'admin' && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <p className="text-destructive">You don't have permission to access this page.</p>
        </div>
      )}

      {profile?.role === 'admin' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard title="Total Users" value={stats.users} isLoading={isLoading} />
            <StatsCard title="Total Courses" value={stats.courses} isLoading={isLoading} />
            <StatsCard title="Total Tracks" value={stats.tracks} isLoading={isLoading} />
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="tracks">Tracks</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <div className="bg-muted rounded-md p-4">
                <h3 className="text-lg font-semibold">Users Management</h3>
                <p className="text-sm text-muted-foreground">Manage user accounts and permissions.</p>
              </div>
            </TabsContent>
            <TabsContent value="courses">
              <div className="bg-muted rounded-md p-4">
                <h3 className="text-lg font-semibold">Courses Management</h3>
                <p className="text-sm text-muted-foreground">Create, edit, and manage courses.</p>
              </div>
            </TabsContent>
            <TabsContent value="tracks">
              <div className="bg-muted rounded-md p-4">
                <h3 className="text-lg font-semibold">Tracks Management</h3>
                <p className="text-sm text-muted-foreground">Organize courses into learning tracks.</p>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
