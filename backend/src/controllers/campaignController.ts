import { Response } from "express";
import mongoose from "mongoose";
import Campaign, { IMilestone } from "../models/Campaign";
import { AuthRequest } from "../middleware/authMiddleware";

export async function createCampaign(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { name, platform, budget, milestones } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      !["Instagram", "YouTube"].includes(platform) ||
      typeof budget !== "number" ||
      !Number.isFinite(budget) ||
      budget <= 0 ||
      !Array.isArray(milestones) ||
      milestones.length === 0
    ) {
      res.status(400).json({
        success: false,
        message: "Provide a name, valid platform, positive budget, and milestones",
      });
      return;
    }

    const validMilestones = milestones.every(
      (milestone: IMilestone) =>
        Number.isInteger(milestone.views) &&
        milestone.views > 0 &&
        typeof milestone.payout === "number" &&
        Number.isFinite(milestone.payout) &&
        milestone.payout >= 0
    );

    if (!validMilestones) {
      res.status(400).json({
        success: false,
        message: "Each milestone needs positive integer views and a non-negative payout",
      });
      return;
    }

    const sortedMilestones = [...milestones].sort(
      (a: IMilestone, b: IMilestone) => a.views - b.views
    );

    const hasDuplicateThresholds = sortedMilestones.some(
      (milestone, index) =>
        index > 0 && milestone.views === sortedMilestones[index - 1].views
    );

    if (hasDuplicateThresholds) {
      res.status(400).json({
        success: false,
        message: "Milestone view thresholds must be unique",
      });
      return;
    }

    if (
      sortedMilestones.some(
        (milestone, index) =>
          index > 0 &&
          milestone.payout < sortedMilestones[index - 1].payout
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Milestone payouts must be non-decreasing",
      });
      return;
    }

    if (!req.user?.userId || !mongoose.isValidObjectId(req.user.userId)) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const campaign = await Campaign.create({
      name: name.trim(),
      platform,
      budget,
      spent: 0,
      remainingBudget: budget,
      milestones: sortedMilestones,
      brandId: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      campaign,
    });
  } catch (error) {
    console.error("Create campaign error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function listCampaigns(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    let filter;

    if (req.user.role === "brand") {
      // Brands can see all campaigns they created,
      // including campaigns whose budget is exhausted.
      filter = { brandId: req.user.userId };
    } else if (req.user.role === "creator") {
      // Creators can see only campaigns with money remaining.
      filter = { remainingBudget: { $gt: 0 } };
    } else {
      res.status(403).json({
        success: false,
        message: "Invalid user role",
      });
      return;
    }

    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      campaigns,
    });
  } catch (error) {
    console.error("List campaigns error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}