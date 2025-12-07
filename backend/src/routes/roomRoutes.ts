import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  assignServices,
} from '../controllers/roomController';

const router = Router();

// All room routes require authentication
router.use(authenticate);

router.get('/', getRooms);
router.get('/:id', getRoom);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);
router.post('/:id/assign-services', assignServices);

export default router;
