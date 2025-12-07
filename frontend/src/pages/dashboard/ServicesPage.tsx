import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { formatCurrency } from '../../utils/helpers';
import axios from 'axios';

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active: boolean;
  professional: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  rooms: Array<{
    room: {
      id: string;
      name: string;
    };
  }>;
}

interface Professional {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface Room {
  id: string;
  name: string;
}

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [servicesRes, professionalsRes, roomsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/services`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/professionals`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/rooms`, { headers }),
      ]);

      setServices(servicesRes.data);
      setProfessionals(professionalsRes.data.filter((p: any) => p.active));
      setRooms(roomsRes.data.filter((r: any) => r.active));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const payload = {
        ...data,
        durationMinutes: parseInt(data.durationMinutes),
        price: parseFloat(data.price),
        roomIds: selectedRoomIds,
      };

      if (editingService) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/services/${editingService.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/services`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      reset();
      setShowForm(false);
      setEditingService(null);
      setSelectedRoomIds([]);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save service');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    reset({
      name: service.name,
      description: service.description || '',
      durationMinutes: service.durationMinutes,
      price: service.price,
      professionalId: service.professional.id,
    });
    setSelectedRoomIds(service.rooms.map(r => r.room.id));
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete service');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingService(null);
    setSelectedRoomIds([]);
    reset();
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRoomIds(prev =>
      prev.includes(roomId)
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  if (isLoading) return <Loading />;

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Services</h1>
            <p className="text-gray-600 mt-1">Manage services offered by your professionals</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>Add Service</Button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {professionals.length === 0 && (
          <div className="mb-6 p-4 bg-warning-50 border border-warning-200 text-warning-800 rounded-lg">
            <p className="font-semibold">No professionals found</p>
            <p className="text-sm mt-1">Please create at least one professional before adding services.</p>
          </div>
        )}

        {showForm && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingService ? 'Edit Service' : 'New Service'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Professional Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('professionalId', { required: 'Professional is required' })}
                  className="input"
                  disabled={!!editingService}
                >
                  <option value="">Select a professional</option>
                  {professionals.map(prof => (
                    <option key={prof.id} value={prof.id}>
                      {prof.name}
                    </option>
                  ))}
                </select>
                {errors.professionalId && (
                  <p className="text-sm text-red-600 mt-1">{errors.professionalId.message as string}</p>
                )}
              </div>

              <Input
                {...register('name', { required: 'Service name is required' })}
                label="Service Name"
                placeholder="e.g., Haircut & Style"
                error={errors.name?.message as string}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  className="input"
                  rows={3}
                  placeholder="Describe the service..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('durationMinutes', {
                    required: 'Duration is required',
                    min: { value: 1, message: 'Duration must be at least 1 minute' }
                  })}
                  type="number"
                  label="Duration (minutes)"
                  placeholder="30"
                  error={errors.durationMinutes?.message as string}
                />

                <Input
                  {...register('price', {
                    required: 'Price is required',
                    min: { value: 0, message: 'Price must be positive' }
                  })}
                  type="number"
                  step="0.01"
                  label="Price ($)"
                  placeholder="25.00"
                  error={errors.price?.message as string}
                />
              </div>

              {/* Room Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Rooms (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Select which rooms this service can be performed in
                </p>

                {rooms.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No rooms available. Services can be created without room assignments.</p>
                ) : (
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {rooms.map(room => (
                      <label
                        key={room.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoomIds.includes(room.id)}
                          onChange={() => toggleRoomSelection(room.id)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-3 text-sm text-gray-900">{room.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-4 pt-4 border-t">
                <Button type="submit" variant="primary">
                  {editingService ? 'Update Service' : 'Create Service'}
                </Button>
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id}>
              <div className="flex items-start gap-3 mb-4">
                {service.professional.avatarUrl ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL}${service.professional.avatarUrl}`}
                    alt={service.professional.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center border-2 border-primary-200">
                    <span className="text-lg font-bold text-primary-700">
                      {service.professional.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    by {service.professional.name}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    service.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {service.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {service.description && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="flex items-center justify-between mb-3">
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(service.price)}
                </p>
                <p className="text-sm text-gray-600">
                  {service.durationMinutes} min
                </p>
              </div>

              {service.rooms.length > 0 && (
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    Available in:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {service.rooms.map(({ room }) => (
                      <span
                        key={room.id}
                        className="bg-accent-50 text-accent-700 px-2 py-1 rounded text-xs"
                      >
                        {room.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>

        {services.length === 0 && (
          <Card>
            <p className="text-center text-gray-500 py-8">
              No services yet. Create your first service to get started.
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};
