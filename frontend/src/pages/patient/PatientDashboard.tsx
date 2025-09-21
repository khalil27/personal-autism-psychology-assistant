import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, FileText, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { Session, Report } from '../../types';
import { sessionsAPI, reportsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [sessionsData, reportsData] = await Promise.all([
        sessionsAPI.getAll(),
        reportsAPI.getByPatientId(user!.id),
      ]);
      
      // Filter sessions for current patient
      const patientSessions = sessionsData.filter(s => s.patient_id === user?.id);
      setSessions(patientSessions);
      
      // Filter reports for patient's sessions
      const sessionIds = patientSessions.map(s => s.id);
      const patientReports = reportsData.filter(r => sessionIds.includes(r.session_id));
      setReports(patientReports);
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

  const upcomingSessions = sessions.filter(s => s.status === 'pending' || s.status === 'active');
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const unreadReports = reports.filter(r => !r.notified_to_doctor);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      case 'active':
        return 'text-blue-700 bg-blue-100';
      case 'completed':
        return 'text-green-700 bg-green-100';
      case 'canceled':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 mt-2">Here's an overview of your healthcare journey</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{completedSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Reports</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Updates</p>
              <p className="text-2xl font-bold text-gray-900">{unreadReports.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Plus className="w-5 h-5 text-blue-600 mr-3" />
            <span className="font-medium text-gray-900">Schedule New Session</span>
          </button>
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-5 h-5 text-green-600 mr-3" />
            <span className="font-medium text-gray-900">View Reports</span>
          </button>
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-5 h-5 text-purple-600 mr-3" />
            <span className="font-medium text-gray-900">Manage Sessions</span>
          </button>
        </div>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Sessions</h2>
          <div className="space-y-4">
            {sessions.slice(0, 3).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Session with Dr. {session.doctor?.name} {session.doctor?.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(session.start_time).toLocaleDateString()} at{' '}
                      {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reports */}
      {reports.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Reports</h2>
          <div className="space-y-4">
            {reports.slice(0, 3).map((report) => (
              <div key={report.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">
                      Session Report - {new Date(report.created_at).toLocaleDateString()}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{report.summary}</p>
                    {report.doctor_notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Doctor's Notes:</p>
                        <p className="text-sm text-blue-800">{report.doctor_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;