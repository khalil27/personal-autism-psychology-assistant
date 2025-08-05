import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, Plus, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Session } from '../../types';
import { sessionsAPI, usersAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PatientSessions: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [newSessionData, setNewSessionData] = useState({
    doctor_id: '',
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    loadSessions();
    loadDoctors();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await sessionsAPI.getAll();
      const patientSessions = data.filter(s => s.patient_id === user?.id);
      setSessions(patientSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
  try {
    const doctorList = await usersAPI.getDoctors();
    setDoctors(doctorList);
  } catch (error) {
    console.error('Failed to load doctors:', error);
  }
};



  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await sessionsAPI.create({
        patient_id: user.id,
        doctor_id: newSessionData.doctor_id,
        start_time: newSessionData.start_time,
        end_time: newSessionData.end_time,
        status: 'pending',
      });
      
      setShowNewSessionModal(false);
      setNewSessionData({ doctor_id: '', start_time: '', end_time: '' });
      loadSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'canceled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'active':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
          <p className="text-gray-600 mt-2">Manage your therapy sessions and appointments</p>
        </div>
        <button
          onClick={() => setShowNewSessionModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Session
        </button>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sessions Yet</h3>
            <p className="text-gray-600 mb-4">Get started by requesting your first therapy session</p>
            <button
              onClick={() => setShowNewSessionModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Request Session
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getStatusIcon(session.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Session with Dr. {session.doctor?.name} {session.doctor?.last_name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600 space-x-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(session.start_time).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {session.status === 'pending' && (
                        <p className="text-sm text-yellow-700 mt-2">
                          Waiting for doctor approval
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowNewSessionModal(false)} />
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Request New Session</h3>
                <button
                  onClick={() => setShowNewSessionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Doctor
                  </label>
                  <select
                    value={newSessionData.doctor_id}
                    onChange={(e) => setNewSessionData({ ...newSessionData, doctor_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name} {doctor.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newSessionData.start_time}
                    onChange={(e) => setNewSessionData({ ...newSessionData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newSessionData.end_time}
                    onChange={(e) => setNewSessionData({ ...newSessionData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewSessionModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Request Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSessions;