// ============================================
// File: routes/imageRoutes.js
// ============================================

import express from 'express';
import { authenticateToken, requireWritableFarmAccess } from '../middleware/auth.middleware.js';
import {
  deleteFruitflyImage,
  getFruitflyImages,
  processImageData,
  updateFruitflyImageAnalysis
} from '../controllers/imageData.controller.js';

const router = express.Router();

router.post('/image-data', processImageData);
router.get('/fruitfly-images', authenticateToken, getFruitflyImages);
router.patch('/fruitfly-images/:id/analyze', authenticateToken, requireWritableFarmAccess, updateFruitflyImageAnalysis);
router.delete('/fruitfly-images/:id', authenticateToken, requireWritableFarmAccess, deleteFruitflyImage);

export default router;
