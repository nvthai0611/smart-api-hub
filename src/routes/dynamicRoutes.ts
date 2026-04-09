import { Router } from 'express';
import * as dynamicController from '../controllers/dynamicController';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware';

const router = Router();

router.get('/:resource', dynamicController.getAll);
router.get('/:resource/:id', dynamicController.getOne);

// Write actions require authentication
router.post('/:resource', authenticate, dynamicController.create);
router.put('/:resource/:id', authenticate, dynamicController.update);
router.patch('/:resource/:id', authenticate, dynamicController.patch);

// Delete action requires admin role
router.delete('/:resource/:id', authenticate, authorizeAdmin, dynamicController.remove);

export default router;
