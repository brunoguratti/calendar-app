import { Response } from 'express';
import { AuthRequest } from '../types';
import { createServiceSchema, updateServiceSchema } from '../utils/validation';
import prisma from '../utils/prisma';

export const getServices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const services = await prisma.service.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(services);
  } catch (error) {
    throw error;
  }
};

export const createService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validatedData = createServiceSchema.parse(req.body);

    const service = await prisma.service.create({
      data: {
        ...validatedData,
        userId: req.userId!
      }
    });

    res.status(201).json(service);
  } catch (error) {
    throw error;
  }
};

export const updateService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = updateServiceSchema.parse(req.body);

    // Check if service exists and belongs to user
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!existingService) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    const service = await prisma.service.update({
      where: { id },
      data: validatedData
    });

    res.status(200).json(service);
  } catch (error) {
    throw error;
  }
};

export const deleteService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if service exists and belongs to user
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!existingService) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    await prisma.service.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    throw error;
  }
};
