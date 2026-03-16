import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  Trash2, 
  Search, 
  Filter, 
  User, 
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingTask {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  note_content: string;
  note_type: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  due_date?: string;
  priority?: string;
}

interface FilterOptions {
  searchTerm: string;
  taskType: string;
  priority: string;
  showCompleted: boolean;
}

export const PendingTasks: React.FC = () => {
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    taskType: 'all',
    priority: 'all',
    showCompleted: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPendingTasks();
  }, []);

  const loadPendingTasks = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading all pending tasks with simple approach...');

      // Use a simple query without any joins
      const { data: tasksData, error: tasksError } = await supabase
        .from('admin_notes')
        .select('*')
        .eq('note_type', 'todo')
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('❌ Error loading tasks:', tasksError);
        toast({
          title: "Error",
          description: `Failed to load tasks: ${tasksError.message}`,
          variant: "destructive",
        });
        return;
      }

      // Get user information separately
      const userIds = [...new Set(tasksData?.map(task => task.user_id) || [])];
      let usersData: any[] = [];
      
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        if (usersError) {
          console.error('❌ Error loading users:', usersError);
          // Continue without user data rather than failing completely
        } else {
          usersData = users || [];
        }
      }

      // Combine the data
      const formattedTasks = tasksData?.map(task => {
        const user = usersData.find(u => u.id === task.user_id);
        
        // Try different possible field names for content
        const content = task.note_content || task.content || task.description || task.task_content || task.note || 'No content available';
        
        return {
          id: task.id,
          user_id: task.user_id,
          user_email: user?.email || 'Unknown',
          user_name: user?.full_name || 'Unknown',
          note_content: content,
          note_type: task.note_type || 'todo',
          is_completed: task.is_completed || false,
          created_at: task.created_at,
          updated_at: task.updated_at,
          due_date: task.due_date,
          priority: task.priority
        };
      }) || [];

      setTasks(formattedTasks);
    } catch (error) {
      console.error('❌ Unexpected error loading tasks:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading tasks.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('admin_notes')
        .update({ 
          is_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error completing task:', error);
        toast({
          title: "Error",
          description: "Failed to complete task. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Task marked as completed.",
      });

      // Reload tasks
      loadPendingTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('admin_notes')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        toast({
          title: "Error",
          description: "Failed to delete task. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Task deleted successfully.",
      });

      // Reload tasks
      loadPendingTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = (task.note_content || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         (task.user_name || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         (task.user_email || '').toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesType = filters.taskType === 'all' || task.note_type === filters.taskType;
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
    const matchesCompleted = filters.showCompleted || !task.is_completed;

    return matchesSearch && matchesType && matchesPriority && matchesCompleted;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-900/40 text-green-400 border-green-200';
      default: return 'bg-neutral-800 text-neutral-200 border-neutral-700';
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'todo': return 'bg-blue-900/40 text-blue-400 border-blue-200';
      case 'note': return 'bg-cyan-900/40 text-cyan-400 border-cyan-200';
      default: return 'bg-neutral-800 text-neutral-200 border-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pending Tasks</h2>
          <p className="text-muted-foreground">
            Manage tasks across all users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPendingTasks}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search tasks, users..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="task-type">Task Type</Label>
                <Select value={filters.taskType} onValueChange={(value) => setFilters({ ...filters, taskType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-completed"
                  checked={filters.showCompleted}
                  onCheckedChange={(checked) => setFilters({ ...filters, showCompleted: !!checked })}
                />
                <Label htmlFor="show-completed">Show Completed</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{filteredTasks.filter(t => !t.is_completed).length}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{filteredTasks.filter(t => t.is_completed).length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{new Set(filteredTasks.map(t => t.user_id)).size}</div>
                <div className="text-sm text-muted-foreground">Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-500" />
              <div>
                <div className="text-2xl font-bold">{filteredTasks.length}</div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Tasks ({filteredTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found matching your criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <Card key={task.id} className={`${task.is_completed ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{task.user_name || 'Unknown User'}</span>
                          <span className="text-sm text-muted-foreground">({task.user_email || 'Unknown Email'})</span>
                        </div>
                        
                        <div className="mb-2">
                          <p className="text-sm font-medium text-foreground">{task.note_content || 'No content available'}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getTaskTypeColor(task.note_type)}>
                            {task.note_type}
                          </Badge>
                          {task.priority && (
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          )}
                          {task.is_completed && (
                            <Badge variant="secondary">
                              Completed
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created: {formatDate(task.created_at)}
                          </div>
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Due: {formatDate(task.due_date)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {!task.is_completed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompleteTask(task.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
