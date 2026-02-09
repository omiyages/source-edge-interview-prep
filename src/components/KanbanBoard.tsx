import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { User, Clock, X, Eye, Plus, Calendar, EyeOff, Filter, Search, Edit, RotateCcw } from 'lucide-react';
import { JSTDateTime } from './JSTDateTime';
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

// Extracted constant style to prevent re-creation on each render
const DROPPABLE_STYLE = { 
  maxHeight: 'calc(100vh - 300px)',
  minHeight: '200px'
};

export const KanbanBoard: React.FC = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
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
    searchTerm: ''
  });
  const [showFilters, setShowFilters] = useState(true);
  const [availablePositions, setAvailablePositions] = useState<string[]>([]);
  const [assignedPositions, setAssignedPositions] = useState<string[]>([]);
  const { user: currentUser, profile } = useAuth();
  const { toast } = useToast();

  // Load available positions from dropdown_options
  const loadAvailablePositions = async () => {
    try {
      // Use the correct column name: field_name = 'role' for job positions
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('value')
        .eq('field_name', 'role')
        .order('value');

      if (error) {
        // Silently handle
        return;
      }

      const positions = data?.map(item => item.value) || [];
      setAvailablePositions(positions);
    } catch (error) {
      // Silently handle
    }
  };

  // Extract assigned positions from current users
  const updateAssignedPositions = () => {
    const positions = new Set<string>();
    
    columns.forEach((column, columnIndex) => {
      column.users.forEach((user, userIndex) => {
        const userPosition = (user.position || user.role || '').trim(); // Use position or fallback to role, normalize
        if (userPosition) {
          positions.add(userPosition);
        } else {
        }
      });
    });
    
    const positionArray = Array.from(positions).sort();
    setAssignedPositions(positionArray);
  };

  // Load users for all stages
  const loadKanbanData = async () => {
    try {
      setLoading(true);
      
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .limit(5);
      
      if (testError) {
        toast({
          title: "Database Error",
          description: `Cannot connect to database: ${testError.message}`,
          variant: "destructive",
        });
        return;
      }

      const newColumns: KanbanColumn[] = [];

      for (const stage of KANBAN_STAGES) {
        // Use the RPC function (keep it simple)
        const { data, error } = await supabase.rpc('get_users_by_stage_with_rejected' as any, {
          p_stage_name: stage.id,
          p_show_rejected: showRejected
        });

        if (error) {
          newColumns.push({
            id: stage.id,
            title: stage.title,
            users: []
          });
        } else {
        if (data && data.length > 0) {
          // Check if any users have position data
          const usersWithPositions = data.filter(user => user.position && user.position.trim());
        }
        // Aggressive deduplication to remove ghost duplicates
        const finalUsers = data ? data.reduce((acc: KanbanUser[], user: KanbanUser) => {
          // Check for duplicates by user_id
          const existingById = acc.find(u => u.user_id === user.user_id);
          if (existingById) {
            return acc;
          }
          
          // Check for duplicates by email
          const existingByEmail = acc.find(u => u.email === user.email);
          if (existingByEmail) {
            return acc;
          }
          
          // Check for invalid/ghost users (missing essential data)
          if (!user.user_id || !user.email || !user.full_name) {
            return acc;
          }
          
          // User is valid and unique, add to accumulator
          acc.push(user);
          return acc;
        }, []) : [];
        
        newColumns.push({
          id: stage.id,
          title: stage.title,
          users: finalUsers
        });
        }
      }

      setColumns(newColumns);
      
      // Update assigned positions immediately after setting columns
      // Extract positions from the new columns data
      const positions = new Set<string>();
      newColumns.forEach(column => {
        column.users.forEach(user => {
          const userPosition = (user.position || user.role || '').trim();
          if (userPosition) {
            positions.add(userPosition);
          }
        });
      });
      const positionArray = Array.from(positions).sort();
      setAssignedPositions(positionArray);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load kanban data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKanbanData();
    loadAvailablePositions();
  }, [showRejected]);

  // Hide standalone "0" text in user cards
  useEffect(() => {
    const hideZeroText = () => {
      const userCards = document.querySelectorAll('.kanban-user-card');
      userCards.forEach(card => {
        const walker = document.createTreeWalker(
          card,
          NodeFilter.SHOW_TEXT
        );
        
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent?.trim() === '0') {
            node.textContent = '';
          }
        }
      });
    };

    // Run after a short delay to ensure DOM is updated
    const timeoutId = setTimeout(hideZeroText, 100);
    
    return () => clearTimeout(timeoutId);
  }, [columns]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);
    const user = sourceColumn?.users.find(u => u.user_id === draggableId);

    if (!user || !destColumn) return;

    try {
      // Update database
      const { error } = await supabase.rpc('move_user_to_stage' as any, {
        p_user_id: user.user_id,
        p_new_stage_name: destColumn.id,  // destColumn.id is the stage name
        p_transitioned_by: currentUser?.id,
        p_notes: `Moved from ${sourceColumn.title} to ${destColumn.title}`
      });

      if (error) {
        toast({
          title: "Error",
          description: `Failed to move user: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Update local state
      const newColumns = columns.map(col => {
        if (col.id === source.droppableId) {
          return {
            ...col,
            users: col.users.filter(u => u.user_id !== draggableId)
          };
        }
        if (col.id === destination.droppableId) {
          return {
            ...col,
            users: [...col.users, user]
          };
        }
        return col;
      });

      setColumns(newColumns);

      toast({
        title: "Success",
        description: `User moved to ${destColumn.title}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move user. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to determine card color based on user status
  const getCardColor = (user: KanbanUser) => {
    // Check for incomplete tasks first (red takes priority)
    if (user.incomplete_tasks_count && user.incomplete_tasks_count > 0) {
      return 'bg-red-50 border-2 border-red-200 shadow-sm';
    }
    
    // Check for upcoming interviews (green)
    if (user.upcoming_interview_name && user.upcoming_interview_date) {
      return 'bg-green-50 border-2 border-green-200 shadow-sm';
    }
    
    // Default card color with better visibility
    return 'bg-white border-2 border-gray-200 shadow-sm';
  };

  const handleRejectUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to reject ${userEmail}? This will hide them from the board.`)) {
      return;
    }

    try {
      const { error } = await supabase.rpc('reject_user' as any, {
        p_user_id: userId,
        p_rejected_by: currentUser?.id,
        p_reason: 'Rejected by admin'
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to reject user. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Remove from local state
      const newColumns = columns.map(col => ({
        ...col,
        users: col.users.filter(u => u.user_id !== userId)
      }));
      setColumns(newColumns);

      toast({
        title: "Success",
        description: "User has been rejected and hidden from the board.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnrejectUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to unreject ${userEmail}? They will be restored to the board.`)) {
      return;
    }

    try {
      const { error } = await supabase.rpc('unreject_user' as any, {
        p_user_id: userId
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to unreject user. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Refetch data to update the board
      await loadKanbanData();

      toast({
        title: "Success",
        description: "User has been unrejected and restored to the board.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unreject user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUserClick = (user: KanbanUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const formatTimeSpent = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Helper function to filter out "0" values
  const filterZeroValues = (value: any) => {
    if (value === 0 || value === '0' || value === null || value === undefined) {
      return null;
    }
    return value;
  };

  // Filter users based on current filter settings - memoized with useCallback
  const filterUsers = useCallback((users: KanbanUser[]) => {
    return users.filter(user => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const nameMatch = user.full_name?.toLowerCase().includes(searchLower);
        const emailMatch = user.email.toLowerCase().includes(searchLower);
        if (!nameMatch && !emailMatch) return false;
      }

    // Position filter (assigned position when added to Kanban)
    if (filters.role !== 'all') {
      const userPosition = (user.position || user.role || '').trim(); // Fallback to role if no position, normalize
      const filterPosition = filters.role.trim();
      if (!userPosition || userPosition !== filterPosition) {
        return false;
      }
    }

      // Created date filter
      if (filters.createdDateRange !== 'all') {
        const createdDate = new Date(user.stage_updated_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.createdDateRange) {
          case 'today':
            if (daysDiff > 0) return false;
            break;
          case 'week':
            if (daysDiff > 7) return false;
            break;
          case 'month':
            if (daysDiff > 30) return false;
            break;
          case 'quarter':
            if (daysDiff > 90) return false;
            break;
        }
      }

      // Last updated filter
      if (filters.lastUpdatedRange !== 'all') {
        const updatedDate = new Date(user.last_updated_at || user.stage_updated_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.lastUpdatedRange) {
          case 'today':
            if (daysDiff > 0) return false;
            break;
          case 'week':
            if (daysDiff > 7) return false;
            break;
          case 'month':
            if (daysDiff > 30) return false;
            break;
          case 'quarter':
            if (daysDiff > 90) return false;
            break;
        }
      }

      // Has to-do filter
      if (filters.hasToDo !== null) {
        const hasTasks = !!(user.incomplete_tasks_count && user.incomplete_tasks_count > 0);
        if (filters.hasToDo !== hasTasks) return false;
      }

      // Has interview filter
      if (filters.hasInterview !== null) {
        const hasInterview = !!(user.upcoming_interview_name && user.upcoming_interview_date);
        if (filters.hasInterview !== hasInterview) return false;
      }

      return true;
    });
  }, [filters]);

  // Apply filters to columns - memoized to prevent recalculation on every render
  const filteredColumns = useMemo(() => {
    return columns.map(column => ({
      ...column,
      users: filterUsers(column.users)
    }));
  }, [columns, filterUsers]);

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
              variant={showRejected ? "default" : "outline"}
              onClick={() => setShowRejected(!showRejected)}
              className="flex items-center gap-2"
            >
              {showRejected ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {showRejected ? "Hide Rejected" : "Show Rejected"}
            </Button>
            <Button 
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add User
            </Button>
            <Button 
              onClick={() => setIsCreateUserModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Create User
            </Button>
            <Button 
              onClick={() => setIsBulkAddModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Bulk Add
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({
                  role: 'all',
                  createdDateRange: 'all',
                  lastUpdatedRange: 'all',
                  hasToDo: null,
                  hasInterview: null,
                  searchTerm: ''
                })}
              >
                Clear All
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Search Term */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Name or email..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Position Filter */}
              <div className="space-y-2">
                <Label htmlFor="role">Position</Label>
                <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All positions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {/* Combine available positions from dropdown_options with assigned positions from users */}
                    {Array.from(new Set([
                      ...availablePositions.map(p => p?.trim()).filter(Boolean),
                      ...assignedPositions.map(p => p?.trim()).filter(Boolean)
                    ]))
                      .filter(pos => pos && pos.length > 0)
                      .sort()
                      .map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Created Date Filter */}
              <div className="space-y-2">
                <Label htmlFor="createdDate">Created</Label>
                <Select value={filters.createdDateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, createdDateRange: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Last Updated Filter */}
              <div className="space-y-2">
                <Label htmlFor="lastUpdated">Last Updated</Label>
                <Select value={filters.lastUpdatedRange} onValueChange={(value) => setFilters(prev => ({ ...prev, lastUpdatedRange: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Has To-Do Filter */}
              <div className="space-y-2">
                <Label htmlFor="hasToDo">Has To-Do</Label>
                <Select 
                  value={filters.hasToDo === null ? 'all' : filters.hasToDo ? 'yes' : 'no'} 
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    hasToDo: value === 'all' ? null : value === 'yes' 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Has Tasks</SelectItem>
                    <SelectItem value="no">No Tasks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Has Interview Filter */}
              <div className="space-y-2">
                <Label htmlFor="hasInterview">Has Interview</Label>
                <Select 
                  value={filters.hasInterview === null ? 'all' : filters.hasInterview ? 'yes' : 'no'} 
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    hasInterview: value === 'all' ? null : value === 'yes' 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
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
              <span>
                Showing {filteredColumns.reduce((total, col) => total + col.users.length, 0)} users
              </span>
              <span>
                Total: {columns.reduce((total, col) => total + col.users.length, 0)} users
              </span>
            </div>
            <div className="flex items-center gap-2">
              {filters.searchTerm && (
                <Badge variant="secondary">Search: {filters.searchTerm}</Badge>
              )}
              {filters.role !== 'all' && (
                <Badge variant="secondary">Position: {filters.role}</Badge>
              )}
              {filters.createdDateRange !== 'all' && (
                <Badge variant="secondary">Created: {filters.createdDateRange}</Badge>
              )}
              {filters.lastUpdatedRange !== 'all' && (
                <Badge variant="secondary">Updated: {filters.lastUpdatedRange}</Badge>
              )}
              {filters.hasToDo !== null && (
                <Badge variant="secondary">To-Do: {filters.hasToDo ? 'Yes' : 'No'}</Badge>
              )}
              {filters.hasInterview !== null && (
                <Badge variant="secondary">Interview: {filters.hasInterview ? 'Yes' : 'No'}</Badge>
              )}
            </div>
          </div>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {filteredColumns.map((column) => {
            const stageConfig = KANBAN_STAGES.find(s => s.id === column.id);
            return (
              <div key={column.id} className="flex-shrink-0 w-80">
                <Card className="h-full flex flex-col max-h-[calc(100vh-200px)] border-2 border-gray-100">
                  <CardHeader className="pb-3 flex-shrink-0">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-sm font-medium">{column.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {column.users.length}
                      </Badge>
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
                            <Draggable
                              key={user.user_id}
                              draggableId={user.user_id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`kanban-user-card p-3 ${getCardColor(user)} rounded-lg cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all duration-200 ${
                                    snapshot.isDragging ? 'shadow-xl scale-105' : ''
                                  }`}
                                  onClick={() => handleUserClick(user)}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium text-sm">
                                        {user.full_name || user.email}
                                      </span>
                                      {user.is_rejected && (
                                        <Badge variant="destructive" className="text-xs">
                                          Rejected
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingUser(user);
                                          setIsEditUserModalOpen(true);
                                        }}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      {user.is_rejected ? (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-muted-foreground hover:text-green-600"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleUnrejectUser(user.user_id, user.email);
                                          }}
                                          title="Unreject user"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                        </Button>
                                      ) : (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRejectUser(user.user_id, user.email);
                                        }}
                                          title="Reject user"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Assigned role below the name */}
                                  {user.position && (
                                    <div className="text-xs text-gray-500 mb-1">
                                      {user.position}
                                    </div>
                                  )}
                                  
                                  {/* Task and Interview indicators below the role */}
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {/* Tasks counter - show in red if there are incomplete tasks */}
                                    {user.incomplete_tasks_count && 
                                     Number(user.incomplete_tasks_count) > 0 && (
                                      <Badge variant="destructive" className="text-xs bg-red-100 text-red-800 border-red-200">
                                        {user.incomplete_tasks_count} Task{Number(user.incomplete_tasks_count) !== 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                    {/* Interview counter - show in red if there are upcoming interviews */}
                                    {user.upcoming_interview_name && user.upcoming_interview_date && (
                                      <Badge variant="destructive" className="text-xs bg-red-100 text-red-800 border-red-200">
                                        Interview
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-1 text-xs text-muted-foreground">
                                    <div>
                                      Last activity: {formatLastActivity(user.last_activity_at || user.stage_updated_at)}
                                    </div>
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
            );
          })}
        </div>
      </DragDropContext>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onUpdate={loadKanbanData}
        />
      )}

      <AddUserToKanbanModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserAdded={loadKanbanData}
      />

      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
      />

      <BulkAddUsersModal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        onUpdate={loadKanbanData}
      />

      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => {
          setIsEditUserModalOpen(false);
          setEditingUser(null);
        }}
        onUserUpdated={loadKanbanData}
        user={editingUser}
      />
    </div>
  );
};

