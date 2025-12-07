import { useState, useEffect, useRef } from 'react';
import { X, Upload, User } from 'lucide-react';
import axios from 'axios';

interface Professional {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  specialties: string | null;
  active: boolean;
}

interface ProfessionalModalProps {
  professional: Professional | null;
  onClose: (refresh?: boolean) => void;
}

export default function ProfessionalModal({ professional, onClose }: ProfessionalModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    specialties: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (professional) {
      setFormData({
        name: professional.name,
        email: professional.email || '',
        phone: professional.phone || '',
        bio: professional.bio || '',
        specialties: professional.specialties || '',
      });
      if (professional.avatarUrl) {
        setAvatarPreview(`${import.meta.env.VITE_API_URL}${professional.avatarUrl}`);
      }
    }
  }, [professional]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      formDataToSend.append('name', formData.name);
      if (formData.email) formDataToSend.append('email', formData.email);
      if (formData.phone) formDataToSend.append('phone', formData.phone);
      if (formData.bio) formDataToSend.append('bio', formData.bio);
      if (formData.specialties) formDataToSend.append('specialties', formData.specialties);
      if (avatarFile) formDataToSend.append('avatar', avatarFile);

      if (professional) {
        // Update existing professional
        await axios.put(
          `${import.meta.env.VITE_API_URL}/professionals/${professional.id}`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        // Create new professional
        await axios.post(
          `${import.meta.env.VITE_API_URL}/professionals`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      onClose(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save professional');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-secondary px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <User size={24} />
            {professional ? 'Edit Professional' : 'Add New Professional'}
          </h2>
          <button
            onClick={() => onClose()}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary-200 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center border-4 border-primary-200 shadow-lg">
                  <User size={48} className="text-primary-600" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-lg hover:bg-primary-600 transition-colors"
              >
                <Upload size={20} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-sm text-gray-600 mt-3">Click the upload button to add a photo</p>
            <p className="text-xs text-gray-500">Maximum file size: 5MB</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="input"
              placeholder="Enter professional's name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input"
              placeholder="professional@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="input"
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Specialties */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Specialties
            </label>
            <input
              type="text"
              name="specialties"
              value={formData.specialties}
              onChange={handleInputChange}
              className="input"
              placeholder="e.g., Hair Styling, Color Specialist"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple specialties with commas
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bio / About
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="input"
              placeholder="Tell us about this professional's experience and expertise..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onClose()}
              className="flex-1 btn bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </span>
              ) : (
                professional ? 'Update Professional' : 'Create Professional'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
