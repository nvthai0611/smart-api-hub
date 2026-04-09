import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middlewares/validationMiddleware';
import { registerSchema, loginSchema } from '../utils/validationSchemas';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

export default router;
