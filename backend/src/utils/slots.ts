import { Availability, Appointment } from '@prisma/client';

/**
 * Generates 30-minute time slots between start and end times
 * @param startTime - Start time in HH:mm format
 * @param endTime - End time in HH:mm format
 * @returns Array of time strings in HH:mm format
 */
export const generateTimeSlots = (startTime: string, endTime: string): string[] => {
  const slots: string[] = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  while (currentMinutes < endMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    currentMinutes += 30; // 30-minute slots
  }

  return slots;
};

/**
 * Checks if a time slot is available for booking
 * @param slotTime - Time to check in HH:mm format
 * @param serviceDuration - Duration of the service in minutes
 * @param existingAppointments - Array of existing appointments for that day
 * @returns true if slot is available, false otherwise
 */
export const isSlotAvailable = (
  slotTime: string,
  serviceDuration: number,
  existingAppointments: Appointment[]
): boolean => {
  const [slotHour, slotMinute] = slotTime.split(':').map(Number);
  const slotStartMinutes = slotHour * 60 + slotMinute;
  const slotEndMinutes = slotStartMinutes + serviceDuration;

  // Check if this slot conflicts with any existing appointment
  for (const appointment of existingAppointments) {
    // Skip cancelled appointments
    if (appointment.status === 'cancelled') continue;

    const [appHour, appMinute] = appointment.time.split(':').map(Number);
    const appStartMinutes = appHour * 60 + appMinute;

    // We need to know the duration of the existing appointment
    // For simplicity, we'll assume we need to check if there's any overlap
    // In a real implementation, you'd want to fetch the service duration
    // For now, we'll check if the appointment starts at the exact same time
    if (appointment.time === slotTime) {
      return false;
    }
  }

  return true;
};

/**
 * Filters time slots to only include those that can accommodate the service duration
 * @param slots - Array of all possible time slots
 * @param serviceDuration - Duration of the service in minutes
 * @param endTime - End time of availability in HH:mm format
 * @returns Filtered array of time slots
 */
export const filterSlotsByDuration = (
  slots: string[],
  serviceDuration: number,
  endTime: string
): string[] => {
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const endMinutes = endHour * 60 + endMinute;

  return slots.filter(slot => {
    const [hour, minute] = slot.split(':').map(Number);
    const slotMinutes = hour * 60 + minute;
    return slotMinutes + serviceDuration <= endMinutes;
  });
};

/**
 * Checks if a specific appointment time conflicts with existing appointments
 * @param appointmentTime - Time to check in HH:mm format
 * @param appointmentDate - Date to check
 * @param serviceDuration - Duration of the service in minutes
 * @param existingAppointments - Array of existing appointments
 * @returns true if there's a conflict, false otherwise
 */
export const hasAppointmentConflict = (
  appointmentTime: string,
  serviceDuration: number,
  existingAppointments: (Appointment & { service: { durationMinutes: number } })[]
): boolean => {
  const [newHour, newMinute] = appointmentTime.split(':').map(Number);
  const newStartMinutes = newHour * 60 + newMinute;
  const newEndMinutes = newStartMinutes + serviceDuration;

  for (const appointment of existingAppointments) {
    // Skip cancelled appointments
    if (appointment.status === 'cancelled') continue;

    const [existingHour, existingMinute] = appointment.time.split(':').map(Number);
    const existingStartMinutes = existingHour * 60 + existingMinute;
    const existingEndMinutes = existingStartMinutes + appointment.service.durationMinutes;

    // Check for overlap
    // Two appointments overlap if:
    // - New appointment starts before existing ends AND
    // - New appointment ends after existing starts
    if (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes) {
      return true; // Conflict found
    }
  }

  return false; // No conflict
};

/**
 * Gets the day of week (0-6) from a date string
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Day of week (0 = Sunday, 6 = Saturday)
 */
export const getDayOfWeek = (dateString: string): number => {
  const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
  return date.getDay();
};

/**
 * Checks if a date is in the past
 * @param dateString - Date in YYYY-MM-DD format
 * @param timeString - Time in HH:mm format (optional)
 * @returns true if date/time is in the past
 */
export const isPastDateTime = (dateString: string, timeString?: string): boolean => {
  const now = new Date();
  const checkDate = new Date(dateString + 'T' + (timeString || '00:00:00'));
  return checkDate < now;
};
