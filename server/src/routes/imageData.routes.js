// ============================================
// File: routes/imageRoutes.js
// ============================================

import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { getFruitflyImages, processImageData } from '../controllers/imageData.controller.js';

const router = express.Router();

router.post('/image-data', processImageData);
router.get('/fruitfly-images', authenticateToken, getFruitflyImages);

export default router;
