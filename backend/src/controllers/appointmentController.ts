import { Response } from 'express';
import { AuthRequest } from '../types';
import { updateAppointmentStatusSchema } from '../utils/validation';
import prisma from '../utils/prisma';

export const getAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, startDate, endDate } = req.query;

    const where: any = {
      userId: req.userId
    };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        service: true
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

    res.status(200).json(appointments);
  } catch (error) {
    throw error;
  }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = updateAppointmentStatusSchema.parse(req.body);

    // Check if appointment exists and belongs to user
    const existing = await prisma.appointment.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!existing) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: validatedData.status },
      include: { service: true }
    });

    res.status(200).json(appointment);
  } catch (error) {
    throw error;
  }
};

export const getAppointmentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get start of current week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Count appointments today
    const appointmentsToday = await prisma.appointment.count({
      where: {
        userId: req.userId,
        date: {
          gte: today,
          lt: tomorrow
        },
        status: {
          in: ['pending', 'confirmed']
        }
      }
    });

    // Count appointments this week
    const appointmentsThisWeek = await prisma.appointment.count({
      where: {
        userId: req.userId,
        date: {
          gte: startOfWeek,
          lt: endOfWeek
        },
        status: {
          in: ['pending', 'confirmed']
        }
      }
    });

    // Count pending appointments
    const pendingAppointments = await prisma.appointment.count({
      where: {
        userId: req.userId,
        status: 'pending',
        date: {
          gte: today
        }
      }
    });

    // Get upcoming appointments (next 5)
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: today
        },
        status: {
          in: ['pending', 'confirmed']
        }
      },
      include: {
        service: true
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ],
      take: 5
    });

    res.status(200).json({
      appointmentsToday,
      appointmentsThisWeek,
      pendingAppointments,
      upcomingAppointments
    });
  } catch (error) {
    throw error;
  }
};
