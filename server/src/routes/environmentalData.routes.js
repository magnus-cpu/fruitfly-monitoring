import express from 'express';
import { 
  getEnvironmentalData,
  storeEnvironmentalData
} from '../controllers/environmentalData.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateSensorData } from '../validators/validator.js';

const router = express.Router();

// All routes require authentication
// router.use(authenticateToken);

// Sensor data routes
router.get('/:id/data', authenticateToken, getEnvironmentalData);
router.post('/data', validateSensorData, storeEnvironmentalData);

export default router;