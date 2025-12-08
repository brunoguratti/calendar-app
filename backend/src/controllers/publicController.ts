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
import {
  sendAppointmentConfirmationEmail,
  sendAppointmentNotificationToProfessional
} from '../utils/email';
import { createPaymentIntent, retrievePaymentIntent } from '../utils/stripe';

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
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    // Get all active services from professionals belonging to this business
    const services = await prisma.service.findMany({
      where: {
        professional: {
          userId: user.id,
          active: true
        },
        active: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        price: true,
        professional: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Group services by service name (for services offered by multiple professionals)
    const serviceGroups: { [key: string]: any } = {};
    services.forEach(service => {
      const key = `${service.name}-${service.price}`;
      if (!serviceGroups[key]) {
        serviceGroups[key] = {
          id: service.id, // Use first service ID as default
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          price: service.price,
          professionals: []
        };
      }
      serviceGroups[key].professionals.push({
        serviceId: service.id,
        professionalId: service.professional.id,
        name: service.professional.name,
        avatarUrl: service.professional.avatarUrl,
        price: service.price
      });
    });

    res.status(200).json(Object.values(serviceGroups));
  } catch (error) {
    throw error;
  }
};

export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const { serviceId, professionalId, date } = req.query;

    if (!serviceId || !professionalId || !date) {
      res.status(400).json({ error: 'serviceId, professionalId, and date are required' });
      return;
    }

    // Check if date is in the past
    if (isPastDateTime(date as string)) {
      res.status(400).json({ error: 'Cannot book appointments in the past' });
      return;
    }

    // Find user (business)
    const user = await prisma.user.findUnique({
      where: { slug }
    });

    if (!user) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    // Find service and verify it belongs to the professional
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId as string,
        professionalId: professionalId as string,
        professional: {
          userId: user.id,
          active: true
        },
        active: true
      },
      include: {
        rooms: {
          include: {
            room: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    // Get day of week for the requested date
    const dayOfWeek = getDayOfWeek(date as string);

    // Find availability for this professional on this day
    const availability = await prisma.availability.findFirst({
      where: {
        professionalId: professionalId as string,
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

    // Get existing appointments for this professional on this date
    const dateObj = new Date(date as string + 'T00:00:00');
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        professionalId: professionalId as string,
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

    // Get room assignments for this service
    const roomIds = service.rooms.map(sr => sr.room.id);

    // Get existing appointments in these rooms
    const roomAppointments = await prisma.appointment.findMany({
      where: {
        roomId: { in: roomIds },
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

    // Filter out slots that conflict with professional's appointments or room availability
    const availableSlots = slots.filter(slot => {
      // Check if this is a past time slot for today
      if (isPastDateTime(date as string, slot)) {
        return false;
      }

      // Check for conflicts with professional's existing appointments
      if (hasAppointmentConflict(slot, service.durationMinutes, existingAppointments)) {
        return false;
      }

      // Check if at least one room is available
      const hasAvailableRoom = roomIds.length === 0 || roomIds.some(roomId => {
        const roomApptsForRoom = roomAppointments.filter(apt => apt.roomId === roomId);
        return !hasAppointmentConflict(slot, service.durationMinutes, roomApptsForRoom);
      });

      return hasAvailableRoom;
    });

    res.status(200).json({ slots: availableSlots });
  } catch (error) {
    throw error;
  }
};

export const createPublicAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const { serviceId, professionalId, date, time, customerName, customerEmail, customerPhone, notes } = req.body;

    if (!serviceId || !professionalId || !date || !time || !customerName || !customerEmail) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Check if date/time is in the past
    if (isPastDateTime(date, time)) {
      res.status(400).json({ error: 'Cannot book appointments in the past' });
      return;
    }

    // Find user (business)
    const user = await prisma.user.findUnique({
      where: { slug }
    });

    if (!user) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    // Find service and verify it belongs to the professional
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        professionalId,
        professional: {
          userId: user.id,
          active: true
        },
        active: true
      },
      include: {
        professional: {
          include: {
            user: {
              select: {
                autoApproveBookings: true,
                businessName: true,
              }
            }
          }
        },
        rooms: {
          include: {
            room: true
          }
        }
      }
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    // Check if the time slot is available
    const dayOfWeek = getDayOfWeek(date);
    const availability = await prisma.availability.findFirst({
      where: {
        professionalId,
        dayOfWeek,
        active: true
      }
    });

    if (!availability) {
      res.status(400).json({ error: 'Professional is not available on this day' });
      return;
    }

    // Check if time is within availability hours
    if (time < availability.startTime || time >= availability.endTime) {
      res.status(400).json({ error: 'Selected time is outside of available hours' });
      return;
    }

    // Check for conflicts with existing appointments for this professional
    const dateObj = new Date(date + 'T00:00:00');
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        professionalId,
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

    if (hasAppointmentConflict(time, service.durationMinutes, existingAppointments)) {
      res.status(400).json({ error: 'This time slot is no longer available' });
      return;
    }

    // Find an available room for this service
    const roomIds = service.rooms.map(sr => sr.room.id);
    let assignedRoomId: string | null = null;

    if (roomIds.length > 0) {
      // Get existing appointments in these rooms
      const roomAppointments = await prisma.appointment.findMany({
        where: {
          roomId: { in: roomIds },
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

      // Find the first available room
      for (const roomId of roomIds) {
        const roomApptsForRoom = roomAppointments.filter(apt => apt.roomId === roomId);
        if (!hasAppointmentConflict(time, service.durationMinutes, roomApptsForRoom)) {
          assignedRoomId = roomId;
          break;
        }
      }

      if (!assignedRoomId) {
        res.status(400).json({ error: 'No rooms available for this time slot' });
        return;
      }
    }

    // Determine status based on auto-approve setting
    const status = service.professional.user.autoApproveBookings ? 'confirmed' : 'pending';

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        serviceId,
        professionalId,
        roomId: assignedRoomId,
        customerName,
        customerEmail,
        customerPhone,
        date: dateObj,
        time,
        status: 'pending', // Will be confirmed after payment
        notes,
        paymentStatus: 'unpaid', // Will be updated after payment
        paymentAmount: service.price,
      },
      include: {
        service: {
          select: {
            name: true,
            price: true,
            durationMinutes: true,
          }
        },
        professional: {
          select: {
            name: true,
            email: true,
          },
          include: {
            user: {
              select: {
                businessName: true,
                email: true,
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

    // Create Stripe payment intent
    const paymentIntent = await createPaymentIntent(
      service.price,
      'usd',
      {
        appointmentId: appointment.id,
        customerEmail: appointment.customerEmail,
        customerName: appointment.customerName,
        serviceName: service.name,
      }
    );

    // Update appointment with payment intent ID
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { stripePaymentIntentId: paymentIntent.id }
    });

    // Note: We'll send confirmation emails after payment is confirmed
    // For now, just return the appointment with payment client secret

    res.status(201).json({
      ...appointment,
      clientSecret: paymentIntent.client_secret,
      managementUrl: `/manage/${appointment.managementToken}`
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Confirm payment and finalize appointment
 */
export const confirmAppointmentPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId, paymentIntentId } = req.body;

    if (!appointmentId || !paymentIntentId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Find the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        service: {
          select: {
            name: true,
            price: true,
            durationMinutes: true,
          }
        },
        professional: {
          select: {
            name: true,
            email: true,
          },
          include: {
            user: {
              select: {
                businessName: true,
                email: true,
                autoApproveBookings: true,
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

    if (appointment.paymentStatus === 'paid') {
      res.status(400).json({ error: 'Payment already confirmed' });
      return;
    }

    // Verify payment with Stripe
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      res.status(400).json({ error: 'Payment has not been completed' });
      return;
    }

    // Update appointment with payment confirmation
    const status = appointment.professional.user.autoApproveBookings ? 'confirmed' : 'pending';
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: 'paid',
        status,
        stripePaymentIntentId: paymentIntentId,
      },
      include: {
        service: {
          select: {
            name: true,
            price: true,
            durationMinutes: true,
          }
        },
        professional: {
          select: {
            name: true,
            email: true,
          },
          include: {
            user: {
              select: {
                businessName: true,
                email: true,
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

    // Send confirmation emails
    try {
      await sendAppointmentConfirmationEmail({ appointment: updatedAppointment });
      await sendAppointmentNotificationToProfessional({ appointment: updatedAppointment });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(200).json(updatedAppointment);
  } catch (error) {
    throw error;
  }
};
