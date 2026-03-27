export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string;
  avatarUrl?: string | null;
}

export interface TaskStep {
  id: string;
  task_id: string;
  user_id: string;
  step_order: number;
  status: 'pending' | 'in_progress' | 'done';
  instruction?: string;
  material_link?: string;
  comments?: string;
  completed_at?: string;
  user_name?: string;
  pieces?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  type: string;
  status: 'todo' | 'in_progress' | 'paused' | 'done';
  assignee_id: string | null;
  creator_id: string;
  created_at: string;
  assignee_name?: string;
  creator_name?: string;
  active_start_time?: string | null;
  accumulated_seconds?: number;
  user_times?: { user_name: string; seconds: number }[];
  
  // New fields
  network?: string;
  placement?: string;
  format?: string;
  sector?: string;
  reference?: string;
  current_step_index?: number;
  steps?: TaskStep[];
  priority?: 'normal' | 'alta' | 'urgente';
  total_steps?: number;
  tags?: Tag[];
  brand?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  pause_reason: string | null;
  status: string;
  user_name?: string;
}
