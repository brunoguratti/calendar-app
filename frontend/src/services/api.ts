import axios from 'axios';
import type {
  AuthResponse,
  LoginFormData,
  RegisterFormData,
  Service,
  CreateServiceDTO,
  UpdateServiceDTO,
  Availability,
  CreateAvailabilityDTO,
  Appointment,
  AppointmentStats,
  PublicProfile,
  AvailableSlotsResponse,
  CreateAppointmentDTO,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginFormData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },
};

// Services API
export const servicesAPI = {
  getAll: async (): Promise<Service[]> => {
    const response = await api.get<Service[]>('/services');
    return response.data;
  },

  create: async (data: CreateServiceDTO): Promise<Service> => {
    const response = await api.post<Service>('/services', data);
    return response.data;
  },

  update: async (id: string, data: UpdateServiceDTO): Promise<Service> => {
    const response = await api.put<Service>(`/services/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/services/${id}`);
  },
};

// Availability API
export const availabilityAPI = {
  getAll: async (): Promise<Availability[]> => {
    const response = await api.get<Availability[]>('/availability');
    return response.data;
  },

  create: async (data: CreateAvailabilityDTO): Promise<Availability> => {
    const response = await api.post<Availability>('/availability', data);
    return response.data;
  },

  update: async (id: string, data: CreateAvailabilityDTO): Promise<Availability> => {
    const response = await api.put<Availability>(`/availability/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/availability/${id}`);
  },
};

// Appointments API
export const appointmentsAPI = {
  getAll: async (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Appointment[]> => {
    const response = await api.get<Appointment[]>('/appointments', { params });
    return response.data;
  },

  updateStatus: async (
    id: string,
    status: 'pending' | 'confirmed' | 'cancelled'
  ): Promise<Appointment> => {
    const response = await api.put<Appointment>(`/appointments/${id}/status`, {
      status,
    });
    return response.data;
  },

  getStats: async (): Promise<AppointmentStats> => {
    const response = await api.get<AppointmentStats>('/appointments/stats');
    return response.data;
  },
};

// Public API
export const publicAPI = {
  getProfile: async (slug: string): Promise<PublicProfile> => {
    const response = await api.get<PublicProfile>(`/public/${slug}`);
    return response.data;
  },

  getServices: async (slug: string): Promise<Service[]> => {
    const response = await api.get<Service[]>(`/public/${slug}/services`);
    return response.data;
  },

  getAvailableSlots: async (
    slug: string,
    date: string,
    serviceId: string
  ): Promise<AvailableSlotsResponse> => {
    const response = await api.get<AvailableSlotsResponse>(
      `/public/${slug}/available-slots`,
      {
        params: { date, serviceId },
      }
    );
    return response.data;
  },

  createAppointment: async (
    slug: string,
    data: CreateAppointmentDTO
  ): Promise<Appointment> => {
    const response = await api.post<Appointment>(`/public/${slug}/book`, data);
    return response.data;
  },
};
