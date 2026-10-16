import { Router } from "express";
import { createSubmission, listMySubmissions, updateSubmissionViews} from "../controllers/submissionController"
import {
  authenticate,
  requireRole,
} from "../middleware/authMiddleware";

const router = Router();

router.post( "/", authenticate, requireRole("creator"), createSubmission);

router.get("/mine", authenticate, requireRole("creator"),listMySubmissions);

router.patch("/:id/views", authenticate, updateSubmissionViews);

export default router;