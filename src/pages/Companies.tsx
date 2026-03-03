import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/ui/lazy-image';
import { Link } from 'react-router-dom';
import { Building2, Globe, Users } from 'lucide-react';
import { NavigationHeader } from '@/components/NavigationHeader';

const Companies: React.FC = () => {
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
      image: '/woven-office-image.jpg'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-foreground mb-1">
            Companies
          </h1>
          <p className="text-lg text-foreground font-semibold max-w-2xl mx-auto">
            Explore list of companies hiring top talents in Japan
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Showing {companies.length} company{companies.length !== 1 ? 'ies' : ''}
          </p>
        </div>

        {/* Companies Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="relative">
                <div className="aspect-video overflow-hidden">
                  <LazyImage 
                    src={company.image} 
                    alt={`${company.name} office`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
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
                
                <Button asChild className="w-full">
                  <Link to={`/company/${company.id}`}>
                    Learn More
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {companies.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No companies found</h3>
            <p className="text-muted-foreground">Check back later for new company additions.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-border/30 mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 Omiyages. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Companies;
