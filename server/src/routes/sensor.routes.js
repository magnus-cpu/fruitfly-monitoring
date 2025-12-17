import express from 'express';
import { 
  getSensors, 
  getAllSensors,
  getSensorById,
  createNode,
  updateNode,
  deleteNode
  } from '../controllers/sensor.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateSensor } from '../validators/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Sensor routes
router.get('/', getSensors);
router.get('/admin', getAllSensors);
router.get('/:id', getSensorById);


router.post('/', validateSensor, createNode);
router.put('/:id', validateSensor, updateNode);
router.delete('/:id', deleteNode);

export default router;