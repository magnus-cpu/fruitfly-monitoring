import express from 'express';
import { storeSystemTelemetry } from '../controllers/systemTelemetry.controller.js';

const router = express.Router();

router.post('/telemetry-data', storeSystemTelemetry);

export default router;
