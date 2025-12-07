import { useState, useEffect } from 'react';
import { X, Home } from 'lucide-react';
import axios from 'axios';

interface Room {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  active: boolean;
  services: Array<{
    service: {
      id: string;
      name: string;
    };
  }>;
}

interface Service {
  id: string;
  name: string;
  professional: {
    name: string;
  };
}

interface RoomModalProps {
  room: Room | null;
  onClose: (refresh?: boolean) => void;
}

export default function RoomModal({ room, onClose }: RoomModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 1,
  });
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
    if (room) {
      setFormData({
        name: room.name,
        description: room.description || '',
        capacity: room.capacity,
      });
      setSelectedServiceIds(room.services.map(s => s.service.id));
    }
  }, [room]);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/services`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'capacity' ? parseInt(value) || 1 : value
    });
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServiceIds(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        serviceIds: selectedServiceIds,
      };

      if (room) {
        // Update existing room
        await axios.put(
          `${import.meta.env.VITE_API_URL}/rooms/${room.id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        // Create new room
        await axios.post(
          `${import.meta.env.VITE_API_URL}/rooms`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      onClose(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-accent px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Home size={24} />
            {room ? 'Edit Room' : 'Add New Room'}
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

          {/* Room Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Room Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="input"
              placeholder="e.g., Styling Station 1, Massage Room"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="input"
              placeholder="Describe the room and its features..."
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Capacity <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              required
              min="1"
              className="input"
              placeholder="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of concurrent appointments this room can handle
            </p>
          </div>

          {/* Service Assignment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Assign Services
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Select which services can be performed in this room
            </p>

            {availableServices.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">No services available. Create services first.</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {availableServices.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedServiceIds.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <div className="ml-3 flex-1">
                      <span className="block text-sm font-medium text-gray-900">
                        {service.name}
                      </span>
                      <span className="block text-xs text-gray-500">
                        by {service.professional.name}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {selectedServiceIds.length > 0 && (
              <p className="text-xs text-success-600 mt-2">
                {selectedServiceIds.length} service(s) selected
              </p>
            )}
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
                room ? 'Update Room' : 'Create Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
