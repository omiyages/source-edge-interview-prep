import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Calendar, Users, Clock, Phone, Filter, X, TrendingUp, Printer, FileDown, Settings } from 'lucide-react';
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
  '#6366f1', '#22d3ee', '#22c55e', '#f59e0b', '#ef4444',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#84cc16'
];

// Colors matching the mockup
const DONUT_COLORS = ['#6366f1', '#22d3ee', '#22c55e', '#f59e0b'];
const LINE_COLOR = '#6366f1';

// Company-specific colors for bar charts
const COMPANY_COLORS: Record<string, string> = {
  'Woven': '#78350f', // Dark brown for Woven
  'LexxPluss': '#6366f1', // Indigo for LexxPluss
  'Lexxpluss': '#6366f1', // Handle case variation
  'default_primary': '#6366f1',
  'default_secondary': '#a5b4fc',
};

// Helper to get company color
const getCompanyColor = (company: string, index: number): string => {
  if (COMPANY_COLORS[company]) {
    return COMPANY_COLORS[company];
  }
  // Fallback colors for other companies
  const fallbackColors = ['#6366f1', '#a5b4fc', '#22c55e', '#f59e0b', '#ef4444'];
  return fallbackColors[index % fallbackColors.length];
};

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

  // Print/PDF functionality
  const handlePrint = () => {
    window.print();
  };

  // Calculate percentage change (mock data for now - can be enhanced with historical data)
  const getPercentageChange = (stage: string) => {
    const count = summaryData.stageCounts[stage] || 0;
    const total = summaryData.total;
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
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
    <div className="space-y-6 print:space-y-1" id="report-content">
      {/* Print Styles - Optimized for single page */}
      <style>{`
        @media print {
          @page { 
            size: A4 landscape; 
            margin: 8mm;
          }
          body * { visibility: hidden; }
          body { font-size: 9px !important; }
          #report-content, #report-content * { visibility: visible; }
          #report-content { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 0 !important;
          }
          .no-print { display: none !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
          
          /* Reduce all spacing */
          #report-content > div { margin-bottom: 4px !important; gap: 4px !important; }
          #report-content .space-y-6 { gap: 4px !important; }
          
          /* Compact cards */
          #report-content [class*="CardContent"] { padding: 6px !important; }
          #report-content [class*="CardHeader"] { padding: 6px !important; padding-bottom: 2px !important; }
          
          /* Reduce chart heights */
          #report-content .recharts-wrapper { max-height: 120px !important; }
          #report-content .recharts-responsive-container { height: 120px !important; max-height: 120px !important; }
          
          /* Smaller text for print */
          #report-content h2 { font-size: 14px !important; margin-bottom: 4px !important; }
          #report-content [class*="CardTitle"] { font-size: 10px !important; }
          #report-content p, #report-content span, #report-content td, #report-content th { font-size: 8px !important; }
          #report-content .text-3xl { font-size: 16px !important; }
          #report-content .text-2xl { font-size: 14px !important; }
          
          /* Tables - more compact */
          #report-content table { font-size: 7px !important; }
          #report-content th, #report-content td { padding: 2px 4px !important; }
          #report-content .max-h-\\[250px\\] { max-height: 80px !important; overflow: hidden !important; }
          
          /* Grid gaps */
          #report-content .grid { gap: 6px !important; }
          #report-content .gap-6 { gap: 6px !important; }
          #report-content .gap-4 { gap: 4px !important; }
          
          /* Hide stage counts section to save space */
          #report-content .mt-4.flex.justify-between { display: none !important; }
        }
      `}</style>

      {/* Header with Print Button */}
      <div className="flex items-center justify-between no-print">
        <h2 className="text-2xl font-bold">Reports Dashboard</h2>
        <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Print / Save PDF
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="no-print">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <CardTitle className="text-base">Filters</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm"
          >
            <X className="w-3 h-3" />
            Reset
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Select
              value={filters.company}
              onValueChange={(value) => setFilters({ ...filters, company: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.position}
              onValueChange={(value) => setFilters({ ...filters, position: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {positions.map(position => (
                  <SelectItem key={position} value={position}>{position}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input
              type="date"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              placeholder="From"
            />

            <input
              type="date"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              placeholder="To"
            />

            <Select
              value={filters.hasUpcomingInterview === null ? 'all' : filters.hasUpcomingInterview ? 'yes' : 'no'}
              onValueChange={(value) => setFilters({ 
                ...filters, 
                hasUpcomingInterview: value === 'all' ? null : value === 'yes' 
              })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Interview" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Interview</SelectItem>
                <SelectItem value="yes">Has Interview</SelectItem>
                <SelectItem value="no">No Interview</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.isActive === null ? 'all' : filters.isActive ? 'yes' : 'no'}
              onValueChange={(value) => setFilters({ 
                ...filters, 
                isActive: value === 'all' ? null : value === 'yes' 
              })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="yes">Active</SelectItem>
                <SelectItem value="no">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Top Stats Row - Matching Mockup Design */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:break-inside-avoid">
        {/* Total Users */}
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Users</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{summaryData.total}</p>
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                12%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Interested */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Interested</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{summaryData.stageCounts['Interested'] || 0}</p>
              <Badge variant="outline" className="text-xs">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Scheduled</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{summaryData.stageCounts['Scheduled'] || 0}</p>
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                {upcomingInterviews.length} Pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* CV Sent */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">CV Sent</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{summaryData.stageCounts['CV Sent'] || 0}</p>
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                {getPercentageChange('CV Sent')}% conv
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Offer Accepted */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Offer Accepted</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{summaryData.stageCounts['Offer Accepted'] || 0}</p>
              <Button size="icon" variant="ghost" className="h-8 w-8 bg-indigo-100 hover:bg-indigo-200">
                <Settings className="w-4 h-4 text-indigo-600" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - By Position + Users by Stage & Company */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:break-inside-avoid">
        {/* By Position - Donut Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">By Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={positionDistributionData.filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {positionDistributionData.filter(item => item.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                      <tspan x="50%" dy="-0.3em" className="text-2xl font-bold fill-current">{summaryData.total}</tspan>
                      <tspan x="50%" dy="1.4em" className="text-xs fill-muted-foreground">Total Candidates</tspan>
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {positionDistributionData.filter(item => item.value > 0).slice(0, 4).map((item, index) => {
                  const total = positionDistributionData.reduce((sum, i) => sum + i.value, 0);
                  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                  return (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                      />
                      <span className="flex-1 truncate">{item.name}</span>
                      <span className="font-semibold">{item.value} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users by Stage & Company - Bar Chart */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Users by Stage & Company</CardTitle>
            <div className="flex items-center gap-4 text-xs">
              {companies.slice(0, 3).map((company, index) => (
                <div key={company} className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: getCompanyColor(company, index) }}
                  />
                  <span>{company}</span>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stageByCompanyData} barCategoryGap="20%">
                <XAxis 
                  dataKey="stage" 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip />
                {companies.slice(0, 3).map((company, index) => (
                  <Bar
                    key={company}
                    dataKey={company}
                    fill={getCompanyColor(company, index)}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stage Conversion Funnel - Full Width */}
      <Card className="print:break-inside-avoid">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Stage Conversion Funnel</CardTitle>
          <p className="text-xs text-muted-foreground">
            Percentage of candidates reaching each stage relative to initial interest (100%)
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={conversionRateData}>
              <defs>
                <linearGradient id="colorConversionNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={LINE_COLOR} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={LINE_COLOR} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="stage" 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-semibold text-sm">{data.stage}</p>
                        <p className="text-sm text-indigo-600 font-bold">{data.conversionRate}%</p>
                        <p className="text-xs text-gray-500">{data.count} candidates</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="conversionRate" 
                stroke={LINE_COLOR}
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorConversionNew)" 
              />
              <Line 
                type="monotone" 
                dataKey="conversionRate" 
                stroke={LINE_COLOR}
                strokeWidth={2}
                dot={{ r: 4, fill: LINE_COLOR, strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          {/* Stage counts at bottom */}
          <div className="mt-4 flex justify-between text-center border-t pt-4">
            {conversionRateData.map((stage) => (
              <div key={stage.stage} className="flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide truncate px-1">{stage.stage}</p>
                <p className="text-sm font-semibold">{stage.count} <span className="text-muted-foreground font-normal">pts</span></p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:break-inside-avoid">
        {/* Upcoming Interviews */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-base font-semibold">Upcoming Interviews ({upcomingInterviews.length})</CardTitle>
            </div>
            <Button variant="link" size="sm" className="text-indigo-600 text-xs p-0 h-auto">View all</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[250px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="text-xs text-muted-foreground uppercase">
                    <th className="text-left p-2 font-medium">Candidate</th>
                    <th className="text-left p-2 font-medium">Company</th>
                    <th className="text-left p-2 font-medium">Stage</th>
                    <th className="text-left p-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingInterviews.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-4 text-muted-foreground text-sm">
                        No upcoming interviews
                      </td>
                    </tr>
                  ) : (
                    upcomingInterviews.slice(0, 5).map(interview => (
                      <tr key={interview.id} className="border-b hover:bg-slate-50">
                        <td className="p-2 font-medium">{interview.user_name}</td>
                        <td className="p-2 text-muted-foreground">{interview.user_company}</td>
                        <td className="p-2">
                          <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700">
                            {interview.interview_name}
                          </Badge>
                        </td>
                        <td className="p-2 text-muted-foreground">
                          {format(new Date(interview.scheduled_date), 'MMM dd, HH:mm')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Candidate Calls */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-base font-semibold">Candidate Calls ({candidateCalls.length})</CardTitle>
            </div>
            <Button variant="link" size="sm" className="text-indigo-600 text-xs p-0 h-auto">Full list</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[250px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="text-xs text-muted-foreground uppercase">
                    <th className="text-left p-2 font-medium">Candidate</th>
                    <th className="text-left p-2 font-medium">Company</th>
                    <th className="text-left p-2 font-medium">Scheduled For</th>
                    <th className="text-left p-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {candidateCalls.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-4 text-muted-foreground text-sm">
                        No candidate calls scheduled
                      </td>
                    </tr>
                  ) : (
                    candidateCalls.slice(0, 5).map(call => (
                      <tr key={call.id} className="border-b hover:bg-slate-50">
                        <td className="p-2 font-medium">{call.user_name}</td>
                        <td className="p-2 text-muted-foreground">{call.user_company}</td>
                        <td className="p-2 text-muted-foreground">
                          {format(new Date(call.scheduled_date), 'MMM dd, HH:mm')}
                        </td>
                        <td className="p-2">
                          <Badge 
                            className={`text-xs ${
                              call.status === 'completed' ? 'bg-green-100 text-green-700' :
                              call.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {call.status}
                          </Badge>
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

