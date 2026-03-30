import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
import { clearAuditLogs, deleteAuditLog, getAuditLogs } from '../controllers/audit.controller.js';
import { validateUserId } from '../validators/validator.js';

const router = express.Router();

router.use(authenticateToken, requireAdmin);

router.get('/', getAuditLogs);
router.delete('/', clearAuditLogs);
router.delete('/:id', validateUserId, deleteAuditLog);

export default router;
