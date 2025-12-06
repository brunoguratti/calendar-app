import { Request, Response } from 'express';
import { registerSchema, loginSchema } from '../utils/validation';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import prisma from '../utils/prisma';
import { AuthResponse } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    // Check if slug already exists
    const existingSlug = await prisma.user.findUnique({
      where: { slug: validatedData.slug }
    });

    if (existingSlug) {
      res.status(400).json({ error: 'Slug already taken' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        businessName: validatedData.businessName,
        slug: validatedData.slug
      }
    });

    // Generate token
    const token = generateToken(user.id);

    // Return response
    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        businessName: user.businessName,
        slug: user.slug
      }
    };

    res.status(201).json(response);
  } catch (error) {
    throw error;
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check password
    const isValidPassword = await comparePassword(validatedData.password, user.password);

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken(user.id);

    // Return response
    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        businessName: user.businessName,
        slug: user.slug
      }
    };

    res.status(200).json(response);
  } catch (error) {
    throw error;
  }
};
