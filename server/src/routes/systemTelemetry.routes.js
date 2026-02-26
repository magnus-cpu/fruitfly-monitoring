import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  getSystemTelemetry,
  storeSystemTelemetry
} from '../controllers/systemTelemetry.controller.js';

const router = express.Router();

router.post('/telemetry-data', storeSystemTelemetry);
router.get('/system-telemetry', authenticateToken, getSystemTelemetry);

export default router;
