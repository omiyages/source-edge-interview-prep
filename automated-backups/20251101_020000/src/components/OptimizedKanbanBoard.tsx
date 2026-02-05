import React, { useState, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { User, Clock, X, Eye, Plus, Calendar, EyeOff, Filter, Search, Edit } from 'lucide-react';
import { UserDetailModal } from './UserDetailModal';
import { AddUserToKanbanModal } from './AddUserToKanbanModal';
import { CreateUserModal } from './CreateUserModal';
import { BulkAddUsersModal } from './BulkAddUsersModal';
import { EditUserModal } from './EditUserModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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

// Optimized Kanban User Card Component
const KanbanUserCard = React.memo(({ 
  user, 
  onUserClick, 
  onRejectUser, 
  onEditUser 
}: {
  user: KanbanUser;
  onUserClick: (user: KanbanUser) => void;
  onRejectUser: (userId: string, email: string) => void;
  onEditUser: (user: KanbanUser) => void;
}) => {
  const getCardColor = useCallback(() => {
    if (user.upcoming_interview_name) return 'bg-green-50 border-green-200';
    if (user.incomplete_tasks_count && user.incomplete_tasks_count > 0) return 'bg-red-50 border-red-200';
    return 'bg-white border-gray-200';
  }, [user.upcoming_interview_name, user.incomplete_tasks_count]);

  return (
    <div
      className={`kanban-user-card p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${getCardColor()}`}
      onClick={() => onUserClick(user)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-gray-900 truncate">
            {user.full_name}
          </h4>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              onEditUser(user);
            }}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRejectUser(user.user_id, user.email);
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {user.position && (
        <div className="text-xs text-gray-500 mb-2">
          {user.position}
        </div>
      )}

      <div className="flex flex-wrap gap-1 mb-2">
        {user.incomplete_tasks_count && user.incomplete_tasks_count > 0 && (
          <Badge variant="destructive" className="text-xs">
            {user.incomplete_tasks_count}
          </Badge>
        )}
        {user.upcoming_interview_name && (
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
            {user.upcoming_interview_name}
          </Badge>
        )}
      </div>

      <div className="text-xs text-gray-400">
        Updated {new Date(user.last_updated_at).toLocaleDateString()}
      </div>
    </div>
  );
});

KanbanUserCard.displayName = 'KanbanUserCard';

