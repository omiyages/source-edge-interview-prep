
// ABOUTME: Hero section component for the main landing page
// ABOUTME: Features course statistics, user greeting, and navigation elements
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, BookOpen, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HeroSectionProps {
  totalCourses: number;
  totalUsers: number;
  totalQuestions: number;
}

export function HeroSection({ totalCourses, totalUsers, totalQuestions }: HeroSectionProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header with auth and theme controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        {user && (
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-primary/10 rounded-full border border-primary/20 px-4 py-2">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Master Your <span className="text-purple-gradient">Interview Skills</span>
          </h1>
          
          {user && (
            <p className="mt-4 text-lg text-muted-foreground">
              Welcome back, <span className="font-semibold text-foreground">{user.email}</span>!
            </p>
          )}
          
          <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto">
            Comprehensive interview preparation platform with structured courses, practice questions, and expert resources to help you land your dream job.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg" className="btn-purple-gradient">
              <Link to="/dashboard">
                Get Started
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/resources">
                Browse Resources
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{totalCourses}</div>
              <div className="text-sm text-muted-foreground">Interview Courses</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{totalUsers}</div>
              <div className="text-sm text-muted-foreground">Active Learners</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Award className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{totalQuestions}</div>
              <div className="text-sm text-muted-foreground">Practice Questions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
