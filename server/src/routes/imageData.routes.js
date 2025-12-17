// ============================================
// File: routes/imageRoutes.js
// ============================================

import express from 'express';
import { processImageData } from '../controllers/imageData.controller.js';

const router = express.Router();

router.post('/image-data', processImageData);

export default router;
