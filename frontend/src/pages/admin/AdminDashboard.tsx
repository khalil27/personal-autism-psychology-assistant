import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Calendar, FileText, Shield, Activity, AlertCircle } from 'lucide-react';
import { User, Session, Report, ActionLog } from '../../types';
import { usersAPI, sessionsAPI, reportsAPI, actionLogsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [usersData, sessionsData, reportsData, logsData] = await Promise.all([
        usersAPI.getAll(),
        sessionsAPI.getAll(),
        reportsAPI.getAll(),
        actionLogsAPI.getAll(),
      ]);

      console.log('logsData:', logsData); //
      
      setUsers(usersData);
      setSessions(sessionsData);
      setReports(reportsData);
      setActionLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const patients = users.filter(u => u.role === 'patient');
  const doctors = users.filter(u => u.role === 'doctor');
  const admins = users.filter(u => u.role === 'admin');
  const activeSessions = sessions.filter(s => s.status === 'active');
  const pendingSessions = sessions.filter(s => s.status === 'pending');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System overview and management center</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{activeSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{pendingSessions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Patients</h3>
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">{patients.length}</div>
          <p className="text-sm text-gray-600">Registered patients</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Doctors</h3>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">{doctors.length}</div>
          <p className="text-sm text-gray-600">Active doctors</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Admins</h3>
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-2">{admins.length}</div>
          <p className="text-sm text-gray-600">System administrators</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <Activity className="w-5 h-5 text-gray-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="space-y-4">
          {actionLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{log.details}</p>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <span>By {log.user?.name} {log.user?.last_name}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="text-sm font-medium text-green-600">
                {sessions.filter(s => s.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active</span>
              <span className="text-sm font-medium text-blue-600">
                {sessions.filter(s => s.status === 'active').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-sm font-medium text-yellow-600">
                {sessions.filter(s => s.status === 'pending').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Canceled</span>
              <span className="text-sm font-medium text-red-600">
                {sessions.filter(s => s.status === 'canceled').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="text-sm font-medium text-green-600">
                {users.filter(u => u.is_active).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Inactive Users</span>
              <span className="text-sm font-medium text-red-600">
                {users.filter(u => !u.is_active).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Recent Logins</span>
              <span className="text-sm font-medium text-blue-600">
                {users.filter(u => u.last_login_at).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;