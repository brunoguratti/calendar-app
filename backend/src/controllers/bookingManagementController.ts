import { Request, Response } from 'express';
import prisma from '../utils/prisma';

/**
 * Get appointment details by management token (no auth required)
 */
export const getAppointmentByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { managementToken: token },
      include: {
        service: {
          select: {
            name: true,
            description: true,
            price: true,
            durationMinutes: true,
          }
        },
        professional: {
          select: {
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
          include: {
            user: {
              select: {
                businessName: true,
                cancellationHours: true,
              }
            }
          }
        },
        room: {
          select: {
            name: true,
          }
        }
      }
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    // Check if appointment can be modified/cancelled based on cancellation policy
    const cancellationHours = appointment.professional.user.cancellationHours;
    const appointmentDateTime = new Date(appointment.date);
    appointmentDateTime.setHours(parseInt(appointment.time.split(':')[0]));
    appointmentDateTime.setMinutes(parseInt(appointment.time.split(':')[1]));

    const hoursUntilAppointment = (appointmentDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    const canModify = hoursUntilAppointment >= cancellationHours;

    res.status(200).json({
      appointment: {
        id: appointment.id,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        customerPhone: appointment.customerPhone,
        notes: appointment.notes,
        paymentStatus: appointment.paymentStatus,
        paymentAmount: appointment.paymentAmount,
        service: appointment.service,
        professional: {
          name: appointment.professional.name,
          avatarUrl: appointment.professional.avatarUrl,
        },
        room: appointment.room,
        businessName: appointment.professional.user.businessName,
      },
      canModify,
      cancellationPolicy: {
        hours: cancellationHours,
        hoursUntilAppointment: Math.round(hoursUntilAppointment * 10) / 10,
      }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Cancel appointment by management token
 */
export const cancelAppointmentByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { cancellationReason } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { managementToken: token },
      include: {
        professional: {
          include: {
            user: {
              select: {
                cancellationHours: true,
              }
            }
          }
        }
      }
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    // Check if already cancelled
    if (appointment.status === 'cancelled') {
      res.status(400).json({ error: 'Appointment is already cancelled' });
      return;
    }

    // Check cancellation policy
    const cancellationHours = appointment.professional.user.cancellationHours;
    const appointmentDateTime = new Date(appointment.date);
    appointmentDateTime.setHours(parseInt(appointment.time.split(':')[0]));
    appointmentDateTime.setMinutes(parseInt(appointment.time.split(':')[1]));

    const hoursUntilAppointment = (appointmentDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < cancellationHours) {
      res.status(400).json({
        error: `Cannot cancel appointment. Cancellation must be made at least ${cancellationHours} hours in advance.`,
        hoursUntilAppointment: Math.round(hoursUntilAppointment * 10) / 10,
        requiredHours: cancellationHours
      });
      return;
    }

    // Cancel appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { managementToken: token },
      data: {
        status: 'cancelled',
        cancellationReason: cancellationReason || 'Cancelled by customer'
      }
    });

    res.status(200).json({
      message: 'Appointment cancelled successfully',
      appointment: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
        cancellationReason: updatedAppointment.cancellationReason,
      }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Request appointment reschedule by management token
 */
export const requestReschedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { requestedDate, requestedTime, reason } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { managementToken: token },
      include: {
        professional: {
          include: {
            user: {
              select: {
                cancellationHours: true,
                autoApproveBookings: true,
              }
            }
          }
        }
      }
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    // Check if already cancelled
    if (appointment.status === 'cancelled') {
      res.status(400).json({ error: 'Cannot reschedule a cancelled appointment' });
      return;
    }

    // Check cancellation policy for modification
    const cancellationHours = appointment.professional.user.cancellationHours;
    const appointmentDateTime = new Date(appointment.date);
    appointmentDateTime.setHours(parseInt(appointment.time.split(':')[0]));
    appointmentDateTime.setMinutes(parseInt(appointment.time.split(':')[1]));

    const hoursUntilAppointment = (appointmentDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < cancellationHours) {
      res.status(400).json({
        error: `Cannot reschedule appointment. Changes must be made at least ${cancellationHours} hours in advance.`,
        hoursUntilAppointment: Math.round(hoursUntilAppointment * 10) / 10,
        requiredHours: cancellationHours
      });
      return;
    }

    // Update appointment with reschedule request
    // Note: In a real system, this might create a reschedule request that requires admin approval
    // For now, we'll update it directly if auto-approve is on, otherwise mark as pending
    const updatedAppointment = await prisma.appointment.update({
      where: { managementToken: token },
      data: {
        date: new Date(requestedDate),
        time: requestedTime,
        status: appointment.professional.user.autoApproveBookings ? 'confirmed' : 'pending',
        notes: `${appointment.notes || ''}\nReschedule request: ${reason || 'No reason provided'}`
      },
      include: {
        service: true,
        professional: {
          select: {
            name: true,
          }
        }
      }
    });

    res.status(200).json({
      message: appointment.professional.user.autoApproveBookings
        ? 'Appointment rescheduled successfully'
        : 'Reschedule request submitted for approval',
      appointment: {
        id: updatedAppointment.id,
        date: updatedAppointment.date,
        time: updatedAppointment.time,
        status: updatedAppointment.status,
      }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get available time slots for rescheduling
 */
export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { date } = req.query;

    if (!date) {
      res.status(400).json({ error: 'Date parameter is required' });
      return;
    }

    const appointment = await prisma.appointment.findUnique({
      where: { managementToken: token },
      include: {
        service: {
          select: {
            durationMinutes: true,
          }
        },
        professional: {
          select: {
            id: true,
          }
        }
      }
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    const requestedDate = new Date(date as string);
    const dayOfWeek = requestedDate.getDay() === 0 ? 7 : requestedDate.getDay();

    // Get professional's availability for this day
    const availability = await prisma.availability.findFirst({
      where: {
        professionalId: appointment.professional.id,
        dayOfWeek,
        active: true,
      }
    });

    if (!availability) {
      res.status(200).json({ availableSlots: [] });
      return;
    }

    // Get existing appointments for this professional on this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        professionalId: appointment.professional.id,
        date: requestedDate,
        status: { in: ['pending', 'confirmed'] },
        id: { not: appointment.id } // Exclude current appointment
      },
      select: {
        time: true,
        service: {
          select: {
            durationMinutes: true,
          }
        }
      }
    });

    // Generate time slots
    const slots: string[] = [];
    const [startHour, startMinute] = availability.startTime.split(':').map(Number);
    const [endHour, endMinute] = availability.endTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const serviceDuration = appointment.service.durationMinutes;

    while (currentMinutes + serviceDuration <= endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      const timeSlot = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

      // Check if slot conflicts with existing appointments
      const hasConflict = existingAppointments.some(existing => {
        const [existingHour, existingMinute] = existing.time.split(':').map(Number);
        const existingStart = existingHour * 60 + existingMinute;
        const existingEnd = existingStart + existing.service.durationMinutes;
        const slotEnd = currentMinutes + serviceDuration;

        return (currentMinutes < existingEnd && slotEnd > existingStart);
      });

      if (!hasConflict) {
        slots.push(timeSlot);
      }

      currentMinutes += 30; // 30-minute intervals
    }

    res.status(200).json({ availableSlots: slots });
  } catch (error) {
    throw error;
  }
};
