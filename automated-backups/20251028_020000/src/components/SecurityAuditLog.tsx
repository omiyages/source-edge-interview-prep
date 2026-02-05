
// ABOUTME: Security audit log viewer for admins to monitor system security events
// ABOUTME: Displays comprehensive audit trail with filtering and search capabilities

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Search, Filter, AlertTriangle, User, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export const SecurityAuditLog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('24h');
  const { isAdmin } = useAuth();

  const { data: auditLogs, isLoading, error } = useQuery({
    queryKey: ['security-audit-log', searchTerm, actionFilter, timeFilter],
    queryFn: async () => {
      if (!isAdmin) {
        throw new Error('Admin access required');
      }

      let query = supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply time filter
      if (timeFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (timeFilter) {
          case '1h':
            startDate = new Date(now.getTime() - 60 * 60 * 1000);
            break;
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      // Apply action filter
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`action.ilike.%${searchTerm}%,details->>'target_user_id'.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: isAdmin,
    staleTime: 30000,
    gcTime: 300000,
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">Admin privileges required to view audit logs.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'role_change':
        return 'destructive';
      case 'login_attempt':
        return 'default';
      case 'failed_login':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDetails = (details: any) => {
    if (!details) return 'No details';
    
    if (typeof details === 'object') {
      return Object.entries(details)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }
    
    return String(details);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Audit Log
        </CardTitle>
        <CardDescription>
          Monitor security events and administrative actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by action or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="role_change">Role Changes</SelectItem>
                <SelectItem value="login_attempt">Login Attempts</SelectItem>
                <SelectItem value="failed_login">Failed Logins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <Clock className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading audit logs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Logs</h3>
            <p className="text-muted-foreground">Failed to load security audit logs.</p>
          </div>
        ) : auditLogs && auditLogs.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {formatDetails(log.details)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ip_address || 'Unknown'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Audit Logs</h3>
            <p className="text-muted-foreground">No security events found for the selected filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
