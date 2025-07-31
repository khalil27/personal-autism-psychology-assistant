import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Search, Eye, Plus, Mail, Calendar } from 'lucide-react';
import { PatientProfile, Session } from '../../types';
import { patientProfilesAPI, sessionsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DoctorPatients: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const [patientsData, sessionsData] = await Promise.all([
        patientProfilesAPI.getAll(),
        sessionsAPI.getAll(),
      ]);
      
      // Filter sessions for current doctor
      const doctorSessions = sessionsData.filter(s => s.doctor_id === user?.id);
      setSessions(doctorSessions);
      
      // Get patients for doctor's sessions
      const patientIds = doctorSessions.map(s => s.patient_id);
      const doctorPatients = patientsData.filter(p => patientIds.includes(p.user_id));
      setPatients(doctorPatients);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.user?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPatientSessions = (patientId: string) => {
    return sessions.filter(s => s.patient_id === patientId);
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
          <h1 className="text-3xl font-bold text-gray-900">My Patients</h1>
          <p className="text-gray-600 mt-2">Manage your patient roster and view their profiles</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Add Patient
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search patients by name or email..."
          />
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No patients found' : 'No Patients Yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Try adjusting your search criteria'
                : 'Patients will appear here after you have sessions with them'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPatients.map((patient) => {
              const patientSessions = getPatientSessions(patient.user_id);
              const completedSessions = patientSessions.filter(s => s.status === 'completed').length;
              const upcomingSessions = patientSessions.filter(s => s.status === 'active' || s.status === 'pending').length;
              
              return (
                <div key={patient.user_id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {patient.user?.name} {patient.user?.last_name}
                        </h3>
                        <div className="flex items-center text-gray-600 space-x-4 text-sm mb-2">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {patient.user?.email}
                          </div>
                          <span>Age: {patient.age}</span>
                          <span className="capitalize">{patient.gender}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Occupation: {patient.occupation}</span>
                          <span>Education: {patient.education_level}</span>
                        </div>
                        <div className="flex items-center space-x-6 mt-3">
                          <div className="flex items-center text-green-600">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span className="text-sm">{completedSessions} completed</span>
                          </div>
                          {upcomingSessions > 0 && (
                            <div className="flex items-center text-blue-600">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span className="text-sm">{upcomingSessions} upcoming</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPatient(patient)}
                      className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setSelectedPatient(null)} />
            
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Patient Profile</h3>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Eye className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="flex items-center space-x-4 pb-4 border-b">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {selectedPatient.user?.name} {selectedPatient.user?.last_name}
                    </h4>
                    <p className="text-gray-600">{selectedPatient.user?.email}</p>
                  </div>
                </div>

                {/* Demographics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Age:</span>
                    <span className="ml-2 text-gray-900">{selectedPatient.age}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Gender:</span>
                    <span className="ml-2 text-gray-900 capitalize">{selectedPatient.gender}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Occupation:</span>
                    <span className="ml-2 text-gray-900">{selectedPatient.occupation}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Education:</span>
                    <span className="ml-2 text-gray-900">{selectedPatient.education_level}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Marital Status:</span>
                    <span className="ml-2 text-gray-900">{selectedPatient.marital_status}</span>
                  </div>
                </div>

                {/* Notes */}
                {selectedPatient.notes && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Additional Notes</h5>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700">{selectedPatient.notes}</p>
                    </div>
                  </div>
                )}

                {/* Session Summary */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Session Summary</h5>
                  <div className="grid grid-cols-3 gap-4">
                    {(() => {
                      const patientSessions = getPatientSessions(selectedPatient.user_id);
                      const completed = patientSessions.filter(s => s.status === 'completed').length;
                      const upcoming = patientSessions.filter(s => s.status === 'active' || s.status === 'pending').length;
                      const total = patientSessions.length;
                      
                      return (
                        <>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{completed}</div>
                            <div className="text-sm text-green-700">Completed</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{upcoming}</div>
                            <div className="text-sm text-blue-700">Upcoming</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-600">{total}</div>
                            <div className="text-sm text-gray-700">Total</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatients;