import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  User, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  Circle, 
  Plus, 
  Trash2,
  Calendar,
  Target,
  FileText,
  CalendarDays,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { InterviewScheduler } from './InterviewScheduler';

interface KanbanUser {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  last_activity_at: string;
  total_session_time_minutes: number;
  stage_updated_at: string;
  last_updated_at: string;
  upcoming_interview_name?: string;
  upcoming_interview_date?: string;
  is_rejected?: boolean;
}

interface CourseAssignment {
  id: string;
  course_id: string;
  course_title: string;
  company: string;
  assigned_at: string;
  progress_percentage: number;
}

interface AdminNote {
  id: string;
  note_type: 'note' | 'todo';
  content: string;
  is_completed: boolean;
  created_at: string;
  created_by: string;
}

interface Interview {
  id: string;
  user_id: string;
  interview_name: string;
  scheduled_date: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  meeting_link?: string;
  location?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface UserDetailModalProps {
  user: KanbanUser;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [courseAssignments, setCourseAssignments] = useState<CourseAssignment[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [stageTransitions, setStageTransitions] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [newTodo, setNewTodo] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadUserDetails();
    }
  }, [isOpen, user.user_id]);


  const loadUserDetails = async () => {
    try {
      setLoading(true);
      
      // Load course assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select(`
          id,
          course_id,
          assigned_at,
          courses (
            id,
            title,
            company
          )
        `)
        .eq('user_id', user.user_id);

      if (assignmentsError) {
        console.error('Error loading course assignments:', assignmentsError);
      } else {
        const formattedAssignments = assignments?.map(assignment => ({
          id: assignment.id,
          course_id: assignment.course_id,
          course_title: assignment.courses?.title || 'Unknown Course',
          company: assignment.courses?.company || 'Unknown Company',
          assigned_at: assignment.assigned_at,
          progress_percentage: 0 // TODO: Calculate actual progress
        })) || [];
        setCourseAssignments(formattedAssignments);
      }

      // Load admin notes
      const { data: notes, error: notesError } = await supabase
        .from('admin_notes')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      if (notesError) {
        console.error('Error loading admin notes:', notesError);
      } else {
        console.log('✅ Loaded admin notes:', notes?.length || 0, 'notes');
        console.log('📝 Notes data:', notes);
        setAdminNotes(notes || []);
      }

      // Load stage transitions
      const { data: transitions, error: transitionsError } = await supabase
        .from('stage_transitions')
        .select('*')
        .eq('user_id', user.user_id)
        .order('transitioned_at', { ascending: false });

      if (transitionsError) {
        console.error('Error loading stage transitions:', transitionsError);
      } else {
        setStageTransitions(transitions || []);
      }

      // Load interviews
      const { data: interviewData, error: interviewError } = await supabase
        .from('interviews')
        .select('*')
        .eq('user_id', user.user_id)
        .order('scheduled_date', { ascending: false });

      if (interviewError) {
        console.error('Error loading interviews:', interviewError);
      } else {
        setInterviews(interviewData || []);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      toast({
        title: "Error",
        description: "Failed to load user details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const { error } = await supabase
        .from('admin_notes')
        .insert({
          user_id: user.user_id,
          note_type: 'note',
          content: newNote.trim(),
          created_by: currentUser?.id
        });

      if (error) throw error;

      setNewNote('');
      loadUserDetails();
      toast({
        title: "Success",
        description: "Note added successfully.",
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;

    setIsAddingTodo(true);
    try {
      const { error } = await supabase
        .from('admin_notes')
        .insert({
          user_id: user.user_id,
          note_type: 'todo',
          content: newTodo.trim(),
          created_by: currentUser?.id
        });

      if (error) throw error;

      setNewTodo('');
      loadUserDetails();
      toast({
        title: "Success",
        description: "To-do item added successfully.",
      });
    } catch (error) {
      console.error('Error adding todo:', error);
      toast({
        title: "Error",
        description: "Failed to add to-do item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingTodo(false);
    }
  };

  const handleToggleTodo = async (noteId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_notes')
        .update({ is_completed: !isCompleted })
        .eq('id', noteId);

      if (error) throw error;

      loadUserDetails();
    } catch (error) {
      console.error('Error updating todo:', error);
      toast({
        title: "Error",
        description: "Failed to update to-do item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('admin_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      loadUserDetails();
      toast({
        title: "Success",
        description: "Item deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectUser = async () => {
    if (!window.confirm(`Are you sure you want to reject ${user.full_name || user.email}? This will mark them as rejected and hide them from the kanban board.`)) return;

    try {
      const { error } = await supabase.rpc('reject_user', {
        p_user_id: user.user_id,
        p_rejected_by: currentUser?.id,
        p_reason: 'Rejected by admin'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User has been rejected and will be hidden from the kanban board.",
      });
      
      onUpdate(); // Refresh the kanban data
      onClose();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: "Failed to reject user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTimeSpent = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const notes = adminNotes.filter(note => note.note_type === 'note');
  const todos = adminNotes.filter(note => note.note_type === 'todo');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {user.full_name || user.email}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRejectUser}
              className="flex items-center gap-1 ml-2"
            >
              <XCircle className="w-3 h-3" />
              Reject
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading user details...</span>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="notes">
                <FileText className="w-4 h-4 mr-2" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="todos">
                <Target className="w-4 h-4 mr-2" />
                To-dos
              </TabsTrigger>
              <TabsTrigger value="interviews">
                <CalendarDays className="w-4 h-4 mr-2" />
                Interviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        Total time: {formatTimeSpent(user.total_session_time_minutes || 0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        Last activity: {formatDate(user.last_activity_at || user.stage_updated_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Assigned Courses:</span>
                      <span className="text-sm font-medium">{courseAssignments.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Admin Notes:</span>
                      <span className="text-sm font-medium">{adminNotes.filter(note => note.note_type === 'note').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">To-do Items:</span>
                      <span className="text-sm font-medium">{adminNotes.filter(note => note.note_type === 'todo').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Completed:</span>
                      <span className="text-sm font-medium">
                        {adminNotes.filter(note => note.note_type === 'todo' && note.is_completed).length}/{adminNotes.filter(note => note.note_type === 'todo').length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Timeline */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    
                    // Create a combined timeline of all activities
                    const timelineItems = [];
                    
                    // Add notes
                    adminNotes.filter(note => note.note_type === 'note').forEach(note => {
                      timelineItems.push({
                        id: `note-${note.id}`,
                        type: 'note',
                        title: 'Note Added',
                        content: note.content,
                        timestamp: note.created_at,
                        icon: FileText,
                        color: 'text-blue-600',
                        bgColor: 'bg-blue-50',
                        borderColor: 'border-blue-200'
                      });
                    });
                    
                    // Add todos
                    adminNotes.filter(note => note.note_type === 'todo').forEach(todo => {
                      timelineItems.push({
                        id: `todo-${todo.id}`,
                        type: 'todo',
                        title: todo.is_completed ? 'To-do Completed' : 'To-do Added',
                        content: todo.content,
                        timestamp: todo.created_at,
                        icon: todo.is_completed ? CheckCircle : Circle,
                        color: todo.is_completed ? 'text-green-600' : 'text-orange-600',
                        bgColor: todo.is_completed ? 'bg-green-50' : 'bg-orange-50',
                        borderColor: todo.is_completed ? 'border-green-200' : 'border-orange-200'
                      });
                    });
                    
                    // Add interviews from loaded data
                    interviews.forEach(interview => {
                      timelineItems.push({
                        id: `interview-${interview.id}`,
                        type: 'interview',
                        title: 'Interview Scheduled',
                        content: `${interview.interview_type} - ${formatDate(interview.scheduled_date)}`,
                        timestamp: interview.scheduled_date,
                        icon: CalendarDays,
                        color: 'text-purple-600',
                        bgColor: 'bg-purple-50',
                        borderColor: 'border-purple-200'
                      });
                    });
                    
                    // Add stage transitions
                    stageTransitions.forEach(transition => {
                      timelineItems.push({
                        id: `transition-${transition.id}`,
                        type: 'stage',
                        title: 'Stage Moved',
                        content: `From ${transition.from_stage || 'Unknown'} to ${transition.to_stage}`,
                        timestamp: transition.created_at,
                        icon: Target,
                        color: 'text-indigo-600',
                        bgColor: 'bg-indigo-50',
                        borderColor: 'border-indigo-200'
                      });
                    });
                    
                    // Sort by timestamp (newest first)
                    timelineItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                    
                    if (timelineItems.length === 0) {
                      // Add basic user activity if no other activities
                      timelineItems.push({
                        id: 'user-created',
                        type: 'user',
                        title: 'User Added to System',
                        content: `User ${user.full_name || user.email} was added to the system`,
                        timestamp: user.stage_updated_at || user.last_activity_at || new Date().toISOString(),
                        icon: User,
                        color: 'text-gray-600',
                        bgColor: 'bg-gray-50',
                        borderColor: 'border-gray-200'
                      });
                    }
                    
                    return (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {timelineItems.slice(0, 10).map((item, index) => {
                          const IconComponent = item.icon;
                          return (
                            <div key={item.id} className="flex items-start gap-3">
                              {/* Timeline line */}
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full ${item.bgColor} ${item.borderColor} border-2 flex items-center justify-center`}>
                                  <IconComponent className={`w-4 h-4 ${item.color}`} />
                                </div>
                                {index < timelineItems.slice(0, 10).length - 1 && (
                                  <div className="w-0.5 h-6 bg-border mt-2"></div>
                                )}
                              </div>
                              
                              {/* Timeline content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{item.title}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(item.timestamp)}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {item.content}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        
                        {timelineItems.length > 10 && (
                          <div className="text-center pt-2">
                            <p className="text-xs text-muted-foreground">
                              +{timelineItems.length - 10} more activities
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Assigned Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {courseAssignments.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No courses assigned yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {courseAssignments.map((assignment) => (
                        <div key={assignment.id} className="p-3 border border-border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{assignment.course_title}</h4>
                            <Badge variant="outline">{assignment.company}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Assigned: {formatDate(assignment.assigned_at)}</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{assignment.progress_percentage}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${assignment.progress_percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Add Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Add a note about this user..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleAddNote} 
                    disabled={isAddingNote || !newNote.trim()}
                    size="sm"
                  >
                    {isAddingNote ? "Adding..." : "Add Note"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {adminNotes.filter(note => note.note_type === 'note').length === 0 ? (
                    <p className="text-muted-foreground text-sm">No notes yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {adminNotes.filter(note => note.note_type === 'note').map((note) => (
                        <div key={note.id} className="p-2 bg-muted rounded text-sm">
                          <p>{note.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(note.created_at)}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-1 h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Todos Tab */}
            <TabsContent value="todos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Add To-do</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Add a to-do item..."
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                  />
                  <Button 
                    onClick={handleAddTodo} 
                    disabled={isAddingTodo || !newTodo.trim()}
                    size="sm"
                  >
                    {isAddingTodo ? "Adding..." : "Add To-do"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">To-do Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {adminNotes.filter(note => note.note_type === 'todo').length === 0 ? (
                    <p className="text-muted-foreground text-sm">No to-do items yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {adminNotes.filter(note => note.note_type === 'todo').map((todo) => (
                        <div key={todo.id} className="flex items-start gap-2 p-2 bg-muted rounded">
                          <Checkbox
                            checked={todo.is_completed}
                            onCheckedChange={() => handleToggleTodo(todo.id, todo.is_completed)}
                          />
                          <div className="flex-1">
                            <p className={`text-sm ${todo.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                              {todo.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(todo.created_at)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteNote(todo.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interviews Tab */}
            <TabsContent value="interviews" className="space-y-4">
              <InterviewScheduler 
                userId={user.user_id} 
                onUpdate={loadUserDetails}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

