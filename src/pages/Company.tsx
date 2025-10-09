import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
  Check,
  Car,
  Code
} from 'lucide-react';

export const Company: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <Breadcrumbs 
              items={[
                { label: "Home", href: "/" },
                { label: "Company" }
              ]}
            />
            
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

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

      {/* Page Navigation */}
      <div className="bg-gray-50 py-6 border-b">
        <div className="container mx-auto px-6">
          <div className="flex justify-center">
            <nav className="flex items-center gap-8">
              <a href="#about" className="text-gray-700 hover:text-red-600 font-medium transition-colors">About</a>
              <a href="#divisions" className="text-gray-700 hover:text-red-600 font-medium transition-colors">Divisions</a>
              <a href="#interview-process" className="text-gray-700 hover:text-red-600 font-medium transition-colors">Interview Process</a>
              <a href="#culture" className="text-gray-700 hover:text-red-600 font-medium transition-colors">Culture</a>
            </nav>
          </div>
        </div>
      </div>

      {/* About Woven by Toyota Section */}
      <div id="about" className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">About Woven by Toyota</h2>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Woven by Toyota is Toyota's mobility technology subsidiary, responsible for developing and integrating the software behind Toyota's vehicle operating systems, automated driving, advanced safety technologies, and smart city initiatives such as Woven City.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Building the Future of Mobility</h3>
                <p className="text-gray-600">Woven by Toyota is Toyota's innovation arm focused on transforming mobility for a safer, more connected, and sustainable future. It develops advanced technologies that go beyond traditional vehicles, including automated driving, smart infrastructure, and software-defined mobility systems.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Code className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Software-First Vehicle Development</h3>
                <p className="text-gray-600">At its core, Woven by Toyota is pioneering a "software-first" approach to cars. It creates platforms and tools that enable continuous updates and improvements to vehicle performance, safety, and user experience—much like how smartphones evolve through software updates.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">The Woven City Vision</h3>
                <p className="text-gray-600">One of its flagship projects, Woven City, is a prototype city in Japan designed as a living laboratory for mobility and smart technology. Here, companies tests autonomous vehicles, robotics, and renewable energy solutions in real-world conditions, shaping innovations that can scale to global communities.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divisions Section */}
      <div id="divisions" className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Divisions</h2>
            <p className="text-xl text-gray-600">Woven by Toyota focuses on 5 main products, ranging from self-driving, smart city, Software-Defined Vehicle, and more.</p>
          </div>
          <div className="max-w-6xl mx-auto space-y-8">
            {/* ADAS Division */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-4">ADAS</h3>
                  <p className="text-gray-600 mb-6">Developing advanced driver-assistance systems that enhance safety and confidence on the road. Woven by Toyota designs intelligent features that support drivers, prevent accidents, and move Toyota closer to fully automated mobility.</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Autonomous emergency braking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Lane departure warning</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Adaptive cruise control</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Arene Division */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-8 h-8 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-4">Arene</h3>
                  <p className="text-gray-600 mb-6">Building Toyota's next-generation vehicle software platform and operating system. Arene enables developers to create, test, and deploy software seamlessly across vehicles, driving faster innovation and continuous improvement.</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Vehicle OS and software platform</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Scalable development environment</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Over-the-air updates</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Woven City Division */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-4">Woven City</h3>
                  <p className="text-gray-600 mb-6">Creating a living laboratory for mobility and sustainability at the base of Mt. Fuji. In September 2025, residents moved into Woven City as part of Phase 1, marking the start of real-world testing for autonomous vehicles, robotics, and clean energy systems.</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Autonomous and connected mobility testing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Smart infrastructure integration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Sustainable community design</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Enterprise Technology Division */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-4">Enterprise Technology</h3>
                  <p className="text-gray-600 mb-6">Enterprise Technology team is the backbone of all the engineering projects within Woven, building a cloud-based platform to help engineers build AI/ML applications and software for the automotive industry.</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Cloud Platform for automotive industry</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Enterprise AI - AI/ML application</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Engineering infrastructure and network</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Dojo Division */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-8 h-8 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-4">Dojo</h3>
                  <p className="text-gray-600 mb-6">Dojo is a EdTech platform that provides employee training around languages, programming, soft-skill, and other professional development. The platform is used by Toyota Group and other external partners.</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">EdTech Platform</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">B2B Employee Training</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Enabling spoken language & technical skill development</span>
                    </li>
                  </ul>
                </div>
              </div>
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
          <div className="max-w-6xl mx-auto">
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
            <p className="text-xl text-gray-600 max-w-6xl mx-auto">
              Experience our innovative workspace and collaborative culture that drives breakthrough innovations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* YouTube Video */}
            <div className="relative">
              <div className="rounded-lg aspect-video overflow-hidden shadow-lg">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/2Euzdn8fPJo"
                  title="Woven by Toyota Office Tour"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="rounded-lg"
                ></iframe>
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
