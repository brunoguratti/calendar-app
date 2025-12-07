import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getRevenueSummary,
  getProfessionalRevenue,
  getPaymentHistory,
  exportRevenueCSV,
} from '../controllers/financialController';

const router = Router();

// All financial routes require authentication
router.use(authenticate);

// Revenue and analytics
router.get('/revenue/summary', getRevenueSummary);
router.get('/revenue/professional/:professionalId', getProfessionalRevenue);
router.get('/revenue/export', exportRevenueCSV);

// Payment history
router.get('/payments', getPaymentHistory);

export default router;
