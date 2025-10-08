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
  Clock,
  Check
} from 'lucide-react';

export const Company: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Top light grey banner */}
      <div className="bg-gray-100 py-4">
        <div className="container mx-auto px-6">
          <p className="text-center text-gray-600">Career and well-being opportunities at Woven by Toyota</p>
        </div>
      </div>

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
            <a href="#about" className="text-gray-700 hover:text-red-600 font-medium">About</a>
            <a href="#divisions" className="text-gray-700 hover:text-red-600 font-medium">Divisions</a>
            <a href="#interview-process" className="text-gray-700 hover:text-red-600 font-medium">Interview Process</a>
            <a href="#culture" className="text-gray-700 hover:text-red-600 font-medium">Culture</a>
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
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  Learn More
                </Button>
              </div>
            </div>

            {/* Right side - Office Image */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden aspect-[4/3] shadow-lg">
                <img 
                  src="/woven-office-image.jpg" 
                  alt="Woven by Toyota Modern Office - Dynamic workspace with collaborative areas and innovative design"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Woven by Toyota Section */}
      <div id="about" className="py-16 bg-gray-50">
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
      <div id="divisions" className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Divisions</h2>
            <p className="text-xl text-gray-600">Each division focuses on different aspects of mobility innovation, working together to create comprehensive solutions.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* ADAS Division */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">ADAS</h3>
              <p className="text-gray-600 mb-6">Developing cutting-edge safety technologies that enhance driver awareness and vehicle control. Our ADAS team creates intelligent systems that help prevent accidents and make driving safer for everyone.</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Autonomous emergency braking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Lane departure warning systems</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Adaptive cruise control</span>
                </li>
              </ul>
            </Card>

            {/* Arene Division */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Arene</h3>
              <p className="text-gray-600 mb-6">Our software-defined vehicle platform that enables rapid development and deployment of automotive applications. Arene provides the foundation for next-generation connected vehicles.</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Over-the-air updates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Real-time vehicle analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Connected services platform</span>
                </li>
              </ul>
            </Card>

            {/* Woven City Division */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Building2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Woven City</h3>
              <p className="text-gray-600 mb-6">Building a prototype city of the future at the base of Mt. Fuji. This living laboratory will test and develop technologies for autonomous vehicles, smart infrastructure, and sustainable living.</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Smart city infrastructure</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Autonomous vehicle testing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Sustainable energy systems</span>
                </li>
              </ul>
            </Card>

            {/* Enterprise Technology Division */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Enterprise Technology</h3>
              <p className="text-gray-600 mb-6">Providing enterprise-grade technology solutions that support Toyota's global operations and enable digital transformation across the organization.</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Cloud infrastructure</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Data analytics platforms</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Digital workplace solutions</span>
                </li>
              </ul>
            </Card>

            {/* Dojo Division */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Lightbulb className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Dojo</h3>
              <p className="text-gray-600 mb-6">Our machine learning and AI division that develops intelligent systems for autonomous driving and mobility services. Dojo creates the brain behind our smart vehicles.</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Computer vision systems</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Neural network training</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Real-time decision making</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Interview Process Section */}
      <div id="interview-process" className="py-16 bg-gray-50">
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
      <div id="culture" className="py-16 bg-white">
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
