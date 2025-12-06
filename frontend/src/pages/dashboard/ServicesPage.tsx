import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { servicesAPI } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { createServiceSchema } from '../../utils/validation';
import { formatCurrency } from '../../utils/helpers';
import type { Service, CreateServiceDTO } from '../../types';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateServiceDTO>({
    resolver: zodResolver(createServiceSchema),
  });

  const fetchServices = async () => {
    try {
      const data = await servicesAPI.getAll();
      setServices(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const onSubmit = async (data: CreateServiceDTO) => {
    try {
      setError('');
      if (editingService) {
        await servicesAPI.update(editingService.id, data);
      } else {
        await servicesAPI.create(data);
      }
      reset();
      setShowForm(false);
      setEditingService(null);
      fetchServices();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save service');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    reset({
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await servicesAPI.delete(id);
      fetchServices();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete service');
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await servicesAPI.update(service.id, { active: !service.active });
      fetchServices();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update service');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingService(null);
    reset();
  };

  if (isLoading) return <Loading />;

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>Add Service</Button>
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
              {editingService ? 'Edit Service' : 'New Service'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Input
                {...register('name')}
                label="Service Name"
                placeholder="e.g., Haircut"
                error={errors.name?.message}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('durationMinutes', { valueAsNumber: true })}
                  type="number"
                  label="Duration (minutes)"
                  placeholder="30"
                  error={errors.durationMinutes?.message}
                />

                <Input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  label="Price ($)"
                  placeholder="25.00"
                  error={errors.price?.message}
                />
              </div>

              <div className="flex space-x-4">
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
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {service.name}
                  </h3>
                  <p className="text-2xl font-bold text-primary-600 mt-2">
                    {formatCurrency(service.price)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {service.durationMinutes} minutes
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

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(service)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {service.active ? 'Deactivate' : 'Activate'}
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
