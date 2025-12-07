import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  getProfessionals,
  getProfessional,
  createProfessional,
  updateProfessional,
  deleteProfessional,
  toggleProfessionalStatus,
} from '../controllers/professionalController';

const router = Router();

// All professional routes require authentication
router.use(authenticate);

router.get('/', getProfessionals);
router.get('/:id', getProfessional);
router.post('/', upload.single('avatar'), createProfessional);
router.put('/:id', upload.single('avatar'), updateProfessional);
router.delete('/:id', deleteProfessional);
router.patch('/:id/toggle-status', toggleProfessionalStatus);

export default router;
