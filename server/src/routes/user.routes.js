import express from 'express';
import {
  validateUpdateProfile,
  validateChangePassword,
  validateCreateViewer,
  validateUpdateUserRole,
  validateUserId
} from '../validators/validator.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  getTeamMembers,
  createTeamMember,
  deleteTeamMember,
  getAllUsers,
  deleteUser,
  updateUserRole,
  deleteUserAny
} from '../controllers/user.controller.js';
import { authenticateToken, requireAdmin, requireManager } from '../middleware/auth.middleware.js';

const router = express.Router();

/* ---------- Self-service ---------- */
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateUpdateProfile, updateProfile);
router.put('/profile/change-password', authenticateToken, validateChangePassword, changePassword);
router.put('/change-password', authenticateToken, validateChangePassword, changePassword);
router.delete('/profile',   authenticateToken, deleteUser);
router.get('/team-members', authenticateToken, requireManager, getTeamMembers);
router.post('/team-members', authenticateToken, requireManager, validateCreateViewer, createTeamMember);
router.delete('/team-members/:id', authenticateToken, requireManager, validateUserId, deleteTeamMember);

/* ---------- Admin ---------- */
router.get('/', authenticateToken, requireAdmin, getAllUsers);
router.delete('/:id', authenticateToken, requireAdmin, validateUserId, deleteUserAny);
router.patch('/:id/role', authenticateToken, requireAdmin, validateUserId, validateUpdateUserRole, updateUserRole);

export default router;
