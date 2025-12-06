import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsAPI } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { formatDateTime, getStatusColor, getStatusBadge } from '../../utils/helpers';
import type { AppointmentStats } from '../../types';

export const DashboardHomePage: React.FC = () => {
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await appointmentsAPI.getStats();
        setStats(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) return <Loading />;

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Appointments Today
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.appointmentsToday || 0}
                </p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  This Week
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.appointmentsThisWeek || 0}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Approval
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.pendingAppointments || 0}
                </p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Upcoming Appointments
            </h2>
            <Link
              to="/dashboard/appointments"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>

          {stats?.upcomingAppointments && stats.upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {stats.upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {appointment.customerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {appointment.service.name} -{' '}
                      {formatDateTime(appointment.date, appointment.time)}
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
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No upcoming appointments
            </p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};
