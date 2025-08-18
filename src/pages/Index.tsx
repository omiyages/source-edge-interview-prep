import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutHeader } from "@/components/LayoutHeader";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <LayoutHeader>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Source Edge Interview Questions Database
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Comprehensive interview preparation resources for technical roles
            </p>
          </div>
        </LayoutHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/resources" className="card-interactive">
            <div className="p-4">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Interview Questions
              </h2>
              <p className="text-gray-600">
                Access a vast collection of interview questions to prepare for
                technical interviews.
              </p>
            </div>
          </Link>

          <Link to="/tracks" className="card-interactive">
            <div className="p-4">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Learning Tracks
              </h2>
              <p className="text-gray-600">
                Follow curated learning tracks to master specific technologies
                and concepts.
              </p>
            </div>
          </Link>

          <Link to="/dashboard" className="card-interactive">
            <div className="p-4">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                User Dashboard
              </h2>
              <p className="text-gray-600">
                Track your progress, view personalized recommendations, and
                manage your learning journey.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
