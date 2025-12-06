import { Response } from 'express';
import { AuthRequest } from '../types';
import { createAvailabilitySchema } from '../utils/validation';
import prisma from '../utils/prisma';

export const getAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const availability = await prisma.availability.findMany({
      where: { userId: req.userId },
      orderBy: { dayOfWeek: 'asc' }
    });

    res.status(200).json(availability);
  } catch (error) {
    throw error;
  }
};

export const createAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validatedData = createAvailabilitySchema.parse(req.body);

    // Check if availability already exists for this day
    const existing = await prisma.availability.findFirst({
      where: {
        userId: req.userId,
        dayOfWeek: validatedData.dayOfWeek,
        active: true
      }
    });

    if (existing) {
      res.status(400).json({ error: 'Availability already exists for this day. Please update or delete the existing one.' });
      return;
    }

    const availability = await prisma.availability.create({
      data: {
        ...validatedData,
        userId: req.userId!
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

    // Check if availability exists and belongs to user
    const existing = await prisma.availability.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!existing) {
      res.status(404).json({ error: 'Availability not found' });
      return;
    }

    const availability = await prisma.availability.update({
      where: { id },
      data: validatedData
    });

    res.status(200).json(availability);
  } catch (error) {
    throw error;
  }
};

export const deleteAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if availability exists and belongs to user
    const existing = await prisma.availability.findFirst({
      where: {
        id,
        userId: req.userId
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
