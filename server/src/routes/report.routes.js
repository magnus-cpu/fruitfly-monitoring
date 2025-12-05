import express from 'express';
import { 
  getReports, 
  generateReport, 
  downloadReport
} from '../controllers/report.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {  validateReport } from '../validators/validator.js';
const router = express.Router();

// All routes require authentication
// router.use(authenticateToken);

// Report routes
router.get('/', getReports);
router.post('/', validateReport, generateReport);
router.get('/:id/download', downloadReport);

export default router;