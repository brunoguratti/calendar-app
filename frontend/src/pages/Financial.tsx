import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Download, TrendingUp, DollarSign, Calendar, User } from 'lucide-react';
import axios from 'axios';

interface RevenueSummary {
  totalRevenue: number;
  totalAppointments: number;
  averageRevenuePerAppointment: number;
  revenueByProfessional: Array<{
    professionalId: string;
    name: string;
    revenue: number;
    count: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
}

interface ProfessionalRevenue {
  professional: {
    id: string;
    name: string;
  };
  totalRevenue: number;
  totalAppointments: number;
  averageRevenuePerAppointment: number;
  revenueByService: Array<{
    serviceName: string;
    revenue: number;
    count: number;
  }>;
  recentAppointments: Array<{
    id: string;
    date: string;
    time: string;
    customerName: string;
    serviceName: string;
    amount: number;
  }>;
}

export default function Financial() {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
  const [professionalRevenue, setProfessionalRevenue] = useState<ProfessionalRevenue | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRevenueSummary();
  }, [startDate, endDate]);

  useEffect(() => {
    if (selectedProfessionalId) {
      fetchProfessionalRevenue(selectedProfessionalId);
    } else {
      setProfessionalRevenue(null);
    }
  }, [selectedProfessionalId, startDate, endDate]);

  const fetchRevenueSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/financial/revenue/summary?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSummary(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load revenue summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionalRevenue = async (professionalId: string) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/financial/revenue/professional/${professionalId}?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfessionalRevenue(response.data);
    } catch (err: any) {
      console.error('Failed to load professional revenue:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedProfessionalId) params.append('professionalId', selectedProfessionalId);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/financial/revenue/export?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `revenue-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert('Failed to export data');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <DollarSign className="text-primary" />
              Financial Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Track revenue and financial performance</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="btn-primary flex items-center gap-2"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional
              </label>
              <select
                value={selectedProfessionalId}
                onChange={(e) => setSelectedProfessionalId(e.target.value)}
                className="input"
              >
                <option value="">All Professionals</option>
                {summary?.revenueByProfessional.map((prof) => (
                  <option key={prof.professionalId} value={prof.professionalId}>
                    {prof.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-700">Total Revenue</p>
                    <p className="text-3xl font-bold text-primary-900 mt-2">
                      {formatCurrency(summary.totalRevenue)}
                    </p>
                  </div>
                  <TrendingUp className="text-primary-500" size={40} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-6 border border-secondary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-700">Total Bookings</p>
                    <p className="text-3xl font-bold text-secondary-900 mt-2">
                      {summary.totalAppointments}
                    </p>
                  </div>
                  <Calendar className="text-secondary-500" size={40} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-6 border border-accent-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-accent-700">Avg per Booking</p>
                    <p className="text-3xl font-bold text-accent-900 mt-2">
                      {formatCurrency(summary.averageRevenuePerAppointment)}
                    </p>
                  </div>
                  <DollarSign className="text-accent-500" size={40} />
                </div>
              </div>
            </div>

            {/* Revenue by Professional */}
            {!selectedProfessionalId && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User size={20} />
                  Revenue by Professional
                </h3>
                <div className="space-y-4">
                  {summary.revenueByProfessional.map((prof) => (
                    <div
                      key={prof.professionalId}
                      className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors cursor-pointer"
                      onClick={() => setSelectedProfessionalId(prof.professionalId)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{prof.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {prof.count} booking{prof.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary-600">
                            {formatCurrency(prof.revenue)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatCurrency(prof.revenue / prof.count)} avg
                          </p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-4 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all"
                          style={{
                            width: `${(prof.revenue / summary.totalRevenue) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revenue by Month Chart */}
            {summary.revenueByMonth.length > 0 && !selectedProfessionalId && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Monthly Revenue Trend
                </h3>
                <div className="space-y-3">
                  {summary.revenueByMonth.map((item) => {
                    const maxRevenue = Math.max(...summary.revenueByMonth.map(m => m.revenue));
                    const percentage = (item.revenue / maxRevenue) * 100;

                    return (
                      <div key={item.month} className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-600 w-24">
                          {new Date(item.month + '-01').toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary to-secondary h-8 rounded-full flex items-center justify-end pr-3 transition-all"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-white text-sm font-semibold">
                              {formatCurrency(item.revenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Professional Detail View */}
        {professionalRevenue && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-600 rounded-xl p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{professionalRevenue.professional.name}</h2>
                  <p className="text-primary-100 mt-1">Detailed Revenue Report</p>
                </div>
                <button
                  onClick={() => setSelectedProfessionalId('')}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  ← Back to All
                </button>
              </div>
            </div>

            {/* Professional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-primary-600 mt-2">
                  {formatCurrency(professionalRevenue.totalRevenue)}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-secondary-600 mt-2">
                  {professionalRevenue.totalAppointments}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600">Average per Booking</p>
                <p className="text-3xl font-bold text-accent-600 mt-2">
                  {formatCurrency(professionalRevenue.averageRevenuePerAppointment)}
                </p>
              </div>
            </div>

            {/* Revenue by Service */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Service</h3>
              <div className="space-y-3">
                {professionalRevenue.revenueByService.map((service) => (
                  <div key={service.serviceName} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{service.serviceName}</h4>
                      <p className="text-sm text-gray-600">{service.count} booking{service.count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary-600">
                        {formatCurrency(service.revenue)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(service.revenue / service.count)} avg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Appointments */}
            {professionalRevenue.recentAppointments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Appointments</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Service</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {professionalRevenue.recentAppointments.map((appt) => (
                        <tr key={appt.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900">{formatDate(appt.date)}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">{appt.time}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">{appt.customerName}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{appt.serviceName}</td>
                          <td className="py-3 px-4 text-sm text-right font-semibold text-primary-600">
                            {formatCurrency(appt.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
