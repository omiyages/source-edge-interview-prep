
// ABOUTME: Admin analytics dashboard — user growth, question stats, course assignments
// ABOUTME: Uses existing Supabase data via clerkSupabaseClient (no new tables needed)

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { Users, MessageSquare, BookOpen, TrendingUp, Clock, CheckCircle, XCircle, Activity } from 'lucide-react';

const usersChartConfig: ChartConfig = {
  users: { label: 'New Users', color: '#a855f7' },
};

const questionsChartConfig: ChartConfig = {
  questions: { label: 'Questions Submitted', color: '#06b6d4' },
};

interface StatCardProps {
  title: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
}

const StatCard = ({ title, value, sub, icon, accent = 'text-purple-400' }: StatCardProps) => (
  <Card className="bg-neutral-900 border-neutral-800">
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className={`text-3xl font-black ${accent}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </div>
    </CardContent>
  </Card>
);

export const AdminAnalytics = () => {
  const { stats, recentlyActive, monthlyRegistrations, monthlyQuestions, isLoading, error } =
    useAdminAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Failed to load analytics. Make sure your Clerk JWT template is configured.
      </div>
    );
  }

  const approvalRate =
    stats.questions.total > 0
      ? Math.round((stats.questions.approved / stats.questions.total) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats.users.total}
            sub={`+${stats.users.newThisMonth} this month`}
            icon={<Users className="w-5 h-5" />}
            accent="text-purple-400"
          />
          <StatCard
            title="Active Users"
            value={stats.users.active}
            sub={`${recentlyActive} logged in last 30d`}
            icon={<Activity className="w-5 h-5" />}
            accent="text-green-400"
          />
          <StatCard
            title="Questions"
            value={stats.questions.total}
            sub={`${stats.questions.pending} pending review`}
            icon={<MessageSquare className="w-5 h-5" />}
            accent="text-cyan-400"
          />
          <StatCard
            title="Course Assignments"
            value={stats.courses.totalAssignments}
            sub={`+${stats.courses.newThisMonth} this month`}
            icon={<BookOpen className="w-5 h-5" />}
            accent="text-amber-400"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              User Registrations
            </CardTitle>
            <CardDescription>New signups per month (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={usersChartConfig} className="h-48">
              <AreaChart data={monthlyRegistrations} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#userGradient)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Question Submissions
            </CardTitle>
            <CardDescription>Questions submitted per month (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={questionsChartConfig} className="h-48">
              <BarChart data={monthlyQuestions} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="questions" fill="#06b6d4" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User breakdown */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              User Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Active users', value: stats.users.active, total: stats.users.total, color: 'bg-green-500' },
              { label: 'Pending approval', value: stats.users.pending, total: stats.users.total, color: 'bg-amber-500' },
              { label: 'Admins', value: stats.users.admins, total: stats.users.total, color: 'bg-purple-500' },
            ].map(({ label, value, total, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value} <span className="text-muted-foreground">/ {total}</span></span>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Question breakdown */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Question Status
            </CardTitle>
            <CardDescription>Approval rate: {approvalRate}%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Approved', value: stats.questions.approved, total: stats.questions.total, color: 'bg-green-500', icon: <CheckCircle className="w-3.5 h-3.5 text-green-400" /> },
              { label: 'Pending', value: stats.questions.pending, total: stats.questions.total, color: 'bg-amber-500', icon: <Clock className="w-3.5 h-3.5 text-amber-400" /> },
              { label: 'Rejected', value: stats.questions.rejected, total: stats.questions.total, color: 'bg-red-500', icon: <XCircle className="w-3.5 h-3.5 text-red-400" /> },
            ].map(({ label, value, total, color, icon }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1.5 text-muted-foreground">{icon}{label}</span>
                  <span className="font-medium">{value} <span className="text-muted-foreground">/ {total}</span></span>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
