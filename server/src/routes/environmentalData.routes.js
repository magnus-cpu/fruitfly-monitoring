import express from 'express';
import { storeEnvironmentalData } from '../controllers/environmentalData.controller.js';

const router = express.Router();

router.post('/data', storeEnvironmentalData);

export default router;