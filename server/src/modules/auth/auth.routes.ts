import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema } from '@taskify/shared';
import * as authController from './auth.controller';

const router = Router();

// Public endpoints
router.get('/me', optionalAuth, authController.me);
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

// Protected endpoints
router.post('/logout', requireAuth, authController.logout);
router.put('/me', requireAuth, authController.updateProfile);
router.put('/me/password', requireAuth, validate(changePasswordSchema), authController.changePassword);
router.post('/me/tokens/revoke', requireAuth, authController.revokeSessions);

export default router;
