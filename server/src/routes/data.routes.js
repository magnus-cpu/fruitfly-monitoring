import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { getCombinedData, getEnvironmentalData } from '../controllers/data.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// data routes
router.get('/:serial_number/env_data', getEnvironmentalData);
router.get('/:serial_number/combined_data', getCombinedData);

export default router;