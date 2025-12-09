import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { formatCurrency, formatTime, generateDateOptions } from '../../utils/helpers';
import { ChevronRight, ChevronLeft, Calendar, User, Clock, CheckCircle, CreditCard } from 'lucide-react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface ServiceGroup {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  professionals: Array<{
    serviceId: string;
    professionalId: string;
    name: string;
    avatarUrl: string | null;
    price: number;
  }>;
}

interface PublicProfile {
  id: string;
  name: string;
  businessName: string;
  slug: string;
}

export const BookingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<ServiceGroup | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<{
    serviceId: string;
    professionalId: string;
    name: string;
    avatarUrl: string | null;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Payment
  const [clientSecret, setClientSecret] = useState<string>('');
  const [appointmentId, setAppointmentId] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      try {
        const [profileRes, servicesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/public/${slug}`),
          axios.get(`${import.meta.env.VITE_API_URL}/public/${slug}/services`),
        ]);

        setProfile(profileRes.data);
        setServiceGroups(servicesRes.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Business not found or services unavailable');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!slug || !selectedProfessional || !selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/public/${slug}/available-slots`,
          {
            params: {
              serviceId: selectedProfessional.serviceId,
              professionalId: selectedProfessional.professionalId,
              date: selectedDate,
            },
          }
        );
        setAvailableSlots(response.data.slots);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load available slots');
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [slug, selectedProfessional, selectedDate]);

  const handleServiceSelect = (service: ServiceGroup) => {
    setSelectedService(service);
    setSelectedProfessional(null);
    setSelectedDate('');
    setSelectedTime('');
    setCurrentStep(2);
  };

  const handleProfessionalSelect = (professional: {
    serviceId: string;
    professionalId: string;
    name: string;
    avatarUrl: string | null;
  }) => {
    setSelectedProfessional(professional);
    setSelectedDate('');
    setSelectedTime('');
    setCurrentStep(3);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleCustomerInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!slug || !selectedProfessional || !selectedDate || !selectedTime) {
      setError('Please complete all booking steps');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/public/${slug}/book`,
        {
          serviceId: selectedProfessional.serviceId,
          professionalId: selectedProfessional.professionalId,
          date: selectedDate,
          time: selectedTime,
          customerName,
          customerEmail,
          customerPhone,
          notes,
        }
      );

      // Check if payment is required
      if (response.data.paymentRequired) {
        // Store appointment details and payment intent
        setAppointmentId(response.data.id);
        setClientSecret(response.data.clientSecret);
        setPaymentIntentId(response.data.stripePaymentIntentId);

        // Move to payment step
        setCurrentStep(4);
      } else {
        // No payment required - go directly to confirmation
        navigate(`/booking-confirmed/${response.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
            {profile?.businessName}
          </h1>
          <p className="text-lg text-gray-600">Book your appointment in easy steps</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 lg:gap-4 flex-wrap">
            {[
              { num: 1, label: 'Service', icon: <Calendar size={20} /> },
              { num: 2, label: 'Professional', icon: <User size={20} /> },
              { num: 3, label: 'Date & Time', icon: <Clock size={20} /> },
              { num: 4, label: 'Payment', icon: <CreditCard size={20} /> },
            ].map((step, idx) => (
              <React.Fragment key={step.num}>
                <div
                  className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-all ${
                    currentStep === step.num
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                      : currentStep > step.num
                      ? 'bg-success text-white'
                      : 'bg-white text-gray-400 border border-gray-200'
                  }`}
                >
                  {currentStep > step.num ? (
                    <CheckCircle size={20} />
                  ) : (
                    step.icon
                  )}
                  <span className="font-semibold text-sm lg:text-base">{step.label}</span>
                </div>
                {idx < 3 && (
                  <ChevronRight
                    size={24}
                    className={`hidden sm:block ${currentStep > step.num ? 'text-success' : 'text-gray-300'}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 text-danger-800 rounded-lg">
            {error}
          </div>
        )}

        {/* Step 1: Select Service */}
        {currentStep === 1 && (
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select a Service</h2>
            {serviceGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceGroups.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="text-left p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {service.name}
                      </h3>
                      <span className="text-2xl font-bold text-primary-600">
                        {formatCurrency(service.price)}
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {service.durationMinutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={16} />
                        {service.professionals.length} professional{service.professionals.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">No services available</p>
            )}
          </Card>
        )}

        {/* Step 2: Select Professional */}
        {currentStep === 2 && selectedService && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Select a Professional</h2>
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                <ChevronLeft size={20} />
                Change Service
              </button>
            </div>

            <div className="bg-primary-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-primary-700 font-medium">Selected Service:</p>
              <p className="text-lg font-bold text-primary-900">{selectedService.name}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedService.professionals.map((prof) => (
                <button
                  key={prof.professionalId}
                  onClick={() => handleProfessionalSelect(prof)}
                  className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all text-left"
                >
                  {prof.avatarUrl ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${prof.avatarUrl}`}
                      alt={prof.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center border-2 border-primary-200">
                      <span className="text-2xl font-bold text-primary-700">
                        {prof.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{prof.name}</h3>
                    <p className="text-sm text-gray-600">Professional Stylist</p>
                  </div>
                  <ChevronRight size={24} className="text-gray-400" />
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Step 3: Select Date & Time */}
        {currentStep === 3 && selectedProfessional && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Select Date & Time</h2>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <ChevronLeft size={20} />
                  Change Professional
                </button>
              </div>

              <div className="bg-primary-50 rounded-lg p-4 mb-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-primary-700 font-medium">Service:</p>
                  <p className="font-bold text-primary-900">{selectedService?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-primary-700 font-medium">Professional:</p>
                  <p className="font-bold text-primary-900">{selectedProfessional.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Date
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => handleDateSelect(e.target.value)}
                    className="input"
                  >
                    <option value="">Choose a date...</option>
                    {dateOptions.map((date) => (
                      <option key={date} value={date}>
                        {format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Time
                  </label>
                  {isLoadingSlots ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`p-3 rounded-lg font-medium transition-all ${
                            selectedTime === slot
                              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {formatTime(slot)}
                        </button>
                      ))}
                    </div>
                  ) : selectedDate ? (
                    <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                      No available time slots for this date
                    </p>
                  ) : (
                    <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                      Please select a date first
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Customer Information */}
            {selectedTime && (
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Information</h2>
                <form onSubmit={handleCustomerInfoSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      label="Full Name *"
                      placeholder="John Doe"
                      required
                    />

                    <Input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      label="Email *"
                      placeholder="john@example.com"
                      required
                    />

                    <Input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      label="Phone (optional)"
                      placeholder="555-0123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="input"
                      rows={3}
                      placeholder="Any special requests or notes..."
                    />
                  </div>

                  <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-3">Booking Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service:</span>
                        <span className="font-medium">{selectedService?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Professional:</span>
                        <span className="font-medium">{selectedProfessional.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{formatTime(selectedTime)}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-primary-200">
                        <span className="font-bold text-gray-900">Total:</span>
                        <span className="text-2xl font-bold text-primary-600">
                          {formatCurrency(selectedService?.price || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-4 text-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </span>
                    ) : (
                      'Continue to Payment'
                    )}
                  </Button>
                </form>
              </Card>
            )}
          </div>
        )}

        {/* Step 4: Payment */}
        {currentStep === 4 && clientSecret && (
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Payment</h2>

            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-3">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Professional:</span>
                  <span className="font-medium">{selectedProfessional?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{formatTime(selectedTime)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-primary-200">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(selectedService?.price || 0)}
                  </span>
                </div>
              </div>
            </div>

            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                appointmentId={appointmentId}
                paymentIntentId={paymentIntentId}
                onSuccess={() => navigate(`/booking-confirmed/${appointmentId}`)}
                onError={(error) => setError(error)}
              />
            </Elements>
          </Card>
        )}
      </div>
    </div>
  );
};

// Payment Form Component
interface PaymentFormProps {
  appointmentId: string;
  paymentIntentId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ appointmentId, paymentIntentId, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    onError('');

    try {
      // Confirm the payment
      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError(submitError.message || 'Payment submission failed');
        setIsProcessing(false);
        return;
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/booking-confirmed/' + appointmentId,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
      } else {
        // Payment succeeded - confirm with backend
        try {
          await axios.post(`${import.meta.env.VITE_API_URL}/public/confirm-payment`, {
            appointmentId,
            paymentIntentId,
          });
          onSuccess();
        } catch (err: any) {
          onError(err.response?.data?.error || 'Failed to confirm payment');
          setIsProcessing(false);
        }
      }
    } catch (err: any) {
      onError('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg">
        <PaymentElement />
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full py-4 text-lg"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Processing Payment...
          </span>
        ) : (
          'Pay Now'
        )}
      </Button>

      <p className="text-sm text-gray-500 text-center">
        Your payment is secured by Stripe. We never store your card information.
      </p>
    </form>
  );
};
