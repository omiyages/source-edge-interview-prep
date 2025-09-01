
// ABOUTME: Comprehensive page explaining Woven by Toyota's Enterprise Technology team
// ABOUTME: Includes overview, divisions, mission, team details, and video upload section

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Play, Building2, Target, Users, Cloud, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const WovenByToyota = () => {
  const { isAdmin } = useAuth();
  const [videos, setVideos] = useState<Array<{ id: string; title: string; url: string }>>([]);

  const handleVideoUpload = () => {
    // Placeholder for video upload functionality
    console.log('Video upload functionality to be implemented');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Woven by Toyota
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Pioneering the future of mobility through innovative technology and human-centered design
            </p>
            <div className="flex justify-center">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                Enterprise Technology Division
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Company Overview */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                About Woven by Toyota
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Woven by Toyota is Toyota's software and technology subsidiary, established to accelerate 
                the transformation of mobility through cutting-edge innovation. We're building the future 
                where technology enhances human potential and creates a more connected, sustainable world.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border">
                  <h3 className="font-semibold text-blue-900 mb-2">ADAS</h3>
                  <p className="text-sm text-blue-700">
                    Advanced Driver Assistance Systems for safer, smarter driving experiences
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border">
                  <h3 className="font-semibold text-green-900 mb-2">Arene</h3>
                  <p className="text-sm text-green-700">
                    Next-generation vehicle operating system and software platform
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border">
                  <h3 className="font-semibold text-purple-900 mb-2">Woven City</h3>
                  <p className="text-sm text-purple-700">
                    A living laboratory for sustainable smart city technologies
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border">
                  <h3 className="font-semibold text-orange-900 mb-2">Enterprise Technology</h3>
                  <p className="text-sm text-orange-700">
                    Cloud infrastructure and AI solutions powering Toyota's digital transformation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Mission & Values */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                Our Mission & Values
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Mission</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To weave technology into the fabric of mobility, creating solutions that enhance 
                    human potential and build a more sustainable, connected future for all.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Core Values</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      Human-centric innovation and design
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      Sustainable and responsible technology
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      Continuous learning and improvement
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      Collaborative partnership and trust
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Enterprise Technology Team */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Enterprise Technology Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-6">
                  The Enterprise Technology team serves as the backbone of Toyota's digital transformation, 
                  providing robust cloud infrastructure, cutting-edge AI solutions, and enterprise-grade 
                  technology platforms that enable innovation across all Toyota divisions worldwide.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Cloud Technology Team */}
                <Card className="border-2 border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <Cloud className="w-5 h-5" />
                      Cloud Technology Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Our Cloud Technology team builds and maintains scalable, secure, and reliable 
                      cloud infrastructure that powers Toyota's global operations.
                    </p>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-blue-900">Key Responsibilities:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Multi-cloud architecture design and implementation</li>
                        <li>• Enterprise-grade security and compliance</li>
                        <li>• DevOps and CI/CD pipeline automation</li>
                        <li>• Performance optimization and monitoring</li>
                        <li>• Disaster recovery and business continuity</li>
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant="outline" className="text-xs">AWS</Badge>
                      <Badge variant="outline" className="text-xs">Azure</Badge>
                      <Badge variant="outline" className="text-xs">GCP</Badge>
                      <Badge variant="outline" className="text-xs">Kubernetes</Badge>
                      <Badge variant="outline" className="text-xs">Terraform</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Enterprise AI Team */}
                <Card className="border-2 border-purple-200 bg-purple-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-900">
                      <Brain className="w-5 h-5" />
                      Enterprise AI Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-purple-800 leading-relaxed">
                      Our Enterprise AI team develops intelligent solutions that enhance decision-making, 
                      automate processes, and unlock new possibilities across Toyota's ecosystem.
                    </p>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-purple-900">Key Responsibilities:</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Machine learning model development and deployment</li>
                        <li>• Natural language processing and conversational AI</li>
                        <li>• Computer vision and predictive analytics</li>
                        <li>• AI governance and ethical AI frameworks</li>
                        <li>• Data science and advanced analytics platforms</li>
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant="outline" className="text-xs">TensorFlow</Badge>
                      <Badge variant="outline" className="text-xs">PyTorch</Badge>
                      <Badge variant="outline" className="text-xs">MLOps</Badge>
                      <Badge variant="outline" className="text-xs">NLP</Badge>
                      <Badge variant="outline" className="text-xs">Computer Vision</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Video Resources Section */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-6 h-6 text-primary" />
                Video Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Explore our collection of videos showcasing Enterprise Technology initiatives, 
                team highlights, and technical deep-dives.
              </p>

              {isAdmin && (
                <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium mb-2">Upload Video Content</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Share videos about Enterprise Technology projects, team updates, or technical presentations
                      </p>
                      <Button onClick={handleVideoUpload} variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Video
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {videos.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No videos uploaded yet. Check back soon for updates!</p>
                </div>
              )}

              {videos.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video) => (
                    <Card key={video.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                          <Play className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h4 className="font-medium mb-2">{video.title}</h4>
                        <Button variant="outline" size="sm" className="w-full">
                          Watch Video
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default WovenByToyota;
