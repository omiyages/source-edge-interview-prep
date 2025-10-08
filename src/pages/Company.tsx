import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Play, 
  Users, 
  Lightbulb, 
  GraduationCap, 
  Scale,
  Building2,
  Globe,
  Target,
  Heart,
  Shield,
  Zap,
  TrendingUp,
  Award,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';

export const Company: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Woven by Toyota</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-gray-700 hover:text-red-600 font-medium">About</a>
            <a href="#" className="text-gray-700 hover:text-red-600 font-medium">Divisions</a>
            <a href="#" className="text-gray-700 hover:text-red-600 font-medium">Interview Process</a>
            <a href="#" className="text-gray-700 hover:text-red-600 font-medium">Benefits</a>
            <a href="#" className="text-gray-700 hover:text-red-600 font-medium">Culture</a>
          </div>

          {/* Apply Button */}
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            Apply Now
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div>
              <h1 className="text-6xl font-bold text-gray-900 mb-6">
                Building the Future of
                <br />
                <span className="text-red-600">Mobility</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Woven by Toyota is an automotive software company that develops and deploys mobility services to realize a world where everyone has the freedom to move.
              </p>
              <div className="flex gap-4">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                  Join Our Team
                </Button>
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  Learn More
                </Button>
              </div>
            </div>

            {/* Right side - Image placeholder */}
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl aspect-[4/3] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-red-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Building2 className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-gray-600 font-medium">Woven by Toyota Headquarters</p>
                  <p className="text-sm text-gray-500 mt-2">Modern glass building with TOYOTA branding</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};
