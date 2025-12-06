import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { appointmentsAPI } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import {
  formatDate,
  formatTime,
  getStatusColor,
  getStatusBadge,
} from '../../utils/helpers';
import type { Appointment } from '../../types';

const locales = {
  'en-US': undefined,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

export const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchAppointments = async () => {
    try {
      const data = await appointmentsAPI.getAll();
      setAppointments(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (
    id: string,
    status: 'confirmed' | 'cancelled'
  ) => {
    try {
      await appointmentsAPI.updateStatus(id, status);
      fetchAppointments();
      setSelectedAppointment(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update appointment');
    }
  };

  // Convert appointments to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return appointments.map((appointment) => {
      const [hours, minutes] = appointment.time.split(':').map(Number);
      const start = new Date(appointment.date);
      start.setHours(hours, minutes, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + appointment.service.durationMinutes);

      return {
        id: appointment.id,
        title: `${appointment.customerName} - ${appointment.service.name}`,
        start,
        end,
        resource: appointment,
      };
    });
  }, [appointments]);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    if (statusFilter === 'all') return appointments;
    return appointments.filter((apt) => apt.status === statusFilter);
  }, [appointments, statusFilter]);

  if (isLoading) return <Loading />;

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Appointments</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Calendar View */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Calendar View</h2>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={(event) =>
                setSelectedAppointment(event.resource)
              }
              eventPropGetter={(event) => {
                const status = event.resource.status;
                let backgroundColor = '#0ea5e9';
                if (status === 'confirmed') backgroundColor = '#10b981';
                if (status === 'cancelled') backgroundColor = '#ef4444';
                if (status === 'pending') backgroundColor = '#f59e0b';

                return {
                  style: {
                    backgroundColor,
                    borderRadius: '5px',
                    border: 'none',
                    color: 'white',
                  },
                };
              }}
            />
          </div>
        </Card>

        {/* Selected Appointment Details */}
        {selectedAppointment && (
          <Card className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Appointment Details</h2>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer</p>
                <p className="text-lg font-semibold">{selectedAppointment.customerName}</p>
                <p className="text-sm text-gray-600">{selectedAppointment.customerEmail}</p>
                {selectedAppointment.customerPhone && (
                  <p className="text-sm text-gray-600">
                    {selectedAppointment.customerPhone}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Service</p>
                <p className="text-lg">{selectedAppointment.service.name}</p>
                <p className="text-sm text-gray-600">
                  {selectedAppointment.service.durationMinutes} minutes - $
                  {selectedAppointment.service.price}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">
                  Date & Time
                </p>
                <p className="text-lg">
                  {formatDate(selectedAppointment.date)} at{' '}
                  {formatTime(selectedAppointment.time)}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    selectedAppointment.status
                  )}`}
                >
                  {getStatusBadge(selectedAppointment.status)}
                </span>
              </div>

              {selectedAppointment.status === 'pending' && (
                <div className="flex space-x-4 pt-4">
                  <Button
                    onClick={() =>
                      handleUpdateStatus(selectedAppointment.id, 'confirmed')
                    }
                    variant="primary"
                  >
                    Confirm
                  </Button>
                  <Button
                    onClick={() =>
                      handleUpdateStatus(selectedAppointment.id, 'cancelled')
                    }
                    variant="danger"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* List View */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">All Appointments</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="space-y-4">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  onClick={() => setSelectedAppointment(appointment)}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {appointment.customerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {appointment.service.name} -{' '}
                      {formatDate(appointment.date)} at{' '}
                      {formatTime(appointment.time)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      appointment.status
                    )}`}
                  >
                    {getStatusBadge(appointment.status)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                No appointments found
              </p>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
