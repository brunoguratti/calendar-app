import { Request, Response } from 'express';
import { createAppointmentSchema, availableSlotsQuerySchema } from '../utils/validation';
import prisma from '../utils/prisma';
import {
  generateTimeSlots,
  filterSlotsByDuration,
  hasAppointmentConflict,
  getDayOfWeek,
  isPastDateTime
} from '../utils/slots';

export const getPublicProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const user = await prisma.user.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        businessName: true,
        slug: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    throw error;
  }
};

export const getPublicServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const user = await prisma.user.findUnique({
      where: { slug }
    });

    if (!user) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }

    const services = await prisma.service.findMany({
      where: {
        userId: user.id,
        active: true
      },
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        price: true
      }
    });

    res.status(200).json(services);
  } catch (error) {
    throw error;
  }
};

export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const validatedQuery = availableSlotsQuerySchema.parse(req.query);

    // Check if date is in the past
    if (isPastDateTime(validatedQuery.date)) {
      res.status(400).json({ error: 'Cannot book appointments in the past' });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { slug }
    });

    if (!user) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }

    // Find service
    const service = await prisma.service.findFirst({
      where: {
        id: validatedQuery.serviceId,
        userId: user.id,
        active: true
      }
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    // Get day of week for the requested date
    const dayOfWeek = getDayOfWeek(validatedQuery.date);

    // Find availability for this day
    const availability = await prisma.availability.findFirst({
      where: {
        userId: user.id,
        dayOfWeek,
        active: true
      }
    });

    if (!availability) {
      res.status(200).json({ slots: [] });
      return;
    }

    // Generate all possible time slots
    let slots = generateTimeSlots(availability.startTime, availability.endTime);

    // Filter slots that can accommodate the service duration
    slots = filterSlotsByDuration(slots, service.durationMinutes, availability.endTime);

    // Get existing appointments for this date
    const dateObj = new Date(validatedQuery.date + 'T00:00:00');
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        userId: user.id,
        date: {
          gte: dateObj,
          lt: nextDay
        },
        status: {
          in: ['pending', 'confirmed']
        }
      },
      include: {
        service: {
          select: {
            durationMinutes: true
          }
        }
      }
    });

    // Filter out slots that conflict with existing appointments
    const availableSlots = slots.filter(slot => {
      // Check if this is a past time slot for today
      if (isPastDateTime(validatedQuery.date, slot)) {
        return false;
      }

      // Check for conflicts with existing appointments
      return !hasAppointmentConflict(slot, service.durationMinutes, existingAppointments);
    });

    res.status(200).json({ slots: availableSlots });
  } catch (error) {
    throw error;
  }
};

export const createPublicAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const validatedData = createAppointmentSchema.parse(req.body);

    // Check if date/time is in the past
    if (isPastDateTime(validatedData.date, validatedData.time)) {
      res.status(400).json({ error: 'Cannot book appointments in the past' });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { slug }
    });

    if (!user) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }

    // Find service
    const service = await prisma.service.findFirst({
      where: {
        id: validatedData.serviceId,
        userId: user.id,
        active: true
      }
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    // Check if the time slot is available
    const dayOfWeek = getDayOfWeek(validatedData.date);
    const availability = await prisma.availability.findFirst({
      where: {
        userId: user.id,
        dayOfWeek,
        active: true
      }
    });

    if (!availability) {
      res.status(400).json({ error: 'Professional is not available on this day' });
      return;
    }

    // Check if time is within availability hours
    if (validatedData.time < availability.startTime || validatedData.time >= availability.endTime) {
      res.status(400).json({ error: 'Selected time is outside of available hours' });
      return;
    }

    // Check for conflicts with existing appointments
    const dateObj = new Date(validatedData.date + 'T00:00:00');
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        userId: user.id,
        date: {
          gte: dateObj,
          lt: nextDay
        },
        status: {
          in: ['pending', 'confirmed']
        }
      },
      include: {
        service: {
          select: {
            durationMinutes: true
          }
        }
      }
    });

    if (hasAppointmentConflict(validatedData.time, service.durationMinutes, existingAppointments)) {
      res.status(400).json({ error: 'This time slot is no longer available' });
      return;
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        serviceId: validatedData.serviceId,
        userId: user.id,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        customerPhone: validatedData.customerPhone,
        date: dateObj,
        time: validatedData.time,
        status: 'pending'
      },
      include: {
        service: true,
        user: {
          select: {
            name: true,
            businessName: true,
            email: true
          }
        }
      }
    });

    // TODO: Send confirmation email here
    console.log('TODO: Send confirmation email to', validatedData.customerEmail);

    res.status(201).json(appointment);
  } catch (error) {
    throw error;
  }
};
