import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../utils/prisma';

/**
 * Get all rooms for the authenticated user
 */
export const getRooms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rooms = await prisma.room.findMany({
      where: { userId: req.userId },
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(rooms);
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single room by ID
 */
export const getRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findFirst({
      where: {
        id,
        userId: req.userId,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    res.status(200).json(room);
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new room
 */
export const createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, capacity } = req.body;

    const room = await prisma.room.create({
      data: {
        userId: req.userId!,
        name,
        description,
        capacity: capacity || 1,
      },
    });

    res.status(201).json(room);
  } catch (error) {
    throw error;
  }
};

/**
 * Update a room
 */
export const updateRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, capacity, active } = req.body;

    // Check if room exists and belongs to user
    const existing = await prisma.room.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        name,
        description,
        capacity,
        active,
      },
    });

    res.status(200).json(room);
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a room
 */
export const deleteRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if room exists and belongs to user
    const existing = await prisma.room.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    await prisma.room.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    throw error;
  }
};

/**
 * Assign services to a room
 */
export const assignServices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { serviceIds } = req.body; // Array of service IDs

    // Check if room exists and belongs to user
    const room = await prisma.room.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // Delete existing assignments
    await prisma.serviceRoom.deleteMany({
      where: { roomId: id },
    });

    // Create new assignments
    if (serviceIds && serviceIds.length > 0) {
      await prisma.serviceRoom.createMany({
        data: serviceIds.map((serviceId: string) => ({
          roomId: id,
          serviceId,
        })),
      });
    }

    // Return updated room with services
    const updatedRoom = await prisma.room.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    res.status(200).json(updatedRoom);
  } catch (error) {
    throw error;
  }
};
