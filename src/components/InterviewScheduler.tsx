import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

interface InterviewSchedulerProps {
  userId: string;
  onUpdate?: () => void;
}

const INTERVIEW_TYPES = [
  'Candidate Call',
  'HR Interview', 
  'Technical Challenge',
  'Technical Interview',
  'Cross Functional',
  '2nd Technical Interview',
  'Manager Interview'
];

export const InterviewScheduler: React.FC<InterviewSchedulerProps> = ({
  userId,
  onUpdate
}) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    interview_name: '',
    scheduled_date: '',
    scheduled_time: '',
    notes: ''
  });

  // Load interviews for the user
  const loadInterviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error loading interviews:', error);
        toast({
          title: "Error",
          description: "Failed to load interviews. Please try again.",
          variant: "destructive",
        });
      } else {
        setInterviews(data || []);
      }
    } catch (error) {
      console.error('Error loading interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.interview_name || !formData.scheduled_date || !formData.scheduled_time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAdding(true);
      
      // Combine date and time
      const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      
      const { error } = await supabase
        .from('interviews')
        .insert({
          user_id: userId,
          interview_name: formData.interview_name,
          scheduled_date: scheduledDateTime.toISOString(),
          notes: formData.notes || null,
          created_by: currentUser?.id,
          status: 'scheduled'
        });

      if (error) {
        console.error('Error creating interview:', error);
        toast({
          title: "Error",
          description: "Failed to create interview. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Interview scheduled successfully!",
        });
        
        // Reset form
        setFormData({
          interview_name: '',
          scheduled_date: '',
          scheduled_time: '',
          notes: ''
        });
        
        // Reload interviews
        loadInterviews();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error creating interview:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    try {
      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('id', interviewId);

      if (error) {
        console.error('Error deleting interview:', error);
        toast({
          title: "Error",
          description: "Failed to delete interview. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Interview deleted successfully!",
        });
        loadInterviews();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error deleting interview:', error);
    }
  };

  const handleStatusChange = async (interviewId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('interviews')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId);

      if (error) {
        console.error('Error updating interview status:', error);
        toast({
          title: "Error",
          description: "Failed to update interview status. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Interview status updated successfully!",
        });
        loadInterviews();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error updating interview status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-900/40 text-blue-400';
      case 'completed': return 'bg-green-900/40 text-green-400';
      case 'cancelled': return 'bg-red-900/40 text-red-400';
      case 'rescheduled': return 'bg-yellow-900/40 text-yellow-400';
      default: return 'bg-neutral-800 text-neutral-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-3 h-3" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      case 'rescheduled': return <AlertCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Loading interviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Interview Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Schedule New Interview</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interview_name">Interview Type *</Label>
                <Select 
                  value={formData.interview_name} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, interview_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interview type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Date *</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_time">Time *</Label>
                <Input
                  id="scheduled_time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the interview..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isAdding} className="w-full">
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Interview
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Interviews List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Scheduled Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          {interviews.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No interviews scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.map((interview) => (
                <div key={interview.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{interview.interview_name}</h4>
                        <Badge className={getStatusColor(interview.status)}>
                          {getStatusIcon(interview.status)}
                          <span className="ml-1">{interview.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateTime(interview.scheduled_date)}</span>
                        </div>
                        
                        {interview.notes && (
                          <p className="text-xs mt-2 p-2 bg-muted rounded">
                            {interview.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {interview.status === 'scheduled' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(interview.id, 'completed')}
                            className="h-8 px-2"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(interview.id, 'cancelled')}
                            className="h-8 px-2"
                          >
                            <XCircle className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteInterview(interview.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
