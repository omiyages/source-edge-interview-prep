
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const ResourcesHeader = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-4">
        <Link to="/">
          <Button variant="outline" className="flex items-center gap-2 bg-white hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 px-4 leading-tight">
          Source Edge Interview Preparation
        </h1>
        <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
          Curated collection of helpful resources for interview preparation and career development.
        </p>
      </div>
    </div>
  );
};
