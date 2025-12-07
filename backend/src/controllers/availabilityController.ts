import { Response } from 'express';
import { AuthRequest } from '../types';
import { createAvailabilitySchema } from '../utils/validation';
import prisma from '../utils/prisma';

export const getAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get all availability for professionals belonging to this user
    const availability = await prisma.availability.findMany({
      where: {
        professional: {
          userId: req.userId
        }
      },
      include: {
        professional: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        }
      },
      orderBy: [
        { professionalId: 'asc' },
        { dayOfWeek: 'asc' }
      ]
    });

    res.status(200).json(availability);
  } catch (error) {
    throw error;
  }
};

export const createAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validatedData = createAvailabilitySchema.parse(req.body);
    const { professionalId, ...availabilityData } = validatedData as any;

    // Verify professional belongs to this user
    const professional = await prisma.professional.findFirst({
      where: {
        id: professionalId,
        userId: req.userId
      }
    });

    if (!professional) {
      res.status(404).json({ error: 'Professional not found or does not belong to you' });
      return;
    }

    // Check if availability already exists for this professional and day
    const existing = await prisma.availability.findFirst({
      where: {
        professionalId,
        dayOfWeek: availabilityData.dayOfWeek,
        active: true
      }
    });

    if (existing) {
      res.status(400).json({ error: 'Availability already exists for this professional on this day. Please update or delete the existing one.' });
      return;
    }

    const availability = await prisma.availability.create({
      data: {
        ...availabilityData,
        professionalId
      },
      include: {
        professional: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        }
      }
    });

    res.status(201).json(availability);
  } catch (error) {
    throw error;
  }
};

export const updateAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = createAvailabilitySchema.parse(req.body);
    const { professionalId, ...availabilityData } = validatedData as any;

    // Check if availability exists and belongs to user's professional
    const existing = await prisma.availability.findFirst({
      where: {
        id,
        professional: {
          userId: req.userId
        }
      }
    });

    if (!existing) {
      res.status(404).json({ error: 'Availability not found' });
      return;
    }

    const availability = await prisma.availability.update({
      where: { id },
      data: availabilityData,
      include: {
        professional: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        }
      }
    });

    res.status(200).json(availability);
  } catch (error) {
    throw error;
  }
};

export const deleteAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if availability exists and belongs to user's professional
    const existing = await prisma.availability.findFirst({
      where: {
        id,
        professional: {
          userId: req.userId
        }
      }
    });

    if (!existing) {
      res.status(404).json({ error: 'Availability not found' });
      return;
    }

    await prisma.availability.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    throw error;
  }
};
