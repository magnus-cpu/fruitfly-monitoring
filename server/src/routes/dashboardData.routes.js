import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { getLocations } from "../controllers/dashboardData.controller.js";

const router  = express.Router();
router.use(authenticateToken);


router.get('/', getLocations);




export default router;