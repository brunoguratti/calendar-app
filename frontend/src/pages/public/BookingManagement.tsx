import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Clock, User, MapPin, DollarSign, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { formatCurrency, formatTime, generateDateOptions } from '../../utils/helpers';
import axios from 'axios';

interface AppointmentDetails {
  appointment: {
    id: string;
    date: string;
    time: string;
    status: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    notes: string | null;
    paymentStatus: string;
    paymentAmount: number;
    service: {
      name: string;
      description: string;
      price: number;
      durationMinutes: number;
    };
    professional: {
      name: string;
      avatarUrl: string | null;
    };
    room: {
      name: string;
    } | null;
    businessName: string;
  };
  canModify: boolean;
  cancellationPolicy: {
    hours: number;
    hoursUntilAppointment: number;
  };
}

export default function BookingManagement() {
  const { token } = useParams<{ token: string }>();
  const [appointmentData, setAppointmentData] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Reschedule state
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');

  useEffect(() => {
    fetchAppointment();
  }, [token]);

  useEffect(() => {
    if (newDate && token) {
      fetchAvailableSlots();
    }
  }, [newDate, token]);

  const fetchAppointment = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/manage/appointment/${token}`);
      setAppointmentData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!newDate) return;

    setLoadingSlots(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/manage/appointment/${token}/available-slots`,
        { params: { date: newDate } }
      );
      setAvailableSlots(response.data.availableSlots);
    } catch (err: any) {
      console.error('Failed to load available slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleCancel = async () => {
    if (!token) return;

    setIsCancelling(true);
    setError('');

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/manage/appointment/${token}/cancel`, {
        cancellationReason: cancellationReason || 'Cancelled by customer',
      });

      setSuccessMessage('Your appointment has been cancelled successfully.');
      setShowCancelModal(false);
      fetchAppointment();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel appointment');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReschedule = async () => {
    if (!token || !newDate || !newTime) {
      setError('Please select both a date and time');
      return;
    }

    setIsRescheduling(true);
    setError('');

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/manage/appointment/${token}/reschedule`, {
        requestedDate: newDate,
        requestedTime: newTime,
        reason: rescheduleReason,
      });

      setSuccessMessage('Your reschedule request has been submitted successfully.');
      setShowRescheduleModal(false);
      setNewDate('');
      setNewTime('');
      setRescheduleReason('');
      fetchAppointment();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reschedule appointment');
    } finally {
      setIsRescheduling(false);
    }
  };

  if (loading) return <Loading />;

  if (error && !appointmentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <XCircle className="mx-auto text-danger mb-4" size={64} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-700">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!appointmentData) return null;

  const { appointment, canModify, cancellationPolicy } = appointmentData;
  const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
  const dateOptions = generateDateOptions(30);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
            {appointment.businessName}
          </h1>
          <p className="text-lg text-gray-600">Manage Your Appointment</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-success-50 border border-success-200 text-success-800 rounded-lg flex items-center gap-3">
            <CheckCircle size={24} />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 text-danger-800 rounded-lg flex items-center gap-3">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        )}

        {/* Appointment Status Badge */}
        <div className="mb-6 text-center">
          <span
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold ${
              appointment.status === 'confirmed'
                ? 'bg-success text-white'
                : appointment.status === 'cancelled'
                ? 'bg-gray-500 text-white'
                : 'bg-warning text-white'
            }`}
          >
            {appointment.status === 'confirmed' && <CheckCircle size={20} />}
            {appointment.status === 'cancelled' && <XCircle size={20} />}
            {appointment.status === 'pending' && <Clock size={20} />}
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </span>
        </div>

        {/* Main Appointment Details */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointment Details</h2>

          <div className="space-y-6">
            {/* Date and Time */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="text-primary-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Date & Time</p>
                <p className="text-xl font-bold text-gray-900">
                  {format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-lg text-gray-700">{formatTime(appointment.time)}</p>
              </div>
            </div>

            {/* Service */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0">
                <Clock className="text-secondary-600" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-medium">Service</p>
                <p className="text-xl font-bold text-gray-900">{appointment.service.name}</p>
                {appointment.service.description && (
                  <p className="text-sm text-gray-600 mt-1">{appointment.service.description}</p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  Duration: {appointment.service.durationMinutes} minutes
                </p>
              </div>
            </div>

            {/* Professional */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                {appointment.professional.avatarUrl ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL}${appointment.professional.avatarUrl}`}
                    alt={appointment.professional.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="text-accent-600" size={24} />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Professional</p>
                <p className="text-xl font-bold text-gray-900">{appointment.professional.name}</p>
              </div>
            </div>

            {/* Room */}
            {appointment.room && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-primary-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Room</p>
                  <p className="text-xl font-bold text-gray-900">{appointment.room.name}</p>
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="text-success-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Price</p>
                <p className="text-2xl font-bold text-success-600">
                  {formatCurrency(appointment.paymentAmount)}
                </p>
                <p className="text-sm text-gray-600">
                  Payment Status: {appointment.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">Your Information</p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Name:</span>{' '}
                  <span className="font-medium text-gray-900">{appointment.customerName}</span>
                </p>
                <p>
                  <span className="text-gray-600">Email:</span>{' '}
                  <span className="font-medium text-gray-900">{appointment.customerEmail}</span>
                </p>
                {appointment.customerPhone && (
                  <p>
                    <span className="text-gray-600">Phone:</span>{' '}
                    <span className="font-medium text-gray-900">{appointment.customerPhone}</span>
                  </p>
                )}
                {appointment.notes && (
                  <p>
                    <span className="text-gray-600">Notes:</span>{' '}
                    <span className="font-medium text-gray-900">{appointment.notes}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Cancellation Policy */}
        <Card className="mb-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-warning flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Cancellation Policy</h3>
              <p className="text-sm text-gray-700">
                Appointments must be cancelled at least {cancellationPolicy.hours} hours in advance.
              </p>
              <p className="text-sm text-gray-700 mt-2">
                Time until appointment:{' '}
                <span className="font-semibold">
                  {cancellationPolicy.hoursUntilAppointment.toFixed(1)} hours
                </span>
              </p>
              {!canModify && appointment.status !== 'cancelled' && (
                <p className="text-sm text-danger-600 font-medium mt-2">
                  This appointment can no longer be modified or cancelled.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        {appointment.status !== 'cancelled' && canModify && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => setShowRescheduleModal(true)}
              variant="primary"
              className="py-3"
            >
              Reschedule Appointment
            </Button>
            <Button
              onClick={() => setShowCancelModal(true)}
              className="py-3 bg-danger-100 text-danger-700 hover:bg-danger-200"
            >
              Cancel Appointment
            </Button>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Appointment</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Let us know why you're cancelling..."
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowCancelModal(false)}
                  variant="secondary"
                  className="flex-1"
                  disabled={isCancelling}
                >
                  Keep Appointment
                </Button>
                <Button
                  onClick={handleCancel}
                  className="flex-1 bg-danger text-white hover:bg-danger-600"
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="max-w-2xl w-full my-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reschedule Appointment</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Date
                  </label>
                  <select
                    value={newDate}
                    onChange={(e) => {
                      setNewDate(e.target.value);
                      setNewTime('');
                    }}
                    className="input"
                  >
                    <option value="">Select a date...</option>
                    {dateOptions.map((date) => (
                      <option key={date} value={date}>
                        {format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                      </option>
                    ))}
                  </select>
                </div>

                {newDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Time
                    </label>
                    {loadingSlots ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setNewTime(slot)}
                            className={`p-2 rounded-lg font-medium text-sm transition-all ${
                              newTime === slot
                                ? 'bg-gradient-to-r from-primary to-secondary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {formatTime(slot)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                        No available time slots for this date
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for rescheduling (optional)
                  </label>
                  <textarea
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    className="input"
                    rows={2}
                    placeholder="Let us know why you're rescheduling..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setNewDate('');
                    setNewTime('');
                    setRescheduleReason('');
                  }}
                  variant="secondary"
                  className="flex-1"
                  disabled={isRescheduling}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReschedule}
                  variant="primary"
                  className="flex-1"
                  disabled={isRescheduling || !newDate || !newTime}
                >
                  {isRescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
