import { Router } from 'express';
import {
  getAppointmentByToken,
  cancelAppointmentByToken,
  requestReschedule,
  getAvailableSlots,
} from '../controllers/bookingManagementController';

const router = Router();

// No authentication required - using management token instead

// Get appointment details by token
router.get('/appointment/:token', getAppointmentByToken);

// Cancel appointment
router.post('/appointment/:token/cancel', cancelAppointmentByToken);

// Request reschedule
router.post('/appointment/:token/reschedule', requestReschedule);

// Get available slots for rescheduling
router.get('/appointment/:token/available-slots', getAvailableSlots);

export default router;
