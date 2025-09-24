import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Clock, X, Eye } from 'lucide-react';
import { UserDetailModal } from './UserDetailModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface KanbanUser {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  last_activity_at: string;
  total_session_time_minutes: number;
  stage_updated_at: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  users: KanbanUser[];
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

export const KanbanBoard: React.FC = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<KanbanUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load users for all stages
  const loadKanbanData = async () => {
    try {
      setLoading(true);
      const newColumns: KanbanColumn[] = [];

      for (const stage of KANBAN_STAGES) {
        const { data, error } = await supabase.rpc('get_users_by_stage', {
          p_stage: stage.id
        });

        if (error) {
          console.error(`Error loading users for stage ${stage.id}:`, error);
          newColumns.push({
            id: stage.id,
            title: stage.title,
            users: []
          });
        } else {
          newColumns.push({
            id: stage.id,
            title: stage.title,
            users: data || []
          });
        }
      }

      setColumns(newColumns);
    } catch (error) {
      console.error('Error loading kanban data:', error);
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
  }, []);

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
      const { error } = await supabase.rpc('move_user_to_stage', {
        p_user_id: user.user_id,
        p_new_stage: destColumn.id,
        p_transitioned_by: user?.id,
        p_notes: `Moved from ${sourceColumn.title} to ${destColumn.title}`
      });

      if (error) {
        console.error('Error moving user:', error);
        toast({
          title: "Error",
          description: "Failed to move user. Please try again.",
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
      console.error('Error moving user:', error);
      toast({
        title: "Error",
        description: "Failed to move user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to reject ${userEmail}? This will hide them from the board.`)) {
      return;
    }

    try {
      const { error } = await supabase.rpc('reject_user', {
        p_user_id: userId,
        p_rejected_by: user?.id,
        p_reason: 'Rejected by admin'
      });

      if (error) {
        console.error('Error rejecting user:', error);
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
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: "Failed to reject user. Please try again.",
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
        <h2 className="text-2xl font-bold text-foreground mb-2">User Pipeline</h2>
        <p className="text-muted-foreground">Drag and drop users between stages to track their progress.</p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const stageConfig = KANBAN_STAGES.find(s => s.id === column.id);
            return (
              <div key={column.id} className="flex-shrink-0 w-80">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-sm font-medium">{column.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {column.users.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[200px] space-y-2 ${
                            snapshot.isDraggingOver ? 'bg-muted/50 rounded-md' : ''
                          }`}
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
                                  className={`p-3 bg-card border border-border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                                    snapshot.isDragging ? 'shadow-lg' : ''
                                  }`}
                                  onClick={() => handleUserClick(user)}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium text-sm">
                                        {user.full_name || user.email}
                                      </span>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRejectUser(user.user_id, user.email);
                                      }}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  
                                  <div className="space-y-1 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{formatTimeSpent(user.total_session_time_minutes || 0)}</span>
                                    </div>
                                    <div>
                                      Last activity: {formatLastActivity(user.last_activity_at || user.stage_updated_at)}
                                    </div>
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
    </div>
  );
};
