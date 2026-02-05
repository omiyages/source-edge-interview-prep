export interface KanbanUser {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  position?: string;
  company?: string;
  last_activity_at: string;
  total_session_time_minutes: number;
  stage_updated_at: string;
  last_updated_at: string;
  upcoming_interview_name?: string;
  upcoming_interview_date?: string;
  is_rejected?: boolean;
  incomplete_tasks_count?: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  users: KanbanUser[];
}
