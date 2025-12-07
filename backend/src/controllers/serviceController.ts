import { Response } from 'express';
import { AuthRequest } from '../types';
import { createServiceSchema, updateServiceSchema } from '../utils/validation';
import prisma from '../utils/prisma';

export const getServices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get all services for professionals belonging to this user
    const services = await prisma.service.findMany({
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
        },
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
      },
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
    const { professionalId, roomIds, ...serviceData } = validatedData as any;

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

    // Create service
    const service = await prisma.service.create({
      data: {
        ...serviceData,
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

    // Assign to rooms if provided
    if (roomIds && roomIds.length > 0) {
      await prisma.serviceRoom.createMany({
        data: roomIds.map((roomId: string) => ({
          serviceId: service.id,
          roomId
        }))
      });
    }

    // Return service with room assignments
    const serviceWithRooms = await prisma.service.findUnique({
      where: { id: service.id },
      include: {
        professional: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        },
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

    res.status(201).json(serviceWithRooms);
  } catch (error) {
    throw error;
  }
};

export const updateService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = updateServiceSchema.parse(req.body);
    const { roomIds, ...serviceData } = validatedData as any;

    // Check if service exists and belongs to user's professional
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        professional: {
          userId: req.userId
        }
      }
    });

    if (!existingService) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    // Update service
    const service = await prisma.service.update({
      where: { id },
      data: serviceData
    });

    // Update room assignments if provided
    if (roomIds !== undefined) {
      // Delete existing assignments
      await prisma.serviceRoom.deleteMany({
        where: { serviceId: id }
      });

      // Create new assignments
      if (roomIds.length > 0) {
        await prisma.serviceRoom.createMany({
          data: roomIds.map((roomId: string) => ({
            serviceId: id,
            roomId
          }))
        });
      }
    }

    // Return updated service with relationships
    const updatedService = await prisma.service.findUnique({
      where: { id },
      include: {
        professional: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        },
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

    res.status(200).json(updatedService);
  } catch (error) {
    throw error;
  }
};

export const deleteService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if service exists and belongs to user's professional
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        professional: {
          userId: req.userId
        }
      }
    });

    if (!existingService) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    // Delete service (ServiceRoom entries will be deleted via cascade)
    await prisma.service.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    throw error;
  }
};
