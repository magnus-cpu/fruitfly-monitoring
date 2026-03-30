import express from 'express';
import { register, login, authMe, logout } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateRegister, validateLogin } from '../validators/validator.js';

const router = express.Router();

// Public routes
// GET /api/auth/me
router.get('/me', authenticateToken, authMe);
router.post('/logout', authenticateToken, logout);

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

export default router;
