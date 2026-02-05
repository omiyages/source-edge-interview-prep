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

export const PendingTasksAlternative: React.FC = () => {
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
      console.log('🔍 Loading all pending tasks with alternative approach...');

      // Use a direct SQL query approach
      const { data, error } = await supabase
        .rpc('get_all_pending_tasks');

      if (error) {
        console.error('❌ Error loading tasks:', error);
        toast({
          title: "Error",
          description: `Failed to load tasks: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Loaded tasks:', data?.length);
      setTasks(data || []);
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
    const matchesSearch = task.note_content.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         task.user_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         task.user_email.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesType = filters.taskType === 'all' || task.note_type === filters.taskType;
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
    const matchesCompleted = filters.showCompleted || !task.is_completed;

    return matchesSearch && matchesType && matchesPriority && matchesCompleted;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'todo': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'note': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

      {/* Rest of the component remains the same */}
      <div className="text-center py-8 text-muted-foreground">
        Alternative approach - would use a custom SQL function
      </div>
    </div>
  );
};
