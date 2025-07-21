
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts';
import { Users, TrendingUp, Calendar, Globe, Target, Languages } from 'lucide-react';

export const DataVisualization = () => {
  // Fetch hiring stages
  const { data: stages = [] } = useQuery({
    queryKey: ['hiring-stages'],
    queryFn: async () => {
      console.log('🔍 Fetching hiring stages for visualization...');
      const { data, error } = await supabase
        .from('hiring_stages')
        .select('*')
        .order('stage_order');
      
      if (error) {
        console.error('❌ Error fetching hiring stages:', error);
        throw error;
      }
      
      return data;
    },
  });

  // Fetch pipeline data with candidate info
  const { data: pipelineData = [] } = useQuery({
    queryKey: ['pipeline-visualization-data'],
    queryFn: async () => {
      console.log('🔍 Fetching pipeline data for visualization...');
      
      const { data: applications, error } = await supabase
        .from('candidate_pipeline')
        .select(`
          *,
          profiles!inner(email, full_name, current_company, skillsets)
        `);
      
      if (error) {
        console.error('❌ Error fetching pipeline data:', error);
        throw error;
      }
      
      return applications || [];
    },
  });

  // Process data for visualizations
  const stageDistribution = stages.map(stage => {
    const count = pipelineData.filter(app => app.stage_id === stage.id).length;
    return {
      name: stage.name,
      count,
      color: stage.color,
    };
  });

  const companyDistribution = React.useMemo(() => {
    const companies = pipelineData.reduce((acc, app) => {
      const company = app.applied_company || 'Not specified';
      acc[company] = (acc[company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(companies).map(([company, count]) => ({
      name: company,
      count,
    }));
  }, [pipelineData]);

  // New data processing for additional charts
  const conversionData = React.useMemo(() => {
    if (stages.length === 0) return [];
    
    const stageData = stages.map(stage => {
      const count = pipelineData.filter(app => app.stage_id === stage.id).length;
      return { name: stage.name, value: count, fill: stage.color };
    });
    
    return stageData;
  }, [stages, pipelineData]);

  const skillsData = React.useMemo(() => {
    const skillMap = new Map();
    
    pipelineData.forEach(app => {
      if (app.profiles?.skillsets) {
        app.profiles.skillsets.forEach((skill: string) => {
          skillMap.set(skill, (skillMap.get(skill) || 0) + 1);
        });
      }
    });

    return Array.from(skillMap.entries())
      .map(([skill, count]) => ({ text: skill, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  }, [pipelineData]);

  const japaneseFluentCandidates = React.useMemo(() => {
    const fluent = pipelineData.filter(app => 
      app.profiles?.skillsets?.some((skill: string) => 
        skill.toLowerCase().includes('japanese') || 
        skill.toLowerCase().includes('日本語')
      )
    ).length;
    
    const total = pipelineData.length;
    const percentage = total > 0 ? ((fluent / total) * 100).toFixed(1) : '0';
    
    return { fluent, total, percentage };
  }, [pipelineData]);

  const roleTypeData = React.useMemo(() => {
    const roleMap = new Map();
    
    pipelineData.forEach(app => {
      const role = app.applied_job_title || 'Not specified';
      roleMap.set(role, (roleMap.get(role) || 0) + 1);
    });

    return Array.from(roleMap.entries()).map(([role, count]) => ({
      name: role,
      value: count,
    }));
  }, [pipelineData]);

  // Mock region data (would come from candidate profiles in real implementation)
  const regionData = React.useMemo(() => {
    const regions = ['Tokyo', 'Osaka', 'Nagoya', 'Fukuoka', 'Sapporo', 'Kyoto'];
    return regions.map(region => ({
      name: region,
      value: Math.floor(Math.random() * 50) + 10, // Mock data
    }));
  }, []);

  const totalCandidates = pipelineData.length;
  const uniqueCompanies = new Set(pipelineData.map(app => app.applied_company).filter(Boolean)).size;
  const recentApplications = pipelineData.filter(app => {
    const createdAt = new Date(app.created_at);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return createdAt >= oneWeekAgo;
  }).length;

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Pipeline Analytics</h2>
        <p className="text-muted-foreground">Visualize candidate pipeline data and trends</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidates}</div>
            <p className="text-xs text-muted-foreground">
              Active in pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Unique companies applied to
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentApplications}</div>
            <p className="text-xs text-muted-foreground">
              New applications this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Japanese Fluency</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{japaneseFluentCandidates.percentage}%</div>
            <p className="text-xs text-muted-foreground">
              {japaneseFluentCandidates.fluent} of {japaneseFluentCandidates.total} candidates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stageDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Company Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Applications by Company</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={companyDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {companyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Rate Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip />
                <Funnel
                  dataKey="value"
                  data={conversionData}
                  isAnimationActive
                >
                  <LabelList position="center" fill="#fff" stroke="none" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Role Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Role Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Region Heatmap (simplified as bar chart) */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates by Region</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={60} />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Skills Word Cloud (simplified as bar chart) */}
        <Card>
          <CardHeader>
            <CardTitle>Top Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-300 overflow-y-auto">
              {skillsData.slice(0, 10).map((skill, index) => (
                <div key={skill.text} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="font-medium">{skill.text}</span>
                  <Badge variant="secondary">{skill.value} candidates</Badge>
                </div>
              ))}
              {skillsData.length === 0 && (
                <p className="text-muted-foreground text-center">No skills data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stage Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stages.map(stage => {
              const count = pipelineData.filter(app => app.stage_id === stage.id).length;
              const percentage = totalCandidates > 0 ? (count / totalCandidates * 100).toFixed(1) : '0';
              
              return (
                <div key={stage.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-medium">{stage.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{count} candidates</Badge>
                    <span className="text-sm text-muted-foreground">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
