import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAppointments,
  updateAppointmentStatus,
  getAppointmentStats
} from '../controllers/appointmentController';

const router = Router();

// All appointment routes require authentication
router.use(authenticate);

router.get('/', getAppointments);
router.get('/stats', getAppointmentStats);
router.put('/:id/status', updateAppointmentStatus);

export default router;
