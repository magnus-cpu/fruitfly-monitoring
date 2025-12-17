import express from "express";
import { storeCountsData } from "../controllers/countsData.controller.js";

const router = express.Router();

router.post('/counts-data', storeCountsData);

export default router;

