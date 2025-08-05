export type UserRole = 'patient' | 'doctor' | 'admin';
export type Gender = 'male' | 'female' | 'other';
export type SessionStatus = 'pending' | 'active' | 'completed' | 'canceled';
export type NotificationType = 'session_request' | 'report_ready' | 'feedback_added' | 'account_deleted';

export interface User {
  id: string;
  name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientProfile {
  user_id: string;
  age: number;
  gender: Gender;
  occupation: string;
  education_level: string;
  marital_status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Session {
  id: string;
  patient_id: string | User; // ✅ peut être une string ou un objet User
  doctor_id: string | User;  // ✅ idem
  start_time: string;
  end_time: string;
  status: SessionStatus;
  audio_transcript?: string;
  created_at: string;
}


export interface Report {
  id: string;
  session_id: string;
  content: string;
  summary: string;
  doctor_notes: string;
  notified_to_doctor: boolean;
  created_at: string;
  session?: Session;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ActionLog {
  id: string;
  user_id: string;
  action_type: string;
  target_id: string;
  details: string;
  timestamp: string;
  user?: User;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface RegisterData {
  name: string;
  last_name: string;
  email: string;
  password: string;
  role: UserRole;
}