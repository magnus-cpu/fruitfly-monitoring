import express from 'express';
import { authenticateToken, requireWritableFarmAccess } from '../middleware/auth.middleware.js';
import { validateSensor } from '../validators/validator.js';
import { createGateWay, deleteGateway, getAllGateways, getGatewayById, getGateways, getGatewaysData, updateGateway } from '../controllers/gateway.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Gateways Routes
router.get('/', getGateways);
// router.get('/admin', getAllGateways);
// router.get('/:id', getGatewayById);
router.get('/:id/data', getGatewaysData);

router.post('/', requireWritableFarmAccess, validateSensor, createGateWay);
router.put('/:id', requireWritableFarmAccess, validateSensor, updateGateway);
router.delete('/:id', requireWritableFarmAccess, deleteGateway);


export default router;
