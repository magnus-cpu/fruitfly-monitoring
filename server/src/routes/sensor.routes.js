import express from 'express';
import { 
  getNodeSensors, 
  getSensors,
  getAllSensors,
  getSensorById,
  createNode,
  updateNode,
  deleteNode
  } from '../controllers/sensor.controller.js';
import { authenticateToken, requireWritableFarmAccess } from '../middleware/auth.middleware.js';
import { validateSensor } from '../validators/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Sensor routes
router.get('/', getSensors);
router.get('/:id/nodes', getNodeSensors);
router.get('/admin', getAllSensors);
router.get('/:id', getSensorById);


router.post('/:id/nodes', requireWritableFarmAccess, validateSensor, createNode);
router.put('/:id', requireWritableFarmAccess, validateSensor, updateNode);
router.delete('/:id', requireWritableFarmAccess, deleteNode);

export default router;
