import axios from 'axios';
import { User, PatientProfile, Session, Report, Notification, ActionLog, RegisterData } from '../types';

// Mock API base URL - in production this would be your actual API
const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 👈 obligatoire pour envoyer les cookies
});
export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

// Add auth token to requests
/*api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});*/

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', { email, password });
    return res.data; // { message, user, token }
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', userData);
    return res.data; // { message, user, token }
  },

  getMe: async (): Promise<{ id: string; role: string }> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const res = await api.get('/users'); // nécessite un utilisateur admin
    return res.data.users;
  },

  getById: async (id: string): Promise<User> => {
    const res = await api.get(`/users/${id}`);
    return res.data.user;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const res = await api.put(`/users/${id}`, data);
    return res.data.user;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// Patient Profiles API
export const patientProfilesAPI = {
  // GET /api/patient-profiles (admin & doctor)
  getAll: async (): Promise<PatientProfile[]> => {
    const res = await api.get('/patient-profiles');
    return res.data; // le backend renvoie directement un tableau
  },

  // GET /api/patient-profiles/:userId (authentifié)
  getByUserId: async (userId: string): Promise<PatientProfile> => {
    const res = await api.get(`/patient-profiles/${userId}`);
    return res.data.profile;
  },

  // POST /api/patient-profiles (patient ou admin)
  create: async (data: Omit<PatientProfile, 'created_at' | 'updated_at'>): Promise<PatientProfile> => {
    const res = await api.post('/patient-profiles', data);
    return res.data.profile;
  },

  // PUT /api/patient-profiles/:userId (owner ou admin)
  update: async (userId: string, data: Partial<PatientProfile>): Promise<PatientProfile> => {
    const res = await api.put(`/patient-profiles/${userId}`, data);
    return res.data.profile;
  },

  // DELETE /api/patient-profiles/:userId (admin)
  delete: async (userId: string): Promise<void> => {
    await api.delete(`/patient-profiles/${userId}`);
  },
};

// Sessions API
export const sessionsAPI = {
  // GET /api/sessions?status=&patient_id=&doctor_id= (optionnel)
  getAll: async (filters?: { status?: string; patient_id?: string; doctor_id?: string }): Promise<Session[]> => {
    const params = filters || {};
    const res = await api.get('/sessions', { params });
    // Ton backend renvoie { sessions: [...] }
    return res.data.sessions;
  },

  // POST /api/sessions
  create: async (data: Omit<Session, 'id' | 'created_at'>): Promise<Session> => {
    const res = await api.post('/sessions', data);
    return res.data.session;
  },

  // PUT /api/sessions/:id
  update: async (id: string, data: Partial<Session>): Promise<Session> => {
    const res = await api.put(`/sessions/${id}`, data);
    return res.data.session;
  },
};

// Reports API
export const reportsAPI = {
  // GET /api/reports
  getAll: async (): Promise<Report[]> => {
    const res = await api.get('/reports');
    return res.data.reports || res.data; // selon ta réponse backend
  },

  // POST /api/reports
  create: async (data: Omit<Report, 'id' | 'created_at'>): Promise<Report> => {
    const res = await api.post('/reports', data);
    return res.data.report;
  },
};

// Notifications API
export const notificationsAPI = {
  // GET /api/notifications/:userId
  getByUserId: async (userId: string): Promise<Notification[]> => {
    const res = await api.get(`/notifications/${userId}`);
    return res.data.notifications || res.data; // selon backend
  },

  // POST /api/notifications
  create: async (data: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> => {
    const res = await api.post('/notifications', data);
    return res.data.notification;
  },

  // PUT /api/notifications/:id/read
  markAsRead: async (id: string): Promise<Notification> => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data.notification;
  },
};

// Action Logs API
export const actionLogsAPI = {
  // GET /api/action-logs
  getAll: async (filters?: Record<string, any>): Promise<ActionLog[]> => {
    const res = await api.get('/action-logs', { params: filters });
    return res.data.actionLogs || res.data; // selon backend
  },

  // POST /api/action-logs
  create: async (data: Omit<ActionLog, 'id' | 'timestamp'>): Promise<ActionLog> => {
    const res = await api.post('/action-logs', data);
    return res.data.actionLog;
  },
};