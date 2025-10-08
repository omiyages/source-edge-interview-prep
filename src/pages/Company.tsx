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

      {/* About Woven by Toyota Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">About Woven by Toyota</h2>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              We are a global team of engineers, designers, and innovators working together to create the future of mobility. Our mission is to develop software solutions that make transportation safer, more efficient, and more accessible for everyone.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Global Team</h3>
                <p className="text-gray-600">Diverse talent from around the world</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Innovation Focus</h3>
                <p className="text-gray-600">Cutting-edge technology and solutions</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Global Impact</h3>
                <p className="text-gray-600">Transforming mobility worldwide</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divisions Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Divisions</h2>
            <p className="text-xl text-gray-600">Explore the different areas of our organization</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">ADAS</h3>
              <p className="text-gray-600">Advanced Driver Assistance Systems and autonomous driving technology</p>
            </Card>
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Arene Platform</h3>
              <p className="text-gray-600">Cloud-based software platform for connected vehicles</p>
            </Card>
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Woven City</h3>
              <p className="text-gray-600">Smart city development and urban mobility solutions</p>
            </Card>
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Enterprise Tech</h3>
              <p className="text-gray-600">Enterprise software solutions and business applications</p>
            </Card>
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Security</h3>
              <p className="text-gray-600">Cybersecurity and data protection solutions</p>
            </Card>
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Research & Development</h3>
              <p className="text-gray-600">Innovation labs and future technology research</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Interview Process Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Interview Process</h2>
            <p className="text-xl text-gray-600">Our streamlined process to find the right fit</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Application</h3>
                <p className="text-gray-600">Submit your application and portfolio</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Initial Screening</h3>
                <p className="text-gray-600">Phone or video interview with HR</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Technical Interview</h3>
                <p className="text-gray-600">Technical assessment with engineering team</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">4</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Final Interview</h3>
                <p className="text-gray-600">Meet the team and discuss role fit</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Office & Culture Section */}
      <div className="py-16 bg-white">
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
                    <Play className="w-8 h-8 text-red-600 ml-1" />
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

    </div>
  );
};
