import express from 'express';
import {
  validateUpdateProfile,
  validateChangePassword,
  validateUpdateUserRole,
  validateUserId
} from '../validators/validator.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  deleteUser,
  updateUserRole,
  deleteUserAny
} from '../controllers/user.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

/* ---------- Self-service ---------- */
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateUpdateProfile, updateProfile);
router.put('/change-password', authenticateToken, validateChangePassword, changePassword);
router.delete('/profile',   authenticateToken, deleteUser);

/* ---------- Admin ---------- */
router.get('/', authenticateToken, requireAdmin, getAllUsers);
router.delete('/:id', authenticateToken, requireAdmin, validateUserId, deleteUserAny);
router.patch('/:id/role', authenticateToken, requireAdmin, validateUserId, validateUpdateUserRole, updateUserRole);

export default router;