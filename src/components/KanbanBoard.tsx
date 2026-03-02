import React, { useState, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Clock, X, Eye, Plus, Calendar, EyeOff, Filter, Search, Edit, RotateCcw, Download } from 'lucide-react';
import { JSTDateTime } from './JSTDateTime';
import { UserDetailModal } from './UserDetailModal';
import { AddUserToKanbanModal } from './AddUserToKanbanModal';
import { CreateUserModal } from './CreateUserModal';
import { BulkAddUsersModal } from './BulkAddUsersModal';
import { EditUserModal } from './EditUserModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KanbanUser, KanbanColumn } from '@/types/kanban';

interface FilterOptions {
  role: string;
  createdDateRange: string;
  lastUpdatedRange: string;
  hasToDo: boolean | null;
  hasInterview: boolean | null;
  searchTerm: string;
}

const KANBAN_STAGES = [
  { id: 'Interested', title: 'Interested', color: 'bg-blue-100 text-blue-800' },
  { id: 'Scheduled', title: 'Scheduled', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'CV Sent', title: 'CV Sent', color: 'bg-orange-100 text-orange-800' },
  { id: '1st Interview', title: '1st Interview', color: 'bg-purple-100 text-purple-800' },
  { id: '2nd Interview', title: '2nd Interview', color: 'bg-indigo-100 text-indigo-800' },
  { id: '3rd Interview+', title: '3rd Interview+', color: 'bg-pink-100 text-pink-800' },
  { id: 'Debrief', title: 'Debrief', color: 'bg-cyan-100 text-cyan-800' },
  { id: 'Offer', title: 'Offer', color: 'bg-green-100 text-green-800' },
  { id: 'Offer Accepted', title: 'Offer Accepted', color: 'bg-emerald-100 text-emerald-800' },
];

const STAGE_IDS = KANBAN_STAGES.map(s => s.id);

const DROPPABLE_STYLE = {
  maxHeight: 'calc(100vh - 300px)',
  minHeight: '200px',
};

// Deduplicate and validate users
function deduplicateUsers(users: KanbanUser[]): KanbanUser[] {
  const seenIds = new Set<string>();
  const seenEmails = new Set<string>();
  const result: KanbanUser[] = [];

  for (const user of users) {
    if (!user.user_id || !user.email || !user.full_name) continue;
    if (seenIds.has(user.user_id) || seenEmails.has(user.email)) continue;
    seenIds.add(user.user_id);
    seenEmails.add(user.email);
    result.push(user);
  }
  return result;
}

// Fetch all kanban users in a single batch (one RPC call per stage in parallel)
async function fetchAllKanbanUsers(showRejected: boolean): Promise<KanbanColumn[]> {
  // Fire all 9 stage queries in PARALLEL instead of sequentially
  const results = await Promise.all(
    KANBAN_STAGES.map(async (stage) => {
      const { data, error } = await supabase.rpc('get_users_by_stage_with_rejected' as any, {
        p_stage_name: stage.id,
        p_show_rejected: showRejected,
      });

      if (error) {
        console.error(`Error loading stage ${stage.id}:`, error.message);
        return { id: stage.id, title: stage.title, users: [] as KanbanUser[] };
      }

      return {
        id: stage.id,
        title: stage.title,
        users: deduplicateUsers(data || []),
      };
    })
  );

  return results;
}

// Fetch available positions
async function fetchPositions(): Promise<string[]> {
  const { data, error } = await supabase
    .from('dropdown_options')
    .select('value')
    .eq('field_name', 'role')
    .order('value');

  if (error) return [];
  return data?.map((item) => item.value) || [];
}

