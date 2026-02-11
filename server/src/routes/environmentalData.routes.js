import express from 'express';
import { storeEnvironmentalData } from '../controllers/environmentalData.controller.js';
import { validateSensorData } from '../validators/validator.js';

const router = express.Router();

router.post('/data', validateSensorData, storeEnvironmentalData);

export default router;