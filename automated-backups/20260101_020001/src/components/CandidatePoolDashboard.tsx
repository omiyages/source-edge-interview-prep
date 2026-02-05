import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { candidatePoolService } from '../services/candidatePoolService';
import type { CandidateData } from '../services/candidatePoolService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function CandidatePoolDashboard() {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Initialize Google Auth with proper credentials
        const data = await candidatePoolService.fetchCandidatesFromSheet();
        setCandidates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch candidate data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusDistribution = () => {
    const distribution = candidates.reduce((acc, candidate) => {
      acc[candidate.status] = (acc[candidate.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const getSkillsDistribution = () => {
    const skillsCount = candidates.reduce((acc, candidate) => {
      candidate.skills.forEach(skill => {
        acc[skill] = (acc[skill] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(skillsCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 skills
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-4">
      {/* Candidate Status Distribution */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Candidate Status Distribution</CardTitle>
          <CardDescription>Current status of all candidates</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={getStatusDistribution()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getStatusDistribution().map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Skills Distribution */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Top Skills Distribution</CardTitle>
          <CardDescription>Most common skills among candidates</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getSkillsDistribution()} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
          <CardDescription>Key metrics about the candidate pool</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">Total Candidates</h4>
              <p className="text-2xl font-bold">{candidates.length}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Average Experience</h4>
              <p className="text-2xl font-bold">
                {(candidates.reduce((sum, c) => sum + c.experience, 0) / candidates.length || 0).toFixed(1)} years
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Active Candidates</h4>
              <p className="text-2xl font-bold">
                {candidates.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 