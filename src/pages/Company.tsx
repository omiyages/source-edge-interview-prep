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
    <div className="min-h-screen bg-gray-50">
      {/* Top Section */}
      <div className="bg-gray-100 py-4">
        <div className="container mx-auto px-6">
          <p className="text-center text-gray-600">Career and well-being opportunities at Woven by Toyota</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">Woven by Toyota</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Building the future of mobility through innovative software solutions and cutting-edge technology.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100">
              Explore Our Culture
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-600">
              View Open Positions
            </Button>
          </div>
        </div>
      </div>

      {/* Benefits Package & Salary Ranges Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Benefits Package */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Benefits Package</h2>
              <div className="space-y-4">
                {[
                  "Comprehensive health, dental, and vision insurance",
                  "401(k) with company matching",
                  "Flexible work arrangements and remote options",
                  "Professional development and training programs",
                  "Generous paid time off and holidays",
                  "Stock options and equity participation"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Salary Ranges */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Salary Ranges</h2>
              <div className="space-y-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Software Engineers</h3>
                    <Badge variant="outline">$120K - $180K</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Plus equity and bonuses</p>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Senior Engineers</h3>
                    <Badge variant="outline">$160K - $220K</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Plus equity and bonuses</p>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Engineering Managers</h3>
                    <Badge variant="outline">$180K - $250K</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Plus equity and bonuses</p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Office & Culture Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Office & Culture</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience our innovative workspace and collaborative culture that drives breakthrough innovations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Video Placeholder */}
            <div className="relative">
              <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                    <Play className="w-8 h-8 text-blue-600 ml-1" />
                  </div>
                  <p className="text-gray-600">Office Tour Video</p>
                </div>
              </div>
            </div>

            {/* Culture Features */}
            <div>
              <h3 className="text-2xl font-bold mb-6">Innovation-Driven Culture</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Collaborative Environment</h4>
                    <p className="text-gray-600">Focus on diverse, talented teams working on cutting-edge mobility solutions.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Innovation Focus</h4>
                    <p className="text-gray-600">Encouragement for creative thinking and breakthrough ideas in transportation.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Continuous Learning</h4>
                    <p className="text-gray-600">Access to training programs, conferences, and mentorship.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Scale className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Work-Life Balance</h4>
                    <p className="text-gray-600">Flexible schedules and remote work options.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Open Positions Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Open Positions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our team and help shape the future of mobility. We're looking for talented individuals to fill these exciting roles.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Embedded Software Engineer</h3>
              <p className="text-gray-600 mb-6">
                Focus on low-level software for automotive systems and next-generation vehicles.
              </p>
              <Button className="w-full">Apply Now</Button>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Engineering Manager</h3>
              <p className="text-gray-600 mb-6">
                Focus on leading and mentoring teams, driving technical strategy.
              </p>
              <Button className="w-full">Apply Now</Button>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Backend Engineer</h3>
              <p className="text-gray-600 mb-6">
                Focus on building scalable backend systems and APIs for a global mobility platform.
              </p>
              <Button className="w-full">Apply Now</Button>
            </Card>
          </div>
        </div>
      </div>


      {/* Call to Action Section */}
      <div className="py-16 bg-red-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Shape the Future of Mobility?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join our team of innovators and help build the technologies that will transform how the world moves.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100">
              View Open Positions
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-600">
              Learn More About Us
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
};
