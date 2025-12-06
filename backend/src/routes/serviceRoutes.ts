import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getServices,
  createService,
  updateService,
  deleteService
} from '../controllers/serviceController';

const router = Router();

// All service routes require authentication
router.use(authenticate);

router.get('/', getServices);
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

export default router;
