import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { getDayName } from '../../utils/helpers';
import axios from 'axios';

interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
  professional: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

interface Professional {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export const AvailabilityPage: React.FC = () => {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<Availability | null>(null);

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

      const [availabilityRes, professionalsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/availability`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/professionals`, { headers }),
      ]);

      setAvailability(availabilityRes.data);
      setProfessionals(professionalsRes.data.filter((p: any) => p.active));
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
        dayOfWeek: parseInt(data.dayOfWeek),
      };

      if (editingAvailability) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/availability/${editingAvailability.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/availability`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      reset();
      setShowForm(false);
      setEditingAvailability(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save availability');
    }
  };

  const handleEdit = (avail: Availability) => {
    setEditingAvailability(avail);
    reset({
      professionalId: avail.professional.id,
      dayOfWeek: avail.dayOfWeek,
      startTime: avail.startTime,
      endTime: avail.endTime,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/availability/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete availability');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAvailability(null);
    reset();
  };

  // Group availability by professional, then by day
  const availabilityByProfessional = availability.reduce((acc, avail) => {
    const profId = avail.professional.id;
    if (!acc[profId]) {
      acc[profId] = {
        professional: avail.professional,
        days: {} as Record<number, Availability[]>
      };
    }
    if (!acc[profId].days[avail.dayOfWeek]) {
      acc[profId].days[avail.dayOfWeek] = [];
    }
    acc[profId].days[avail.dayOfWeek].push(avail);
    return acc;
  }, {} as Record<string, { professional: any; days: Record<number, Availability[]> }>);

  if (isLoading) return <Loading />;

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Availability</h1>
            <p className="text-gray-600 mt-1">Set working hours for your professionals</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>Add Availability</Button>
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
            <p className="text-sm mt-1">Please create at least one professional before setting availability.</p>
          </div>
        )}

        {showForm && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingAvailability ? 'Edit Availability' : 'New Availability'}
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
                  disabled={!!editingAvailability}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Week <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('dayOfWeek', { required: 'Day is required' })}
                  className="input"
                >
                  <option value="">Select a day</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                  <option value="7">Sunday</option>
                </select>
                {errors.dayOfWeek && (
                  <p className="text-sm text-red-600 mt-1">{errors.dayOfWeek.message as string}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('startTime', { required: 'Start time is required' })}
                  type="time"
                  label="Start Time"
                  error={errors.startTime?.message as string}
                />

                <Input
                  {...register('endTime', { required: 'End time is required' })}
                  type="time"
                  label="End Time"
                  error={errors.endTime?.message as string}
                />
              </div>

              <div className="flex space-x-4 pt-4 border-t">
                <Button type="submit" variant="primary">
                  {editingAvailability ? 'Update Availability' : 'Create Availability'}
                </Button>
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Availability Cards Grouped by Professional */}
        <div className="space-y-8">
          {Object.values(availabilityByProfessional).map(({ professional, days }) => (
            <div key={professional.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Professional Header */}
              <div className="bg-gradient-to-r from-primary-500 to-secondary-600 p-6">
                <div className="flex items-center gap-4">
                  {professional.avatarUrl ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${professional.avatarUrl}`}
                      alt={professional.name}
                      className="w-16 h-16 rounded-full border-4 border-white object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-4 border-white">
                      <span className="text-2xl font-bold text-primary-700">
                        {professional.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-white">{professional.name}</h3>
                    <p className="text-primary-100 mt-1">
                      {Object.keys(days).length} day(s) configured
                    </p>
                  </div>
                </div>
              </div>

              {/* Availability Slots */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(days)
                  .sort(([dayA], [dayB]) => parseInt(dayA) - parseInt(dayB))
                  .map(([dayOfWeek, slots]) => (
                    <div key={dayOfWeek} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {getDayName(parseInt(dayOfWeek))}
                      </h4>
                      <div className="space-y-2">
                        {slots.map((avail) => (
                          <div
                            key={avail.id}
                            className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-primary-600 font-medium text-sm">
                                {avail.startTime}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="text-secondary-600 font-medium text-sm">
                                {avail.endTime}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEdit(avail)}
                                className="p-1 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(avail.id)}
                                className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {availability.length === 0 && (
          <Card>
            <p className="text-center text-gray-500 py-8">
              No availability set yet. Create your first availability slot to get started.
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};
