import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../utils/prisma';
import { deleteFile, getFileUrl } from '../middleware/upload';
import path from 'path';

/**
 * Get all professionals for the authenticated user
 */
export const getProfessionals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const professionals = await prisma.professional.findMany({
      where: { userId: req.userId },
      include: {
        _count: {
          select: {
            services: true,
            appointments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(professionals);
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single professional by ID
 */
export const getProfessional = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const professional = await prisma.professional.findFirst({
      where: {
        id,
        userId: req.userId,
      },
      include: {
        services: {
          where: { active: true },
        },
        availability: {
          where: { active: true },
          orderBy: { dayOfWeek: 'asc' },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    if (!professional) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }

    res.status(200).json(professional);
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new professional
 */
export const createProfessional = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, bio, specialties } = req.body;

    // Handle avatar upload if present
    let avatarUrl: string | undefined;
    if (req.file) {
      avatarUrl = getFileUrl(req.file.filename);
    }

    const professional = await prisma.professional.create({
      data: {
        userId: req.userId!,
        name,
        email,
        phone,
        bio,
        specialties,
        avatarUrl,
      },
    });

    res.status(201).json(professional);
  } catch (error) {
    // Clean up uploaded file if database operation fails
    if (req.file) {
      deleteFile(req.file.path);
    }
    throw error;
  }
};

/**
 * Update a professional
 */
export const updateProfessional = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, bio, specialties, active } = req.body;

    // Check if professional exists and belongs to user
    const existing = await prisma.professional.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }

    // Handle avatar upload if present
    let avatarUrl: string | undefined;
    if (req.file) {
      avatarUrl = getFileUrl(req.file.filename);

      // Delete old avatar if exists
      if (existing.avatarUrl) {
        const oldFilePath = path.join(
          process.env.UPLOAD_DIR || 'uploads',
          existing.avatarUrl.replace('/uploads/', '')
        );
        deleteFile(oldFilePath);
      }
    }

    const professional = await prisma.professional.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        bio,
        specialties,
        active,
        ...(avatarUrl && { avatarUrl }),
      },
    });

    res.status(200).json(professional);
  } catch (error) {
    // Clean up uploaded file if database operation fails
    if (req.file) {
      deleteFile(req.file.path);
    }
    throw error;
  }
};

/**
 * Delete a professional
 */
export const deleteProfessional = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if professional exists and belongs to user
    const existing = await prisma.professional.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }

    // Delete avatar file if exists
    if (existing.avatarUrl) {
      const filePath = path.join(
        process.env.UPLOAD_DIR || 'uploads',
        existing.avatarUrl.replace('/uploads/', '')
      );
      deleteFile(filePath);
    }

    await prisma.professional.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    throw error;
  }
};

/**
 * Toggle professional active status
 */
export const toggleProfessionalStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if professional exists and belongs to user
    const existing = await prisma.professional.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }

    const professional = await prisma.professional.update({
      where: { id },
      data: { active: !existing.active },
    });

    res.status(200).json(professional);
  } catch (error) {
    throw error;
  }
};
