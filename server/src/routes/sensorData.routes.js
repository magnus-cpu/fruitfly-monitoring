import express from 'express';
import { 
  getSensorData,
  addSensorData
} from '../controllers/sensorData.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateSensorData } from '../validators/validator.js';

const router = express.Router();

// All routes require authentication
// router.use(authenticateToken);

// Sensor data routes
router.get('/:id/data', authenticateToken,getSensorData);
router.post('/data', validateSensorData, addSensorData);

export default router;