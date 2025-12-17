import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateSensor } from '../validators/validator.js';
import { createGateWay, deleteGateway, getAllGateways, getGatewayById, getGateways, updateGateway } from '../controllers/gateway.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Gateways Routes
router.get('/', getGateways);
router.get('/admin', getAllGateways);
router.get('/:id', getGatewayById);

router.post('/', validateSensor, createGateWay);
router.put('/:id', validateSensor, updateGateway);
router.delete('/:id', deleteGateway);


export default router;