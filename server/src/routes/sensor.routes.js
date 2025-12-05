import express from 'express';
import { 
  getSensors, 
  getAllSensors,
  createSensor, 
  updateSensor, 
  deleteSensor,
  getSensorById
  } from '../controllers/sensor.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateSensor } from '../validators/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Sensor routes
router.get('/', getSensors);
router.get('/admin', getAllSensors);
router.post('/', validateSensor, createSensor);
router.get('/:id', getSensorById);
router.put('/:id', validateSensor, updateSensor);
router.delete('/:id', deleteSensor);

export default router;