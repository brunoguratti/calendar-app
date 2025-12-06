import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability
} from '../controllers/availabilityController';

const router = Router();

// All availability routes require authentication
router.use(authenticate);

router.get('/', getAvailability);
router.post('/', createAvailability);
router.put('/:id', updateAvailability);
router.delete('/:id', deleteAvailability);

export default router;
