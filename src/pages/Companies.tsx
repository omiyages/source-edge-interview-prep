import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/lazy-image';
import { Link } from 'react-router-dom';
import { Building2, Globe, Users } from 'lucide-react';
import { NavigationHeader } from '@/components/NavigationHeader';

type EmployeeSize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1001+';

const EMPLOYEE_LABELS: Record<EmployeeSize, string> = {
  '1-10': '1–10 employees',
  '11-50': '11–50 employees',
  '51-200': '51–200 employees',
  '201-500': '201–500 employees',
  '501-1000': '501–1,000 employees',
  '1001+': '1,001+ employees',
};

const companies = [
  {
    id: 'woven',
    name: 'Woven by Toyota',
    description: 'Toyota\'s mobility technology subsidiary, responsible for developing and integrating the software behind Toyota\'s vehicle operating systems, automated driving, advanced safety technologies, and smart city initiatives.',
    industry: 'Automotive Software',
    location: 'Global',
    founded: '2021',
    employeeSize: '1001+' satisfies EmployeeSize,
    image: '/Woven City.jpg',
  },
  {
    id: 'shippio',
    name: 'Shippio',
    description: 'Japan\'s first digital freight forwarder, building an international logistics platform to drive digital transformation in global trade. Cloud-based cargo tracking, document management, and AI-powered customs clearance.',
    industry: 'International Logistics / Trade DX',
    location: 'Tokyo, Japan',
    founded: '2016',
    employeeSize: '51-200' satisfies EmployeeSize,
    image: '/shippio.jpg',
  },
  {
    id: 'japan-ai',
    name: 'Japan AI',
    description: 'Strategic AI subsidiary of Geniee Inc. (TSE-listed), providing end-to-end enterprise AI transformation through consulting, a proprietary SaaS platform with 82.7% RAG accuracy, and custom AI development for ~200 enterprise clients.',
    industry: 'Enterprise AI / SaaS',
    location: 'Shinjuku, Tokyo',
    founded: '2023',
    employeeSize: '201-500' satisfies EmployeeSize,
    image: '/japanai.jpg',
  },
];

const Companies: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
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
            <Card key={company.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
              <div className="relative">
                <div className="aspect-video overflow-hidden">
                  {company.image ? (
                    <LazyImage
                      src={company.image}
                      alt={`${company.name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-neutral-600" />
                    </div>
                  )}
                </div>
              </div>

              <CardContent className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-neutral-100 group-hover:text-red-600 transition-colors mb-3">
                  {company.name}
                </h3>

                <p className="text-neutral-400 mb-4 line-clamp-3">
                  {company.description}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    <span>{company.industry}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span>{company.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span>{EMPLOYEE_LABELS[company.employeeSize]}</span>
                  </div>
                </div>

                <Button asChild className="w-full mt-auto">
                  <Link to={`/company/${company.id}`}>
                    Learn More
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-border/30 mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Omiyages. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Companies;
