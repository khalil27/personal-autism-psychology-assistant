import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Calendar, User, Eye } from 'lucide-react';
import { Report, Session } from '../../types';
import { reportsAPI, sessionsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PatientReports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [reportsData, sessionsData] = await Promise.all([
        reportsAPI.getAll(),
        sessionsAPI.getAll(),
      ]);
      
      // Get patient's sessions
      const patientSessions = sessionsData.filter(s => s.patient_id === user?.id);
      setSessions(patientSessions);
      
      // Filter reports for patient's sessions
      const sessionIds = patientSessions.map(s => s.id);
      const patientReports = reportsData.filter(r => sessionIds.includes(r.session_id));
      
      // Enrich reports with session data
      const enrichedReports = patientReports.map(report => ({
        ...report,
        session: patientSessions.find(s => s.id === report.session_id),
      }));
      
      setReports(enrichedReports);
    } catch (error) {
      console.error('Failed to load reports:', error);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
        <p className="text-gray-600 mt-2">View your therapy session reports and doctor's notes</p>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Available</h3>
            <p className="text-gray-600">Reports will appear here after your completed sessions</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Session Report - {new Date(report.created_at).toLocaleDateString()}
                      </h3>
                      <div className="flex items-center text-gray-600 space-x-4 text-sm mb-3">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          Dr. {report.session?.doctor?.name} {report.session?.doctor?.last_name}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {report.session && new Date(report.session.start_time).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{report.summary}</p>
                      {report.doctor_notes && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-2">Doctor's Notes:</h4>
                          <p className="text-blue-800 text-sm">{report.doctor_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Full
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setSelectedReport(null)} />
            
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Session Report Details</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Eye className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Session Info */}
                <div className="border-b pb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Date:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedReport.session && new Date(selectedReport.session.start_time).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Doctor:</span>
                      <span className="ml-2 text-gray-900">
                        Dr. {selectedReport.session?.doctor?.name} {selectedReport.session?.doctor?.last_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
                  <p className="text-gray-700 leading-relaxed">{selectedReport.summary}</p>
                </div>

                {/* Full Content */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Detailed Report</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedReport.content}</p>
                  </div>
                </div>

                {/* Doctor's Notes */}
                {selectedReport.doctor_notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Doctor's Notes</h4>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-blue-800 leading-relaxed">{selectedReport.doctor_notes}</p>
                    </div>
                  </div>
                )}

                {/* Generated On */}
                <div className="pt-4 border-t text-sm text-gray-500">
                  Report generated on {new Date(selectedReport.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientReports;