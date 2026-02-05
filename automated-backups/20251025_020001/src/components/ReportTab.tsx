import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { Calendar, Users, Clock, Phone, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { JSTDateTime } from './JSTDateTime';

interface ReportFilters {
  company: string;
  position: string; // Changed from role to position (job position, not system role)
  dateFrom: string;
  dateTo: string;
  hasUpcomingInterview: boolean | null;
  isActive: boolean | null;
}

interface KanbanUserData {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  position?: string;
  company?: string;
  stage: string;
  created_at: string;
  is_active: boolean;
  upcoming_interview_name?: string;
  upcoming_interview_date?: string;
}

interface Interview {
  id: string;
  user_id: string;
  interview_name: string;
  scheduled_date: string;
  status: string;
  notes?: string;
  user_name?: string;
  user_company?: string;
  user_role?: string;
  stage?: string;
}

const KANBAN_STAGES = [
  'Interested',
  'Scheduled',
  'CV Sent',
  '1st Interview',
  '2nd Interview',
  '3rd Interview+',
  'Debrief',
  'Offer',
  'Offer Accepted'
];

const CHART_COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16'
];

export const ReportTab: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<KanbanUserData[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]); // Changed from roles to positions

  const [filters, setFilters] = useState<ReportFilters>({
    company: 'all',
    position: 'all', // Changed from role to position
    dateFrom: '',
    dateTo: '',
    hasUpcomingInterview: null,
    isActive: null,
  });

  // Fetch all data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch rejected users first
      const { data: rejectedData, error: rejectedError } = await supabase
        .from('user_rejections')
        .select('user_id');

      if (rejectedError) {
        console.error('Error fetching rejections:', rejectedError);
      }

      const rejectedUserIds = new Set((rejectedData || []).map((r: any) => r.user_id));
      console.log('Rejected user IDs:', Array.from(rejectedUserIds));

      // Fetch users with stages
      const { data: usersData, error: usersError } = await supabase
        .from('user_stages')
        .select(`
          user_id,
          stage,
          created_at,
          profiles:user_id(
            id,
            email,
            full_name,
            role,
            position,
            company
          )
        `)
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching user stages:', usersError);
        throw usersError;
      }

      console.log('User stages data:', usersData);

      // Transform the data
      const transformedUsers: KanbanUserData[] = (usersData || []).map((item: any) => {
        // User is active if they are NOT in the rejections table
        const isActive = !rejectedUserIds.has(item.user_id);
        
        return {
          user_id: item.user_id,
          email: item.profiles.email,
          full_name: item.profiles.full_name,
          role: item.profiles.role,
          position: item.profiles.position,
          company: item.profiles.company,
          stage: item.stage,
          created_at: item.created_at,
          is_active: isActive,
        };
      });

      // Fetch interviews
      const { data: interviewsData, error: interviewsError } = await supabase
        .from('interviews')
        .select(`
          *,
          profiles:user_id(
            full_name,
            company,
            role
          )
        `)
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true });

      if (interviewsError) {
        console.error('Error fetching interviews:', interviewsError);
        throw interviewsError;
      }

      console.log('Interviews data:', interviewsData);

      const transformedInterviews: Interview[] = (interviewsData || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        interview_name: item.interview_name,
        scheduled_date: item.scheduled_date,
        status: item.status,
        notes: item.notes,
        user_name: item.profiles.full_name,
        user_company: item.profiles.company,
        user_role: item.profiles.role,
      }));

      // Get unique companies and positions (job roles)
      const uniqueCompanies = [...new Set(transformedUsers.map(u => u.company).filter(Boolean))] as string[];
      const uniquePositions = [...new Set(transformedUsers.map(u => u.position).filter(Boolean))] as string[];

      console.log('Transformed users:', transformedUsers);
      console.log('Active users:', transformedUsers.filter(u => u.is_active).length);
      console.log('Rejected users:', transformedUsers.filter(u => !u.is_active).length);
      console.log('Companies:', uniqueCompanies);
      console.log('Positions (job roles):', uniquePositions);

      setUsers(transformedUsers);
      setInterviews(transformedInterviews);
      setCompanies(uniqueCompanies.sort());
      setPositions(uniquePositions.sort()); // Changed from setRoles to setPositions
    } catch (error: any) {
      console.error('Error in fetchData:', error);
      toast({
        title: 'Error loading report data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on selected filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Company filter
      if (filters.company !== 'all' && user.company !== filters.company) {
        return false;
      }

      // Position filter (job role, not system role)
      if (filters.position !== 'all' && user.position !== filters.position) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom && new Date(user.created_at) < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && new Date(user.created_at) > new Date(filters.dateTo)) {
        return false;
      }

      // Has upcoming interview filter
      if (filters.hasUpcomingInterview !== null) {
        const hasInterview = interviews.some(i => i.user_id === user.user_id);
        if (filters.hasUpcomingInterview && !hasInterview) return false;
        if (!filters.hasUpcomingInterview && hasInterview) return false;
      }

      // Is active filter
      if (filters.isActive !== null && user.is_active !== filters.isActive) {
        return false;
      }

      return true;
    });
  }, [users, filters, interviews]);

  // Calculate summary counters
  const summaryData = useMemo(() => {
    const total = filteredUsers.length;
    const stageCounts: Record<string, number> = {};
    
    KANBAN_STAGES.forEach(stage => {
      stageCounts[stage] = filteredUsers.filter(u => u.stage === stage).length;
    });

    return { total, stageCounts };
  }, [filteredUsers]);

  // Prepare chart data
  const stageByCompanyData = useMemo(() => {
    const data: any[] = [];
    
    KANBAN_STAGES.forEach(stage => {
      const stageUsers = filteredUsers.filter(u => u.stage === stage);
      const dataPoint: any = { stage };
      
      companies.forEach(company => {
        dataPoint[company] = stageUsers.filter(u => u.company === company).length;
      });
      
      data.push(dataPoint);
    });

    return data;
  }, [filteredUsers, companies]);

  const stageByPositionData = useMemo(() => {
    const data: any[] = [];
    
    KANBAN_STAGES.forEach(stage => {
      const stageUsers = filteredUsers.filter(u => u.stage === stage);
      const dataPoint: any = { stage };
      
      positions.forEach(position => {
        dataPoint[position] = stageUsers.filter(u => u.position === position).length;
      });
      
      data.push(dataPoint);
    });

    return data;
  }, [filteredUsers, positions]);

  const positionDistributionData = useMemo(() => {
    return positions.map(position => ({
      name: position,
      value: filteredUsers.filter(u => u.position === position).length,
    }));
  }, [filteredUsers, positions]);

  // Calculate conversion rates through stages
  const conversionRateData = useMemo(() => {
    const totalUsers = filteredUsers.length;
    if (totalUsers === 0) return [];

    const data: any[] = [];
    
    KANBAN_STAGES.forEach((stage, index) => {
      // Count users who reached this stage or beyond
      const usersAtOrBeyondStage = filteredUsers.filter(user => {
        const userStageIndex = KANBAN_STAGES.indexOf(user.stage);
        return userStageIndex >= index;
      }).length;

      const conversionRate = (usersAtOrBeyondStage / totalUsers) * 100;
      const usersAtStage = filteredUsers.filter(u => u.stage === stage).length;
      
      data.push({
        stage,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        count: usersAtOrBeyondStage,
        atStage: usersAtStage,
        dropOffRate: index === 0 ? 0 : parseFloat((100 - conversionRate).toFixed(1)),
      });
    });

    return data;
  }, [filteredUsers]);

  // Filter interviews
  const upcomingInterviews = useMemo(() => {
    return interviews.filter(i => {
      if (i.interview_name === 'Candidate Call') return false;
      
      const userInFiltered = filteredUsers.some(u => u.user_id === i.user_id);
      return userInFiltered;
    });
  }, [interviews, filteredUsers]);

  const candidateCalls = useMemo(() => {
    return interviews.filter(i => {
      if (i.interview_name !== 'Candidate Call') return false;
      
      const userInFiltered = filteredUsers.some(u => u.user_id === i.user_id);
      return userInFiltered;
    });
  }, [interviews, filteredUsers]);

  const resetFilters = () => {
    setFilters({
      company: 'all',
      position: 'all', // Changed from role to position
      dateFrom: '',
      dateTo: '',
      hasUpcomingInterview: null,
      isActive: null,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <CardTitle>Filters</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Reset
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Company Filter */}
            <div className="space-y-2">
              <Label>Assigned Company</Label>
              <Select
                value={filters.company}
                onValueChange={(value) => setFilters({ ...filters, company: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Position Filter (Job Role) */}
            <div className="space-y-2">
              <Label>Assigned Role/Position</Label>
              <Select
                value={filters.position}
                onValueChange={(value) => setFilters({ ...filters, position: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {positions.map(position => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label>Created From</Label>
              <input
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>Created To</Label>
              <input
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>

            {/* Has Upcoming Interview */}
            <div className="space-y-2">
              <Label>Has Upcoming Interview</Label>
              <div className="flex items-center space-x-4 h-10">
                <button
                  onClick={() => setFilters({
                    ...filters,
                    hasUpcomingInterview: filters.hasUpcomingInterview === true ? null : true
                  })}
                  className={`px-3 py-1 rounded text-sm ${
                    filters.hasUpcomingInterview === true
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setFilters({
                    ...filters,
                    hasUpcomingInterview: filters.hasUpcomingInterview === false ? null : false
                  })}
                  className={`px-3 py-1 rounded text-sm ${
                    filters.hasUpcomingInterview === false
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Is Active */}
            <div className="space-y-2">
              <Label>Is Active</Label>
              <div className="flex items-center space-x-4 h-10">
                <button
                  onClick={() => setFilters({
                    ...filters,
                    isActive: filters.isActive === true ? null : true
                  })}
                  className={`px-3 py-1 rounded text-sm ${
                    filters.isActive === true
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setFilters({
                    ...filters,
                    isActive: filters.isActive === false ? null : false
                  })}
                  className={`px-3 py-1 rounded text-sm ${
                    filters.isActive === false
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Counters + Position Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary Counters (50% width) - 3 Rows */}
        <div className="space-y-4">
          {/* First Row - Total Users + 3 Stages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <p className="text-2xl font-bold">{summaryData.total}</p>
                </div>
              </CardContent>
            </Card>

            {KANBAN_STAGES.slice(0, 3).map((stage) => (
              <Card key={stage}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground truncate" title={stage}>
                    {stage}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{summaryData.stageCounts[stage] || 0}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Second Row - 3 Stages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {KANBAN_STAGES.slice(3, 6).map((stage) => (
              <Card key={stage}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground truncate" title={stage}>
                    {stage}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{summaryData.stageCounts[stage] || 0}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Third Row - 3 Stages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {KANBAN_STAGES.slice(6, 9).map((stage) => (
              <Card key={stage}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground truncate" title={stage}>
                    {stage}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{summaryData.stageCounts[stage] || 0}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Position Distribution Chart (50% width) */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle>By Position</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={positionDistributionData.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={100}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {positionDistributionData.filter(item => item.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any) => [
                    `${value} users (${((value / positionDistributionData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)`,
                    name
                  ]}
                />
                <Legend 
                  layout="horizontal" 
                  align="center" 
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                  payload={positionDistributionData.filter(item => item.value > 0).map((item, index) => ({
                    value: item.name,
                    type: 'rect',
                    color: CHART_COLORS[index % CHART_COLORS.length]
                  }))}
                  formatter={(value, entry) => {
                    const item = positionDistributionData.find(d => d.name === value);
                    if (!item || item.value === 0) return null;
                    const total = positionDistributionData.reduce((sum, i) => sum + i.value, 0);
                    const percentage = ((item.value / total) * 100).toFixed(1);
                    return `${value}: ${item.value} (${percentage}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stacked Bar Chart - Users by Stage & Company */}
        <Card>
          <CardHeader>
            <CardTitle>Users by Stage & Company</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stageByCompanyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: any) => [
                    `${value} users`,
                    name
                  ]}
                  labelFormatter={(label) => `Stage: ${label}`}
                />
                <Legend />
                {companies.map((company, index) => {
                  // Check if this company has any users in the current filtered data
                  const hasUsers = stageByCompanyData.some(stage => stage[company] > 0);
                  
                  return (
                    <Bar
                      key={company}
                      dataKey={company}
                      stackId="a"
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      label={{ 
                        position: 'center', 
                        fill: 'white', 
                        fontSize: 11, 
                        fontWeight: 'bold',
                        formatter: (value: any) => value > 0 ? value : ''
                      }}
                      hide={!hasUsers}
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Grouped Bar Chart - Users by Stage & Position */}
        <Card>
          <CardHeader>
            <CardTitle>Users by Stage & Position</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stageByPositionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                {positions.map((position, index) => {
                  // Check if this position has any users in the current filtered data
                  const hasUsers = stageByPositionData.some(stage => stage[position] > 0);
                  
                  return (
                    <Bar
                      key={position}
                      dataKey={position}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      hide={!hasUsers}
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rate Funnel Chart - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>Stage Conversion Funnel</CardTitle>
          <p className="text-sm text-muted-foreground">
            Percentage of candidates reaching each stage (100% = all candidates)
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={conversionRateData}>
              <defs>
                <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="stage" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft' }}
                domain={[0, 100]}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                        <p className="font-semibold">{data.stage}</p>
                        <p className="text-sm text-primary">
                          Conversion: {data.conversionRate}%
                        </p>
                        <p className="text-sm text-gray-600">
                          Users at/beyond: {data.count}
                        </p>
                        <p className="text-sm text-gray-600">
                          At this stage: {data.atStage}
                        </p>
                        {data.dropOffRate > 0 && (
                          <p className="text-sm text-red-600">
                            Drop-off: {data.dropOffRate}%
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="conversionRate" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorConversion)" 
              />
              <Line 
                type="monotone" 
                dataKey="conversionRate" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ r: 6, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-center">
            {conversionRateData.map((stage, index) => (
              <div key={stage.stage} className="p-2 bg-secondary rounded">
                <div className="font-semibold truncate" title={stage.stage}>
                  {stage.stage}
                </div>
                <div className="text-primary font-bold">{stage.conversionRate}%</div>
                <div className="text-muted-foreground">{stage.count} users</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Interviews Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <CardTitle>Upcoming Interviews ({upcomingInterviews.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Candidate</th>
                    <th className="text-left p-2">Company</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Interview</th>
                    <th className="text-left p-2">Date/Time</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingInterviews.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-4 text-muted-foreground">
                        No upcoming interviews
                      </td>
                    </tr>
                  ) : (
                    upcomingInterviews.map(interview => (
                      <tr key={interview.id} className="border-b">
                        <td className="p-2">{interview.user_name}</td>
                        <td className="p-2">{interview.user_company}</td>
                        <td className="p-2">{interview.user_role}</td>
                        <td className="p-2">{interview.interview_name}</td>
                        <td className="p-2">
                          <JSTDateTime dateTime={interview.scheduled_date} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Candidate Calls Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              <CardTitle>Candidate Calls ({candidateCalls.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Candidate</th>
                    <th className="text-left p-2">Company</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Date/Time</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {candidateCalls.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-4 text-muted-foreground">
                        No candidate calls scheduled
                      </td>
                    </tr>
                  ) : (
                    candidateCalls.map(call => (
                      <tr key={call.id} className="border-b">
                        <td className="p-2">{call.user_name}</td>
                        <td className="p-2">{call.user_company}</td>
                        <td className="p-2">{call.user_role}</td>
                        <td className="p-2">
                          <JSTDateTime dateTime={call.scheduled_date} />
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            call.status === 'completed' ? 'bg-green-100 text-green-800' :
                            call.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {call.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

