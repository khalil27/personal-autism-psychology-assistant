import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientProfilesAPI  } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext'; // si tu as un contexte d'auth
import { AlertCircle } from 'lucide-react';
import { PatientProfile } from '../../types';

const PatientProfileForm = () => {
  const [formData, setFormData] = useState<
    Omit<PatientProfile, 'user_id' | 'created_at' | 'updated_at' | 'user'>
  >({
    age: 0,
    gender: 'male', // par défaut
    occupation: '',
    education_level: '',
    marital_status: '',
    notes: '',
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth(); // assure-toi que tu as user.id ici

 const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  const { name, value } = e.target;
  setFormData({
    ...formData,
    [name]: name === 'age' ? Number(value) : value,
  });
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('Utilisateur non authentifié');
      return;
    }
    try {
      await patientProfilesAPI.create({
        user_id: user.id, // Vérifie si c'est `id` ou `_id` dans ton backend
        ...formData,
      });
      navigate('/patient/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create profile');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Complete Your Profile</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label>Age</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} required
                className="w-full px-3 py-2 border rounded-lg" />
            </div>

            <div>
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} required
                className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label>Occupation</label>
              <select name="occupation" value={formData.occupation} onChange={handleChange} required
                className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select</option>
                <option value="student">Student</option>
                <option value="employed">Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label>Education Level</label>
              <input type="text" name="education_level" value={formData.education_level} onChange={handleChange} required
                className="w-full px-3 py-2 border rounded-lg" />
            </div>

            <div>
              <label>Marital Status</label>
              <input type="text" name="marital_status" value={formData.marital_status} onChange={handleChange} required
                className="w-full px-3 py-2 border rounded-lg" />
            </div>

            <div>
              <label>Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg" rows={3} />
            </div>

            <button type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
              Submit Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientProfileForm;
