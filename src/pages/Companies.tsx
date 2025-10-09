import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Globe, Users } from 'lucide-react';

export const Companies: React.FC = () => {
  const companies = [
    {
      id: 'woven',
      name: 'Woven by Toyota',
      description: 'Toyota\'s mobility technology subsidiary, responsible for developing and integrating the software behind Toyota\'s vehicle operating systems, automated driving, advanced safety technologies, and smart city initiatives.',
      industry: 'Automotive Software',
      location: 'Global',
      founded: '2021',
      website: 'https://woven.toyota',
      divisions: ['ADAS', 'Arene', 'Woven City', 'Enterprise Technology', 'Dojo'],
      image: '/woven-office-image.jpg',
      featured: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Companies</h1>
              <p className="text-xl text-gray-600 mt-2">
                Explore our portfolio of innovative companies driving the future of mobility and technology.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Showing {companies.length} company{companies.length !== 1 ? 'ies' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="relative">
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={company.image} 
                    alt={`${company.name} office`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {company.featured && (
                  <Badge className="absolute top-3 left-3 bg-red-600 text-white">
                    Featured
                  </Badge>
                )}
              </div>
              
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                    {company.name}
                  </h3>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {company.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Building2 className="w-4 h-4" />
                    <span>{company.industry}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Globe className="w-4 h-4" />
                    <span>{company.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>Founded {company.founded}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Divisions:</p>
                  <div className="flex flex-wrap gap-1">
                    {company.divisions.map((division, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {division}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link to={`/company/${company.id}`}>
                      Learn More
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      Website
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {companies.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">No companies found</h3>
            <p className="text-gray-400">Check back later for new company additions.</p>
          </div>
        )}
      </div>
    </div>
  );
};
