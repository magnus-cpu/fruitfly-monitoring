import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { getLocations, getPublicLandingLocations } from "../controllers/dashboardData.controller.js";

const router  = express.Router();
router.get('/public', getPublicLandingLocations);

router.use(authenticateToken);
router.get('/', getLocations);

export default router;
