import { Router } from "express";
import {
  createCampaign,
  listCampaigns,
} from "../controllers/campaignController";
import {
  authenticate,
  requireRole,
} from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticate, listCampaigns);
router.post("/", authenticate, requireRole("brand"), createCampaign);

export default router;