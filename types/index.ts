export type UserRole = 'admin' | 'member';
export type UserStatus = 'pending' | 'approved' | 'blocked';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type ProjectStatus = 'active' | 'archived';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  email?: string | null;
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  created_at: string;
  owner?: Profile;
}

export interface Task {
  id: string;
  project_id: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  assignee?: Profile;
  project?: Project;
  notes?: TaskNote[];
}

export interface TaskNote {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface Update {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: 'general' | 'important' | 'news';
  created_at: string;
  author?: Profile;
}
