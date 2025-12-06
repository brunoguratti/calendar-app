import { Request } from 'express';

// Extend Express Request to include authenticated user
export interface AuthRequest extends Request {
  userId?: string;
}

// Auth DTOs
export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  businessName: string;
  slug: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

// Service DTOs
export interface CreateServiceDTO {
  name: string;
  durationMinutes: number;
  price: number;
}

export interface UpdateServiceDTO {
  name?: string;
  durationMinutes?: number;
  price?: number;
  active?: boolean;
}

// Availability DTOs
export interface CreateAvailabilityDTO {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

// Appointment DTOs
export interface CreateAppointmentDTO {
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  time: string;
}

export interface UpdateAppointmentStatusDTO {
  status: 'pending' | 'confirmed' | 'cancelled';
}

// Response types
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    businessName: string;
    slug: string;
  };
}

export interface AvailableSlot {
  time: string;
  available: boolean;
}
