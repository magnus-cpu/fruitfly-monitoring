import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
import { validateContentBlock, validateContentId } from '../validators/validator.js';
import { getContent, upsertContent, deleteContent } from '../controllers/content.controller.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getContent);
router.post('/', requireAdmin, validateContentBlock, upsertContent);
router.delete('/:id', requireAdmin, validateContentId, deleteContent);

export default router;
