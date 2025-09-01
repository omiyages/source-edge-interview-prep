import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  Trophy, 
  TrendingUp, 
  Clock, 
  Star,
  ChevronRight,
  Settings,
  LogOut,
  Building2
} from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { useResources } from "@/hooks/useResources";

const Index = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { courses, loading: coursesLoading } = useCourses(true, 6);
  const { resources, loading: resourcesLoading } = useResources(true, 3);

  const handleLogout = async () => {
    try {
      const { signOut } = await import("@/hooks/useAuthContext");
      // This will be handled by the auth context
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const featuredCourses = courses.slice(0, 3);
  const recentResources = resources.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
            <p className="text-muted-foreground mt-2">
              Continue your learning journey with Toyota's training platform
            </p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/woven-by-toyota')}
              className="flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              About Woven by Toyota
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/resources')}
              className="flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Resources
            </Button>
            {isAdmin && (
              <Button 
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Admin Dashboard
              </Button>
            )}
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                  <p className="text-2xl font-bold text-foreground">{courses.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resources</p>
                  <p className="text-2xl font-bold text-foreground">{resources.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-foreground">0</p>
                </div>
                <Trophy className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold text-foreground">0%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Courses */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Featured Courses</h2>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/tracks')}
              className="flex items-center gap-2"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="h-3 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <Card 
                  key={course.id} 
                  className="card-interactive"
                  onClick={() => navigate(`/course/${course.slug}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <Badge variant="secondary" className="text-xs">
                        {course.category || 'General'}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">4.8</span>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>2-3 hours</span>
                      </div>
                      <span className="text-primary font-medium">Start Learning</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Recent Resources */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Recent Resources</h2>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/resources')}
              className="flex items-center gap-2"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {resourcesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="h-3 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentResources.map((resource) => (
                <Card key={resource.id} className="card-elevated hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <Badge variant="outline" className="text-xs">
                        {resource.type || 'Document'}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                      {resource.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {resource.description}
                    </p>
                    
                    <Button variant="outline" size="sm" className="w-full">
                      View Resource
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              className="card-interactive"
              onClick={() => navigate('/tracks')}
            >
              <CardContent className="p-6 text-center">
                <BookOpen className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Browse Courses</h3>
                <p className="text-sm text-muted-foreground">
                  Explore our comprehensive course catalog
                </p>
              </CardContent>
            </Card>

            <Card 
              className="card-interactive"
              onClick={() => navigate('/resources')}
            >
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Resources</h3>
                <p className="text-sm text-muted-foreground">
                  Access learning materials and documents
                </p>
              </CardContent>
            </Card>

            <Card 
              className="card-interactive"
              onClick={() => navigate('/dashboard')}
            >
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">My Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Track your learning journey
                </p>
              </CardContent>
            </Card>

            <Card 
              className="card-interactive"
              onClick={() => navigate('/woven-by-toyota')}
            >
              <CardContent className="p-6 text-center">
                <Building2 className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">About Us</h3>
                <p className="text-sm text-muted-foreground">
                  Learn about Woven by Toyota
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
