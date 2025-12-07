import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import axios from 'axios';
import ProfessionalModal from '../components/ProfessionalModal';

interface Professional {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  specialties: string | null;
  active: boolean;
  createdAt: string;
  _count: {
    services: number;
    appointments: number;
  };
}

export default function Professionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/professionals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfessionals(response.data);
    } catch (error) {
      console.error('Error fetching professionals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedProfessional(null);
    setIsModalOpen(true);
  };

  const handleEdit = (professional: Professional) => {
    setSelectedProfessional(professional);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this professional? This will also delete all their services and availability.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/professionals/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProfessionals();
    } catch (error) {
      console.error('Error deleting professional:', error);
      alert('Failed to delete professional');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/professionals/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProfessionals();
    } catch (error) {
      console.error('Error toggling professional status:', error);
      alert('Failed to update professional status');
    }
  };

  const handleModalClose = (refresh?: boolean) => {
    setIsModalOpen(false);
    setSelectedProfessional(null);
    if (refresh) {
      fetchProfessionals();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-primary" />
            Professionals
          </h1>
          <p className="text-gray-600 mt-1">Manage your team members and service providers</p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Professional
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-700">Total Professionals</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{professionals.length}</p>
            </div>
            <Users className="text-primary-500" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-xl p-6 border border-success-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-success-700">Active</p>
              <p className="text-3xl font-bold text-success-900 mt-2">
                {professionals.filter(p => p.active).length}
              </p>
            </div>
            <UserCheck className="text-success-500" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Inactive</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {professionals.filter(p => !p.active).length}
              </p>
            </div>
            <UserX className="text-gray-500" size={40} />
          </div>
        </div>
      </div>

      {/* Professionals Grid */}
      {professionals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No professionals yet</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first team member</p>
          <button onClick={handleCreate} className="btn-primary">
            <Plus size={20} className="mr-2" />
            Add Professional
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.map((professional) => (
            <div
              key={professional.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
            >
              {/* Avatar Section */}
              <div className="bg-gradient-to-br from-primary-500 to-secondary-600 h-24 relative">
                <div className="absolute -bottom-12 left-6">
                  {professional.avatarUrl ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${professional.avatarUrl}`}
                      alt={professional.name}
                      className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center shadow-lg">
                      <span className="text-3xl font-bold text-primary-700">
                        {professional.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                {!professional.active && (
                  <span className="absolute top-3 right-3 px-3 py-1 bg-gray-800 text-white text-xs font-semibold rounded-full">
                    Inactive
                  </span>
                )}
              </div>

              {/* Content Section */}
              <div className="pt-16 px-6 pb-6">
                <h3 className="text-xl font-bold text-gray-900">{professional.name}</h3>

                {professional.specialties && (
                  <p className="text-sm text-primary-600 font-medium mt-1">
                    {professional.specialties}
                  </p>
                )}

                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  {professional.email && (
                    <p className="truncate">{professional.email}</p>
                  )}
                  {professional.phone && (
                    <p>{professional.phone}</p>
                  )}
                </div>

                {professional.bio && (
                  <p className="text-sm text-gray-700 mt-3 line-clamp-2">
                    {professional.bio}
                  </p>
                )}

                {/* Stats */}
                <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">
                      {professional._count.services}
                    </p>
                    <p className="text-xs text-gray-600">Services</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-secondary-600">
                      {professional._count.appointments}
                    </p>
                    <p className="text-xs text-gray-600">Bookings</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(professional)}
                    className="flex-1 btn-secondary text-sm py-2"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(professional.id)}
                    className={`flex-1 text-sm py-2 px-4 rounded-lg font-semibold transition-all ${
                      professional.active
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-success-100 text-success-700 hover:bg-success-200'
                    }`}
                  >
                    {professional.active ? <UserX size={16} /> : <UserCheck size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(professional.id)}
                    className="btn bg-danger-100 text-danger-700 hover:bg-danger-200 text-sm py-2 px-4"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <ProfessionalModal
          professional={selectedProfessional}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
