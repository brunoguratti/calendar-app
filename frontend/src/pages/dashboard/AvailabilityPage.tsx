import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { availabilityAPI } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { createAvailabilitySchema } from '../../utils/validation';
import { getDayName } from '../../utils/helpers';
import type { Availability, CreateAvailabilityDTO } from '../../types';

export const AvailabilityPage: React.FC = () => {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingAvailability, setEditingAvailability] =
    useState<Availability | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAvailabilityDTO>({
    resolver: zodResolver(createAvailabilitySchema),
  });

  const fetchAvailability = async () => {
    try {
      const data = await availabilityAPI.getAll();
      setAvailability(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load availability');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const onSubmit = async (data: CreateAvailabilityDTO) => {
    try {
      setError('');
      if (editingAvailability) {
        await availabilityAPI.update(editingAvailability.id, data);
      } else {
        await availabilityAPI.create(data);
      }
      reset();
      setShowForm(false);
      setEditingAvailability(null);
      fetchAvailability();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save availability');
    }
  };

  const handleEdit = (avail: Availability) => {
    setEditingAvailability(avail);
    reset({
      dayOfWeek: avail.dayOfWeek,
      startTime: avail.startTime,
      endTime: avail.endTime,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this availability slot?'))
      return;

    try {
      await availabilityAPI.delete(id);
      fetchAvailability();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete availability');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAvailability(null);
    reset();
  };

  // Group availability by day
  const availabilityByDay = availability.reduce((acc, avail) => {
    if (!acc[avail.dayOfWeek]) {
      acc[avail.dayOfWeek] = [];
    }
    acc[avail.dayOfWeek].push(avail);
    return acc;
  }, {} as Record<number, Availability[]>);

  if (isLoading) return <Loading />;

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Availability</h1>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              Add Availability
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {showForm && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingAvailability ? 'Edit Availability' : 'New Availability'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4">
                <label className="label">Day of Week</label>
                <select
                  {...register('dayOfWeek', { valueAsNumber: true })}
                  className="input"
                >
                  <option value="">Select a day</option>
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                </select>
                {errors.dayOfWeek && (
                  <p className="error-message">{errors.dayOfWeek.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('startTime')}
                  type="time"
                  label="Start Time"
                  error={errors.startTime?.message}
                />

                <Input
                  {...register('endTime')}
                  type="time"
                  label="End Time"
                  error={errors.endTime?.message}
                />
              </div>

              <div className="flex space-x-4">
                <Button type="submit" variant="primary">
                  {editingAvailability
                    ? 'Update Availability'
                    : 'Create Availability'}
                </Button>
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card>
          <h2 className="text-xl font-semibold mb-4">Weekly Schedule</h2>
          <div className="space-y-4">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <div key={day} className="border-b border-gray-200 pb-4 last:border-0">
                <h3 className="font-medium text-gray-900 mb-2">
                  {getDayName(day)}
                </h3>
                {availabilityByDay[day] && availabilityByDay[day].length > 0 ? (
                  <div className="space-y-2">
                    {availabilityByDay[day].map((avail) => (
                      <div
                        key={avail.id}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded"
                      >
                        <span className="text-gray-700">
                          {avail.startTime} - {avail.endTime}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(avail)}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(avail.id)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Not available</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {availability.length === 0 && (
          <Card className="mt-6">
            <p className="text-center text-gray-500 py-8">
              No availability set. Add your working hours to start accepting
              bookings.
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};
