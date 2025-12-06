// User types
export interface User {
  id: string;
  email: string;
  name: string;
  businessName: string;
  slug: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Service types
export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  active: boolean;
  createdAt: string;
}

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

// Availability types
export interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface CreateAvailabilityDTO {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

// Appointment types
export interface Appointment {
  id: string;
  serviceId: string;
  service: Service;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface CreateAppointmentDTO {
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  time: string;
}

// Stats types
export interface AppointmentStats {
  appointmentsToday: number;
  appointmentsThisWeek: number;
  pendingAppointments: number;
  upcomingAppointments: Appointment[];
}

// Public types
export interface PublicProfile {
  id: string;
  name: string;
  businessName: string;
  slug: string;
}

export interface AvailableSlotsResponse {
  slots: string[];
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
  businessName: string;
  slug: string;
}

export interface BookingFormData {
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  time: string;
}
