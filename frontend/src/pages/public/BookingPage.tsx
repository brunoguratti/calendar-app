import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { publicAPI } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { bookingSchema } from '../../utils/validation';
import { formatCurrency, formatTime, generateDateOptions } from '../../utils/helpers';
import type {
  PublicProfile,
  Service,
  BookingFormData,
} from '../../types';

export const BookingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string>('');

  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  const watchService = watch('serviceId');
  const watchDate = watch('date');

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      try {
        const [profileData, servicesData] = await Promise.all([
          publicAPI.getProfile(slug),
          publicAPI.getServices(slug),
        ]);

        setProfile(profileData);
        setServices(servicesData);
      } catch (err: any) {
        setError(
          err.response?.data?.error ||
            'Professional not found or services unavailable'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!slug || !watchService || !watchDate) {
        setAvailableSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      try {
        const response = await publicAPI.getAvailableSlots(
          slug,
          watchDate,
          watchService
        );
        setAvailableSlots(response.slots);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load available slots');
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [slug, watchService, watchDate]);

  const onSubmit = async (data: BookingFormData) => {
    if (!slug) return;

    try {
      setError('');
      const appointment = await publicAPI.createAppointment(slug, data);
      navigate(`/booking-confirmed/${appointment.id}`);
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Failed to create booking. Please try again.'
      );
    }
  };

  if (isLoading) return <Loading />;

  if (error && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-700">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  const dateOptions = generateDateOptions(30);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            {profile?.businessName}
          </h1>
          <p className="text-lg text-gray-600">Book an appointment with {profile?.name}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Services */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Select a Service</h2>
            {services.length > 0 ? (
              <div className="space-y-3">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      watchService === service.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center flex-1">
                      <input
                        type="radio"
                        value={service.id}
                        {...register('serviceId')}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {service.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {service.durationMinutes} minutes
                        </p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-primary-600">
                      {formatCurrency(service.price)}
                    </p>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No services available
              </p>
            )}
            {errors.serviceId && (
              <p className="error-message mt-2">{errors.serviceId.message}</p>
            )}
          </Card>

          {/* Date and Time Selection */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Select Date & Time</h2>

            <div className="mb-4">
              <label className="label">Date</label>
              <select
                {...register('date')}
                className="input"
                disabled={!watchService}
              >
                <option value="">Select a date</option>
                {dateOptions.map((date) => (
                  <option key={date} value={date}>
                    {format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                  </option>
                ))}
              </select>
              {errors.date && (
                <p className="error-message">{errors.date.message}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="label">Time</label>
              {isLoadingSlots ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {availableSlots.map((slot) => (
                    <label
                      key={slot}
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        watch('time') === slot
                          ? 'border-primary-600 bg-primary-50 font-medium'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={slot}
                        {...register('time')}
                        className="sr-only"
                      />
                      <span className="text-sm">{formatTime(slot)}</span>
                    </label>
                  ))}
                </div>
              ) : watchService && watchDate ? (
                <p className="text-gray-500 text-center py-4">
                  No available time slots for this date
                </p>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Please select a service and date first
                </p>
              )}
              {errors.time && (
                <p className="error-message">{errors.time.message}</p>
              )}
            </div>
          </Card>
        </div>

        {/* Customer Information */}
        <Card className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Your Information</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register('customerName')}
                label="Full Name"
                placeholder="John Doe"
                error={errors.customerName?.message}
              />

              <Input
                {...register('customerEmail')}
                type="email"
                label="Email"
                placeholder="john@example.com"
                error={errors.customerEmail?.message}
              />

              <Input
                {...register('customerPhone')}
                type="tel"
                label="Phone (optional)"
                placeholder="555-0123"
                error={errors.customerPhone?.message}
              />
            </div>

            <div className="mt-6">
              <Button type="submit" variant="primary" className="w-full">
                Book Appointment
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