export const OptimizedKanbanBoard: React.FC = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [selectedUser, setSelectedUser] = useState<KanbanUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<KanbanUser | null>(null);
  const [showRejected, setShowRejected] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    role: 'all',
    createdDateRange: 'all',
    lastUpdatedRange: 'all',
    hasToDo: null,
    hasInterview: null,
    searchTerm: ''
  });

  // Optimized data fetching with React Query
  const { data: kanbanData, isLoading, error } = useQuery({
    queryKey: ['kanban-data', showRejected],
    queryFn: async () => {
      console.log('🔄 Loading optimized kanban data...');
      
      const { data, error } = await supabase.rpc('get_users_by_stage_with_rejected', {
        p_show_rejected: showRejected
      });

      if (error) {
        console.error('❌ Error loading kanban data:', error);
        throw error;
      }

      console.log('✅ Loaded kanban data:', data?.length || 0, 'users');
      return data || [];
    },
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Optimized columns creation with memoization
  const columns = useMemo(() => {
    if (!kanbanData) return [];

    const newColumns: KanbanColumn[] = KANBAN_STAGES.map(stage => ({
      id: stage.id,
      title: stage.title,
      users: kanbanData
        .filter(user => user.stage_name === stage.id)
        .map(user => ({
          ...user,
          user_id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          position: user.position,
          company: user.company,
          last_activity_at: user.last_activity_at,
          total_session_time_minutes: user.total_session_time_minutes,
          stage_updated_at: user.stage_updated_at,
          last_updated_at: user.last_updated_at,
          upcoming_interview_name: user.upcoming_interview_name,
          upcoming_interview_date: user.upcoming_interview_date,
          is_rejected: user.is_rejected,
          incomplete_tasks_count: user.incomplete_tasks_count
        }))
    }));

    return newColumns;
  }, [kanbanData]);

  // Optimized filtering with memoization
  const filteredColumns = useMemo(() => {
    if (!columns.length) return [];

    return columns.map(column => ({
      ...column,
      users: column.users.filter(user => {
        const matchesSearch = !filters.searchTerm || 
          user.full_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(filters.searchTerm.toLowerCase());
        
        const matchesRole = filters.role === 'all' || user.position === filters.role;
        
        const matchesToDo = filters.hasToDo === null || 
          (filters.hasToDo ? (user.incomplete_tasks_count && user.incomplete_tasks_count > 0) : 
           (!user.incomplete_tasks_count || user.incomplete_tasks_count === 0));
        
        const matchesInterview = filters.hasInterview === null || 
          (filters.hasInterview ? !!user.upcoming_interview_name : !user.upcoming_interview_name);

        return matchesSearch && matchesRole && matchesToDo && matchesInterview;
      })
    }));
  }, [columns, filters]);

  // Optimized move user mutation with optimistic updates
  const moveUserMutation = useMutation({
    mutationFn: async ({ userId, newStage }: { userId: string; newStage: string }) => {
      const { error } = await supabase.rpc('move_user_to_stage', {
        p_user_id: userId,
        p_new_stage_name: newStage
      });
      
      if (error) throw error;
    },
    onMutate: async ({ userId, newStage }) {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['kanban-data'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['kanban-data', showRejected]);

      // Optimistically update the cache
      queryClient.setQueryData(['kanban-data', showRejected], (old: any) => {
        if (!old) return old;
        return old.map((user: any) => 
          user.user_id === userId 
            ? { ...user, stage_name: newStage, last_updated_at: new Date().toISOString() }
            : user
        );
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['kanban-data', showRejected], context.previousData);
      }
      toast({
        title: "Error",
        description: "Failed to move user. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User moved successfully.",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
    },
  });

  // Optimized reject user mutation
  const rejectUserMutation = useMutation({
    mutationFn: async ({ userId, email }: { userId: string; email: string }) => {
      const { error } = await supabase.rpc('reject_user', {
        p_user_id: userId,
        p_email: email
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
      toast({
        title: "User Rejected",
        description: "User has been moved to rejected status.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Optimized drag and drop handler
  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const userId = draggableId;
    const newStage = destination.droppableId;

    moveUserMutation.mutate({ userId, newStage });
  }, [moveUserMutation]);

  // Optimized user click handler
  const handleUserClick = useCallback((user: KanbanUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  }, []);

  // Optimized reject user handler
  const handleRejectUser = useCallback((userId: string, email: string) => {
    if (confirm('Are you sure you want to reject this user?')) {
      rejectUserMutation.mutate({ userId, email });
    }
  }, [rejectUserMutation]);

  // Optimized edit user handler
  const handleEditUser = useCallback((user: KanbanUser) => {
    setEditingUser(user);
    setIsEditUserModalOpen(true);
  }, []);

  // Optimized filter handlers
  const handleFilterChange = useCallback((key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      role: 'all',
      createdDateRange: 'all',
      lastUpdatedRange: 'all',
      hasToDo: null,
      hasInterview: null,
      searchTerm: ''
    });
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading Kanban board...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load Kanban board. Please try again.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['kanban-data'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Kanban Board</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRejected(!showRejected)}
          >
            {showRejected ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showRejected ? 'Hide Rejected' : 'Show Rejected'}
          </Button>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={() => setIsAddUserModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
            <Button variant="outline" onClick={() => setIsCreateUserModalOpen(true)}>
              <User className="w-4 h-4 mr-2" />
              Create User
            </Button>
            <Button variant="outline" onClick={() => setIsBulkAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Bulk Add
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowFilters(false)}>
                  Hide Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search users..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="role">Position</Label>
                <Select value={filters.role} onValueChange={(value) => handleFilterChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All positions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {/* Add position options here */}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="hasToDo">Has Tasks</Label>
                <Select value={filters.hasToDo?.toString() || 'all'} onValueChange={(value) => handleFilterChange('hasToDo', value === 'all' ? null : value === 'true')}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Has Tasks</SelectItem>
                    <SelectItem value="false">No Tasks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="hasInterview">Has Interview</Label>
                <Select value={filters.hasInterview?.toString() || 'all'} onValueChange={(value) => handleFilterChange('hasInterview', value === 'all' ? null : value === 'true')}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Has Interview</SelectItem>
                    <SelectItem value="false">No Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredColumns.map((column) => (
            <Card key={column.id} className="min-h-[400px]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-sm font-medium">{column.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {column.users.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[300px] space-y-2 p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      {column.users.map((user, index) => (
                        <Draggable key={user.user_id} draggableId={user.user_id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-transform ${
                                snapshot.isDragging ? 'rotate-2 scale-105' : ''
                              }`}
                            >
                              <KanbanUserCard
                                user={user}
                                onUserClick={handleUserClick}
                                onRejectUser={handleRejectUser}
                                onEditUser={handleEditUser}
                              />
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
          ))}
        </div>
      </DragDropContext>

      {/* Modals */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
          }}
        />
      )}

      {isAddUserModalOpen && (
        <AddUserToKanbanModal
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          onUserAdded={() => {
            queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
          }}
        />
      )}

      {isCreateUserModalOpen && (
        <CreateUserModal
          isOpen={isCreateUserModalOpen}
          onClose={() => setIsCreateUserModalOpen(false)}
        />
      )}

      {isBulkAddModalOpen && (
        <BulkAddUsersModal
          isOpen={isBulkAddModalOpen}
          onClose={() => setIsBulkAddModalOpen(false)}
          onUsersAdded={() => {
            queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
          }}
        />
      )}

      {editingUser && (
        <EditUserModal
          isOpen={isEditUserModalOpen}
          onClose={() => {
            setIsEditUserModalOpen(false);
            setEditingUser(null);
          }}
          onUserUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
          }}
          user={editingUser}
        />
      )}
    </div>
  );
};
