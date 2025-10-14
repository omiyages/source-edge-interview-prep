import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, User, MapPin, Video, ExternalLink, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpcomingInterview {
  id: string;
  user_id: string;
  interview_name: string;
  scheduled_date: string;
  user_name: string;
  user_email: string;
  user_position?: string;
  created_at: string;
}

export const UpcomingInterviews: React.FC = () => {
  const [interviews, setInterviews] = useState<UpcomingInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [excludedTypes, setExcludedTypes] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const loadUpcomingInterviews = async () => {
    try {
      setLoading(true);
      
      // Get all upcoming interviews with user details
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          id,
          user_id,
          interview_name,
          scheduled_date,
          created_at,
          profiles!inner(
            full_name,
            email,
            position
          )
        `)
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true });

      console.log('📊 Interview query result:', { data, error });

      if (error) {
        console.error('Error loading interviews:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Try a simpler query without the join
        console.log('🔄 Trying simpler query without join...');
        const { data: simpleData, error: simpleError } = await supabase
          .from('interviews')
          .select('id, user_id, interview_name, scheduled_date, created_at')
          .gte('scheduled_date', new Date().toISOString())
          .order('scheduled_date', { ascending: true });

        if (simpleError) {
          console.error('Simple query also failed:', simpleError);
          toast({
            title: "Error",
            description: "Failed to load upcoming interviews. Please check if the interviews table exists.",
            variant: "destructive",
          });
          return;
        }

        // Get user details separately
        const userIds = simpleData?.map(i => i.user_id) || [];
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, full_name, email, position')
          .in('id', userIds);

        if (userError) {
          console.error('Error loading user data:', userError);
          toast({
            title: "Error",
            description: "Failed to load user details for interviews.",
            variant: "destructive",
          });
          return;
        }

        // Transform the data manually
        const transformedInterviews = simpleData?.map(interview => {
          const user = userData?.find(u => u.id === interview.user_id);
          return {
            id: interview.id,
            user_id: interview.user_id,
            interview_name: interview.interview_name,
            scheduled_date: interview.scheduled_date,
            user_name: user?.full_name || 'Unknown User',
            user_email: user?.email || 'No email',
            user_position: user?.position || 'No position',
            created_at: interview.created_at,
          };
        }) || [];

        setInterviews(transformedInterviews);
        return;
      }

      // Transform the data to include user details
      const transformedInterviews = data?.map(interview => ({
        id: interview.id,
        user_id: interview.user_id,
        interview_name: interview.interview_name,
        scheduled_date: interview.scheduled_date,
        user_name: interview.profiles.full_name,
        user_email: interview.profiles.email,
        user_position: interview.profiles.position,
        created_at: interview.created_at,
      })) || [];

      setInterviews(transformedInterviews);
    } catch (error) {
      console.error('Error loading interviews:', error);
      toast({
        title: "Error",
        description: "Failed to load upcoming interviews.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpcomingInterviews();
  }, []);

  // Get unique interview types from all interviews
  const interviewTypes = useMemo(() => {
    const types = new Set<string>();
    interviews.forEach(interview => {
      if (interview.interview_name) {
        types.add(interview.interview_name);
      }
    });
    return Array.from(types).sort();
  }, [interviews]);

  const toggleInterviewType = (type: string) => {
    setExcludedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const getFilteredInterviews = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    return interviews.filter(interview => {
      const interviewDate = new Date(interview.scheduled_date);
      
      // Check if interview type is excluded
      if (excludedTypes.has(interview.interview_name)) {
        return false;
      }
      
      switch (filter) {
        case 'today':
          return interviewDate >= today && interviewDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        case 'week':
          return interviewDate >= today && interviewDate < weekFromNow;
        case 'month':
          return interviewDate >= today && interviewDate < monthFromNow;
        default:
          return true;
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntilInterview = (dateString: string) => {
    const now = new Date();
    const interviewDate = new Date(dateString);
    const diffMs = interviewDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Past';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays <= 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    return `In ${Math.ceil(diffDays / 30)} months`;
  };

  const getUrgencyColor = (dateString: string) => {
    const now = new Date();
    const interviewDate = new Date(dateString);
    const diffMs = interviewDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 0) return 'bg-gray-100 text-gray-800';
    if (diffHours <= 24) return 'bg-red-100 text-red-800';
    if (diffHours <= 72) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const filteredInterviews = getFilteredInterviews();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Upcoming Interviews</h2>
          <p className="text-muted-foreground">
            {filteredInterviews.length} interview{filteredInterviews.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button onClick={loadUpcomingInterviews} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'today', 'week', 'month'] as const).map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterOption)}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Button>
          ))}
        </div>

        {/* Interview Type Filter - Always Visible */}
        {interviewTypes.length > 0 && (
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filter by Interview Type
                    {excludedTypes.size > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {excludedTypes.size} excluded
                      </Badge>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uncheck interview types to exclude them from the list
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExcludedTypes(new Set())}
                  disabled={excludedTypes.size === 0}
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-4">
                {interviewTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={!excludedTypes.has(type)}
                      onCheckedChange={() => toggleInterviewType(type)}
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer whitespace-nowrap"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Interviews List */}
      {filteredInterviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No interviews found</h3>
            <p className="text-muted-foreground text-center">
              {filter === 'all' 
                ? 'No upcoming interviews scheduled.'
                : `No interviews scheduled for the selected time period.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredInterviews.map((interview) => (
            <Card key={interview.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{interview.interview_name}</h3>
                      <Badge className={getUrgencyColor(interview.scheduled_date)}>
                        {getTimeUntilInterview(interview.scheduled_date)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{interview.user_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(interview.scheduled_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(interview.scheduled_date)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{interview.user_email}</span>
                      {interview.user_position && (
                        <Badge variant="outline">{interview.user_position}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
