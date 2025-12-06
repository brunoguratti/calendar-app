import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  businessName: z.string().min(1, 'Business name is required'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    ),
});

// Service validation schemas
export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  durationMinutes: z
    .number()
    .int()
    .min(15, 'Duration must be at least 15 minutes'),
  price: z.number().min(0, 'Price must be positive'),
});

// Availability validation schemas
export const createAvailabilitySchema = z
  .object({
    dayOfWeek: z
      .number()
      .int()
      .min(0)
      .max(6, 'Day of week must be between 0 (Sunday) and 6 (Saturday)'),
    startTime: z
      .string()
      .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:mm'),
    endTime: z
      .string()
      .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:mm'),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

// Booking validation schemas
export const bookingSchema = z.object({
  serviceId: z.string().min(1, 'Please select a service'),
  customerName: z.string().min(1, 'Name is required'),
  customerEmail: z.string().email('Invalid email format'),
  customerPhone: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
});
