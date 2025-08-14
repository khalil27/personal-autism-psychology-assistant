import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Save, Edit2, X } from 'lucide-react';
import { PatientProfile, Gender } from '../../types';
import { patientProfilesAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PatientProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
 const [formData, setFormData] = useState({
  age: 0,
  gender: 'male' as Gender,
  occupation: 'other' as "student" | "employed" | "unemployed" | "other",
  education_level: 'Not specified',
  marital_status: 'Not specified',
  notes: '',
});


  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const profileData = await patientProfilesAPI.getByUserId(user.id);
      setProfile(profileData);
      setFormData({
      age: profileData.age,
      gender: ["male","female","other"].includes(profileData.gender) 
    ? (profileData.gender as Gender) 
    : "male",
      occupation: ["student", "employed", "unemployed", "other"].includes(profileData.occupation)
        ? (profileData.occupation as "student" | "employed" | "unemployed" | "other")
        : "other",
      education_level: profileData.education_level,
      marital_status: profileData.marital_status,
      notes: profileData.notes,
    });

    } catch (error) {
      console.error('Failed to load profile:', error);
      // If profile doesn't exist, create a default one
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  let value: string | number = e.target.value;
  if (e.target.type === 'number') {
    value = e.target.value === '' ? 0 : parseInt(e.target.value);
  }
  setFormData({
    ...formData,
    [e.target.name]: value,
  });
};


  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      if (profile) {
        await patientProfilesAPI.update(user.id, formData);
      } else {
        await patientProfilesAPI.create({
          user_id: user.id,
          ...formData,
        });
      }
      await loadProfile();
      setEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
  if (profile) {
    setFormData({
      age: profile.age,
      gender: ["male", "female", "other"].includes(profile.gender)
        ? (profile.gender as Gender)
        : "male",
      occupation: ["student", "employed", "unemployed", "other"].includes(profile.occupation)
        ? (profile.occupation as "student" | "employed" | "unemployed" | "other")
        : "other",
      education_level: profile.education_level,
      marital_status: profile.marital_status,
      notes: profile.notes,
    });
  }
  setEditing(false);
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
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal and medical information</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.name} {user?.last_name}
              </h2>
              <div className="flex items-center text-gray-600 mt-1">
                <Mail className="w-4 h-4 mr-2" />
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              {editing ? (
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="120"
                />
              ) : (
                <p className="text-gray-900">{profile?.age || 'Not specified'}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              {editing ? (
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-gray-900 capitalize">{profile?.gender || 'Not specified'}</p>
              )}
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Occupation
              </label>
              {editing ? (
                <select
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="student">Student</option>
                  <option value="employed">Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-gray-900 capitalize">{profile?.occupation || 'Not specified'}</p>
              )}
            </div>


            {/* Education Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education Level
              </label>
              {editing ? (
                <select
                  name="education_level"
                  value={formData.education_level}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select education level</option>
                  <option value="High School">High School</option>
                  <option value="Associate Degree">Associate Degree</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Doctorate">Doctorate</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-gray-900">{profile?.education_level || 'Not specified'}</p>
              )}
            </div>

            {/* Marital Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marital Status
              </label>
              {editing ? (
                <select
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select marital status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-gray-900">{profile?.marital_status || 'Not specified'}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            {editing ? (
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional medical history or notes..."
              />
            ) : (
              <p className="text-gray-900">{profile?.notes || 'No additional notes'}</p>
            )}
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t">
              <button
                onClick={handleCancel}
                className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfilePage;