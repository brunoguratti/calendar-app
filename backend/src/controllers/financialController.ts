import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../utils/prisma';

/**
 * Get overall revenue summary
 */
export const getRevenueSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Get all paid appointments for this user's professionals
    const appointments = await prisma.appointment.findMany({
      where: {
        professional: {
          userId: req.userId
        },
        paymentStatus: 'paid',
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      },
      include: {
        professional: {
          select: {
            id: true,
            name: true,
          }
        },
        service: {
          select: {
            name: true,
            price: true,
          }
        }
      }
    });

    // Calculate total revenue
    const totalRevenue = appointments.reduce((sum, apt) => {
      return sum + (apt.paymentAmount || apt.service.price || 0);
    }, 0);

    // Get revenue by professional
    const revenueByProfessional: { [key: string]: { name: string; revenue: number; count: number } } = {};
    appointments.forEach(apt => {
      const profId = apt.professional.id;
      if (!revenueByProfessional[profId]) {
        revenueByProfessional[profId] = {
          name: apt.professional.name,
          revenue: 0,
          count: 0
        };
      }
      revenueByProfessional[profId].revenue += apt.paymentAmount || apt.service.price || 0;
      revenueByProfessional[profId].count += 1;
    });

    // Get revenue by month (for charts)
    const revenueByMonth: { [key: string]: number } = {};
    appointments.forEach(apt => {
      const monthKey = `${apt.date.getFullYear()}-${String(apt.date.getMonth() + 1).padStart(2, '0')}`;
      if (!revenueByMonth[monthKey]) {
        revenueByMonth[monthKey] = 0;
      }
      revenueByMonth[monthKey] += apt.paymentAmount || apt.service.price || 0;
    });

    res.status(200).json({
      totalRevenue,
      totalAppointments: appointments.length,
      revenueByProfessional: Object.entries(revenueByProfessional).map(([id, data]) => ({
        professionalId: id,
        ...data
      })),
      revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({
        month,
        revenue
      })).sort((a, b) => a.month.localeCompare(b.month)),
      averageRevenuePerAppointment: appointments.length > 0 ? totalRevenue / appointments.length : 0,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get revenue for a specific professional
 */
export const getProfessionalRevenue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { professionalId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify professional belongs to user
    const professional = await prisma.professional.findFirst({
      where: {
        id: professionalId,
        userId: req.userId
      }
    });

    if (!professional) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Get paid appointments for this professional
    const appointments = await prisma.appointment.findMany({
      where: {
        professionalId,
        paymentStatus: 'paid',
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      },
      include: {
        service: {
          select: {
            name: true,
            price: true,
          }
        },
        room: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate revenue
    const totalRevenue = appointments.reduce((sum, apt) => {
      return sum + (apt.paymentAmount || apt.service.price || 0);
    }, 0);

    // Revenue by service
    const revenueByService: { [key: string]: { revenue: number; count: number } } = {};
    appointments.forEach(apt => {
      const serviceName = apt.service.name;
      if (!revenueByService[serviceName]) {
        revenueByService[serviceName] = { revenue: 0, count: 0 };
      }
      revenueByService[serviceName].revenue += apt.paymentAmount || apt.service.price || 0;
      revenueByService[serviceName].count += 1;
    });

    res.status(200).json({
      professional: {
        id: professional.id,
        name: professional.name,
      },
      totalRevenue,
      totalAppointments: appointments.length,
      averageRevenuePerAppointment: appointments.length > 0 ? totalRevenue / appointments.length : 0,
      revenueByService: Object.entries(revenueByService).map(([name, data]) => ({
        serviceName: name,
        ...data
      })),
      recentAppointments: appointments.slice(0, 10).map(apt => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        customerName: apt.customerName,
        serviceName: apt.service.name,
        amount: apt.paymentAmount || apt.service.price,
      }))
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Get all payments
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          userId: req.userId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: Number(limit),
      }),
      prisma.payment.count({
        where: {
          userId: req.userId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        }
      })
    ]);

    res.status(200).json({
      payments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Export revenue data as CSV
 */
export const exportRevenueCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, professionalId } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Build where clause
    const whereClause: any = {
      professional: {
        userId: req.userId
      },
      paymentStatus: 'paid',
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
    };

    if (professionalId) {
      whereClause.professionalId = professionalId;
    }

    // Get appointments
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        professional: {
          select: {
            name: true,
          }
        },
        service: {
          select: {
            name: true,
            price: true,
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Generate CSV
    const csvHeader = 'Date,Time,Professional,Service,Customer Name,Customer Email,Amount,Payment Status,Payment ID\n';
    const csvRows = appointments.map(apt => {
      const date = apt.date.toISOString().split('T')[0];
      const amount = apt.paymentAmount || apt.service.price || 0;
      return `${date},${apt.time},${apt.professional.name},"${apt.service.name}","${apt.customerName}","${apt.customerEmail}",${amount},${apt.paymentStatus},"${apt.paymentId || ''}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="revenue-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    throw error;
  }
};
