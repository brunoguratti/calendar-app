import { Router } from 'express';
import {
  getPublicProfile,
  getPublicServices,
  getAvailableSlots,
  createPublicAppointment
} from '../controllers/publicController';

const router = Router();

router.get('/:slug', getPublicProfile);
router.get('/:slug/services', getPublicServices);
router.get('/:slug/available-slots', getAvailableSlots);
router.post('/:slug/book', createPublicAppointment);

export default router;