export const KanbanBoard: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<KanbanUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<KanbanUser | null>(null);
  const [showRejected, setShowRejected] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    role: 'all',
    createdDateRange: 'all',
    lastUpdatedRange: 'all',
    hasToDo: null,
    hasInterview: null,
    searchTerm: '',
  });
  const [showFilters, setShowFilters] = useState(true);
  const { user: currentUser, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ---- Data fetching via React Query ----

  // Live (non-rejected) users — always fetched
  const { data: liveColumns = [], isLoading: liveLoading } = useQuery({
    queryKey: ['kanban-users', false],
    queryFn: () => fetchAllKanbanUsers(false),
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  // Rejected users — only fetched when admin toggles "Show Rejected"
  const { data: rejectedColumns = [], isLoading: rejectedLoading } = useQuery({
    queryKey: ['kanban-users', true],
    queryFn: () => fetchAllKanbanUsers(true),
    enabled: showRejected, // lazy: don't fetch until toggled
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  // Positions for filter dropdown
  const { data: availablePositions = [] } = useQuery({
    queryKey: ['kanban-positions'],
    queryFn: fetchPositions,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  // Choose the active dataset based on toggle
  const columns = showRejected ? rejectedColumns : liveColumns;
  const loading = showRejected ? rejectedLoading : liveLoading;

  // Refetch helper used by modals after mutations
  const refetchKanban = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['kanban-users'] });
  }, [queryClient]);

  // Extract assigned positions from current users
  const assignedPositions = useMemo(() => {
    const positions = new Set<string>();
    columns.forEach((col) =>
      col.users.forEach((u) => {
        const pos = (u.position || u.role || '').trim();
        if (pos) positions.add(pos);
      })
    );
    return Array.from(positions).sort();
  }, [columns]);

  // ---- Filtering ----

  const filterUsers = useCallback(
    (users: KanbanUser[]) => {
      return users.filter((user) => {
        if (filters.searchTerm) {
          const s = filters.searchTerm.toLowerCase();
          if (
            !(user.full_name || '').toLowerCase().includes(s) &&
            !user.email.toLowerCase().includes(s)
          )
            return false;
        }

        if (filters.role !== 'all') {
          const userPos = (user.position || user.role || '').trim();
          if (userPos !== filters.role.trim()) return false;
        }

        if (filters.createdDateRange !== 'all') {
          const days = Math.floor(
            (Date.now() - new Date(user.stage_updated_at).getTime()) / 86_400_000
          );
          const max =
            filters.createdDateRange === 'today'
              ? 0
              : filters.createdDateRange === 'week'
              ? 7
              : filters.createdDateRange === 'month'
              ? 30
              : 90;
          if (days > max) return false;
        }

        if (filters.lastUpdatedRange !== 'all') {
          const days = Math.floor(
            (Date.now() -
              new Date(user.last_updated_at || user.stage_updated_at).getTime()) /
              86_400_000
          );
          const max =
            filters.lastUpdatedRange === 'today'
              ? 0
              : filters.lastUpdatedRange === 'week'
              ? 7
              : filters.lastUpdatedRange === 'month'
              ? 30
              : 90;
          if (days > max) return false;
        }

        if (filters.hasToDo !== null) {
          const has = !!(user.incomplete_tasks_count && user.incomplete_tasks_count > 0);
          if (filters.hasToDo !== has) return false;
        }

        if (filters.hasInterview !== null) {
          const has = !!(user.upcoming_interview_name && user.upcoming_interview_date);
          if (filters.hasInterview !== has) return false;
        }

        return true;
      });
    },
    [filters]
  );

  const filteredColumns = useMemo(
    () => columns.map((col) => ({ ...col, users: filterUsers(col.users) })),
    [columns, filterUsers]
  );

  // ---- Drag & Drop ----

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find((col) => col.id === destination.droppableId);
    const user = sourceColumn?.users.find((u) => u.user_id === draggableId);
    if (!user || !destColumn) return;

    // Optimistic update
    queryClient.setQueryData<KanbanColumn[]>(['kanban-users', showRejected], (old) => {
      if (!old) return old;
      return old.map((col) => {
        if (col.id === source.droppableId) {
          return { ...col, users: col.users.filter((u) => u.user_id !== draggableId) };
        }
        if (col.id === destination.droppableId) {
          return { ...col, users: [...col.users, user] };
        }
        return col;
      });
    });

    try {
      const { error } = await supabase.rpc('move_user_to_stage' as any, {
        p_user_id: user.user_id,
        p_new_stage_name: destColumn.id,
        p_transitioned_by: currentUser?.id,
        p_notes: `Moved from ${sourceColumn!.title} to ${destColumn.title}`,
      });

      if (error) {
        toast({ title: 'Error', description: `Failed to move user: ${error.message}`, variant: 'destructive' });
        refetchKanban(); // revert optimistic update
        return;
      }

      toast({ title: 'Success', description: `User moved to ${destColumn.title}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to move user. Please try again.', variant: 'destructive' });
      refetchKanban();
    }
  };

  // ---- Actions ----

  const handleRejectUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to reject ${userEmail}? This will hide them from the board.`)) return;

    try {
      const { error } = await supabase.rpc('reject_user' as any, {
        p_user_id: userId,
        p_rejected_by: currentUser?.id,
        p_reason: 'Rejected by admin',
      });

      if (error) {
        toast({ title: 'Error', description: 'Failed to reject user.', variant: 'destructive' });
        return;
      }

      // Optimistic: remove from live columns
      queryClient.setQueryData<KanbanColumn[]>(['kanban-users', false], (old) =>
        old?.map((col) => ({ ...col, users: col.users.filter((u) => u.user_id !== userId) }))
      );

      toast({ title: 'Success', description: 'User has been rejected and hidden from the board.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to reject user.', variant: 'destructive' });
    }
  };

  const handleUnrejectUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to unreject ${userEmail}? They will be restored to the board.`)) return;

    try {
      const { error } = await supabase.rpc('unreject_user' as any, { p_user_id: userId });

      if (error) {
        toast({ title: 'Error', description: 'Failed to unreject user.', variant: 'destructive' });
        return;
      }

      refetchKanban();
      toast({ title: 'Success', description: 'User has been unrejected and restored to the board.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to unreject user.', variant: 'destructive' });
    }
  };

  // ---- Helpers ----

  const getCardColor = (user: KanbanUser) => {
    if (user.incomplete_tasks_count && user.incomplete_tasks_count > 0)
      return 'bg-red-50 border-2 border-red-200 shadow-sm';
    if (user.upcoming_interview_name && user.upcoming_interview_date)
      return 'bg-green-50 border-2 border-green-200 shadow-sm';
    return 'bg-white border-2 border-gray-200 shadow-sm';
  };

  const exportToCSV = async () => {
    try {
      const allData: any[] = [];
      const results = await Promise.all(
        KANBAN_STAGES.map(stage =>
          supabase.rpc('get_users_by_stage_with_rejected' as any, {
            p_stage_name: stage.id,
            p_show_rejected: true,
          })
        )
      );

      for (const { data, error } of results) {
        if (error) throw error;
        if (data) allData.push(...data);
      }

      if (allData.length === 0) {
        toast({ title: "No data", description: "No candidates to export." });
        return;
      }

      const headers = [
        'Full Name', 'Email', 'Role', 'Position', 'Company', 'Stage',
        'Last Activity', 'Session Time (min)', 'Stage Updated',
        'Last Updated', 'Upcoming Interview', 'Interview Date',
        'Rejected', 'Incomplete Tasks'
      ];

      const escapeCSV = (val: any) => {
        if (val == null) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      };

      const rows = allData.map((u: any) => [
        escapeCSV(u.full_name), escapeCSV(u.email), escapeCSV(u.role),
        escapeCSV(u.position), escapeCSV(u.company), escapeCSV(u.stage_name),
        escapeCSV(u.last_activity_at), escapeCSV(u.total_session_time_minutes),
        escapeCSV(u.stage_updated_at), escapeCSV(u.last_updated_at),
        escapeCSV(u.upcoming_interview_name), escapeCSV(u.upcoming_interview_date),
        escapeCSV(u.is_rejected ? 'Yes' : 'No'), escapeCSV(u.incomplete_tasks_count),
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `candidates_export_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: "Exported", description: `${allData.length} candidates exported to CSV.` });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    }
  };

  const formatLastActivity = (dateString: string) => {
    const diffH = Math.floor((Date.now() - new Date(dateString).getTime()) / 3_600_000);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
  };

  // ---- Render ----

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading kanban board...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">User Pipeline</h2>
            <p className="text-muted-foreground">Drag and drop users between stages to track their progress.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={showRejected ? 'default' : 'outline'}
              onClick={() => setShowRejected(!showRejected)}
              className="flex items-center gap-2"
            >
              {showRejected ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {showRejected ? 'Hide Rejected' : 'Show Rejected'}
            </Button>
            <Button onClick={() => setIsAddUserModalOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add User
            </Button>
            <Button onClick={() => setIsCreateUserModalOpen(true)} variant="outline" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Create User
            </Button>
            <Button onClick={() => setIsBulkAddModalOpen(true)} variant="outline" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Bulk Add
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filters</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({
                    role: 'all',
                    createdDateRange: 'all',
                    lastUpdatedRange: 'all',
                    hasToDo: null,
                    hasInterview: null,
                    searchTerm: '',
                  })
                }
              >
                Clear All
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Name or email..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Position</Label>
                <Select value={filters.role} onValueChange={(value) => setFilters((prev) => ({ ...prev, role: value }))}>
                  <SelectTrigger><SelectValue placeholder="All positions" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {Array.from(
                      new Set([
                        ...availablePositions.map((p) => p?.trim()).filter(Boolean),
                        ...assignedPositions.map((p) => p?.trim()).filter(Boolean),
                      ])
                    )
                      .filter((p) => p && p.length > 0)
                      .sort()
                      .map((position) => (
                        <SelectItem key={position} value={position}>{position}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Created</Label>
                <Select value={filters.createdDateRange} onValueChange={(v) => setFilters((p) => ({ ...p, createdDateRange: v }))}>
                  <SelectTrigger><SelectValue placeholder="All time" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Last Updated</Label>
                <Select value={filters.lastUpdatedRange} onValueChange={(v) => setFilters((p) => ({ ...p, lastUpdatedRange: v }))}>
                  <SelectTrigger><SelectValue placeholder="All time" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Has To-Do</Label>
                <Select
                  value={filters.hasToDo === null ? 'all' : filters.hasToDo ? 'yes' : 'no'}
                  onValueChange={(v) => setFilters((p) => ({ ...p, hasToDo: v === 'all' ? null : v === 'yes' }))}
                >
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Has Tasks</SelectItem>
                    <SelectItem value="no">No Tasks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Has Interview</Label>
                <Select
                  value={filters.hasInterview === null ? 'all' : filters.hasInterview ? 'yes' : 'no'}
                  onValueChange={(v) => setFilters((p) => ({ ...p, hasInterview: v === 'all' ? null : v === 'yes' }))}
                >
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Has Interview</SelectItem>
                    <SelectItem value="no">No Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Filter Summary */}
        {showFilters && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>Showing {filteredColumns.reduce((t, c) => t + c.users.length, 0)} users</span>
              <span>Total: {columns.reduce((t, c) => t + c.users.length, 0)} users</span>
            </div>
            <div className="flex items-center gap-2">
              {filters.searchTerm && <Badge variant="secondary">Search: {filters.searchTerm}</Badge>}
              {filters.role !== 'all' && <Badge variant="secondary">Position: {filters.role}</Badge>}
              {filters.createdDateRange !== 'all' && <Badge variant="secondary">Created: {filters.createdDateRange}</Badge>}
              {filters.lastUpdatedRange !== 'all' && <Badge variant="secondary">Updated: {filters.lastUpdatedRange}</Badge>}
              {filters.hasToDo !== null && <Badge variant="secondary">To-Do: {filters.hasToDo ? 'Yes' : 'No'}</Badge>}
              {filters.hasInterview !== null && <Badge variant="secondary">Interview: {filters.hasInterview ? 'Yes' : 'No'}</Badge>}
            </div>
          </div>
        )}
      </div>

      {/* Kanban Columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {filteredColumns.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80">
              <Card className="h-full flex flex-col max-h-[calc(100vh-200px)] border-2 border-gray-100">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-sm font-medium">{column.title}</span>
                    <Badge variant="secondary" className="text-xs">{column.users.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex-1 overflow-hidden">
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`h-full overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 ${
                          snapshot.isDraggingOver ? 'bg-muted/50 rounded-md' : ''
                        }`}
                        style={DROPPABLE_STYLE}
                      >
                        {column.users.map((user, index) => (
                          <Draggable key={user.user_id} draggableId={user.user_id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`kanban-user-card p-3 ${getCardColor(user)} rounded-lg cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all duration-200 ${
                                  snapshot.isDragging ? 'shadow-xl scale-105' : ''
                                }`}
                                onClick={() => { setSelectedUser(user); setIsModalOpen(true); }}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium text-sm">{user.full_name || user.email}</span>
                                    {user.is_rejected && <Badge variant="destructive" className="text-xs">Rejected</Badge>}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm" variant="ghost"
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600"
                                      onClick={(e) => { e.stopPropagation(); setEditingUser(user); setIsEditUserModalOpen(true); }}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    {user.is_rejected ? (
                                      <Button
                                        size="sm" variant="ghost"
                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-green-600"
                                        onClick={(e) => { e.stopPropagation(); handleUnrejectUser(user.user_id, user.email); }}
                                        title="Unreject user"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm" variant="ghost"
                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => { e.stopPropagation(); handleRejectUser(user.user_id, user.email); }}
                                        title="Reject user"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {user.position && <div className="text-xs text-gray-500 mb-1">{user.position}</div>}

                                <div className="flex flex-wrap gap-1 mb-2">
                                  {user.incomplete_tasks_count && Number(user.incomplete_tasks_count) > 0 && (
                                    <Badge variant="destructive" className="text-xs bg-red-100 text-red-800 border-red-200">
                                      {user.incomplete_tasks_count} Task{Number(user.incomplete_tasks_count) !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                  {user.upcoming_interview_name && user.upcoming_interview_date && (
                                    <Badge variant="destructive" className="text-xs bg-red-100 text-red-800 border-red-200">
                                      Interview
                                    </Badge>
                                  )}
                                </div>

                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <div>Last activity: {formatLastActivity(user.last_activity_at || user.stage_updated_at)}</div>
                                  {user.last_updated_at && (
                                    <div className="text-xs text-blue-600 font-medium">
                                      Updated: {formatLastActivity(user.last_updated_at)}
                                    </div>
                                  )}
                                  {user.upcoming_interview_name && user.upcoming_interview_date && (
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <Calendar className="w-3 h-3" />
                                      <span>{user.upcoming_interview_name}</span>
                                      <span className="text-xs">
                                        <JSTDateTime date={user.upcoming_interview_date} format="dateTime" />
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    <span>Click to view details</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Modals */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedUser(null); }}
          onUpdate={refetchKanban}
        />
      )}

      <AddUserToKanbanModal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} onUserAdded={refetchKanban} />
      <CreateUserModal isOpen={isCreateUserModalOpen} onClose={() => setIsCreateUserModalOpen(false)} />
      <BulkAddUsersModal isOpen={isBulkAddModalOpen} onClose={() => setIsBulkAddModalOpen(false)} onUpdate={refetchKanban} />
      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => { setIsEditUserModalOpen(false); setEditingUser(null); }}
        onUserUpdated={refetchKanban}
        user={editingUser}
      />
    </div>
  );
};
