import { Response } from "express";
import mongoose from "mongoose";
import Campaign from "../models/Campaign";
import Submission from "../models/Submission";
import { AuthRequest } from "../middleware/authMiddleware";
import { calculateEligiblePayout, calculateAdditionalPayout} from "../utils/payout";

export async function createSubmission(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { campaignId, postUrl } = req.body;

    if (
      typeof campaignId !== "string" ||
      !mongoose.isValidObjectId(campaignId) ||
      typeof postUrl !== "string" ||
      !postUrl.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "A valid campaignId and postUrl are required",
      });
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(postUrl.trim());
    } catch {
      res.status(400).json({
        success: false,
        message: "postUrl must be a valid URL",
      });
      return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      res.status(400).json({
        success: false,
        message: "postUrl must use HTTP or HTTPS",
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

    const campaign = await Campaign.findOne({
      _id: campaignId,
      remainingBudget: { $gt: 0 },
    });

    if (!campaign) {
      res.status(404).json({
        success: false,
        message: "Campaign not found or no budget remains",
      });
      return;
    }

    const existing = await Submission.findOne({
      campaignId,
      creatorId: req.user.userId,
      postUrl: parsedUrl.toString(),
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: "You have already submitted this post to this campaign",
      });
      return;
    }

    const submission = await Submission.create({
      campaignId,
      creatorId: req.user.userId,
      postUrl: parsedUrl.toString(),
      views: 0,
      payout: 0,
      paid: false,
    });

    res.status(201).json({
      success: true,
      message: "Post submitted successfully",
      submission,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "This post has already been submitted",
      });
      return;
    }

    console.error("Create submission error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function listMySubmissions(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const submissions = await Submission.find({
      creatorId: req.user?.userId,
    })
      .populate("campaignId", "name platform budget milestones")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("List submissions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function updateSubmissionViews(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const { views } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({
      success: false,
      message: "Invalid submission ID",
    });
    return;
  }

  if (
    typeof views !== "number" ||
    !Number.isSafeInteger(views) ||
    views < 0
  ) {
    res.status(400).json({
      success: false,
      message: "Views must be a non-negative integer",
    });
    return;
  }

  const session = await mongoose.startSession();

  try {
    let result:
      | {
          views: number;
          payout: number;
          additionalPayout: number;
          remainingBudget: number;
        }
      | undefined;

      let viewsDecreased = false;
      let submissionNotFound = false;
      let campaignNotFound = false; 

    await session.withTransaction(async () => {

      result = undefined;
      viewsDecreased = false;
      submissionNotFound = false;
      campaignNotFound = false;

      const submission = await Submission.findById(id).session(session);

      if (!submission) {
        submissionNotFound = true;
        return;
      }

      if (views < submission.views) {
        viewsDecreased = true;
        return;
      }

      const campaign = await Campaign.findById(
        submission.campaignId
      ).session(session);

      if (!campaign) {
        campaignNotFound = true;
        return;
      }

      if (campaign.remainingBudget < 0 || campaign.spent > campaign.budget) {
        throw new Error("Campaign budget consistency check failed");
      }

      // Find the highest payout milestone reached.
      const eligiblePayout = calculateEligiblePayout(views, campaign.milestones);

//       // Never pay the same milestone earnings twice.
//       const additionalEligiblePayout = calculateAdditionalPayout(eligiblePayout, submission.payout,
//   campaign.remainingBudget
// );

      // The campaign budget is the absolute payout limit.
      const additionalPayout = calculateAdditionalPayout( eligiblePayout, submission.payout, campaign.remainingBudget);

      const updatedCampaign = await Campaign.findOneAndUpdate(
        {
          _id: campaign._id,
          remainingBudget: { $gte: additionalPayout },
        },
        {
          $inc: {
            spent: additionalPayout,
            remainingBudget: -additionalPayout,
          },
        },
        {
          new: true,
          session,
          runValidators: true,
        }
      );

      if (!updatedCampaign) {
        throw new Error("Campaign budget changed or is insufficient");
      }

      submission.views = views;
      submission.payout += additionalPayout;

      await submission.save({ session });

      campaign.spent = updatedCampaign.spent;
      campaign.remainingBudget = updatedCampaign.remainingBudget;

      result = {
        views: submission.views,
        payout: submission.payout,
        additionalPayout,
        remainingBudget: campaign.remainingBudget,
      };
    });

    if (submissionNotFound) {
      res.status(404).json({
        success: false,
        message: "Submission not found",
      });
      return;
    }

    if (campaignNotFound) {
      res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
      return;
    }

    if (viewsDecreased) {
      res.status(400).json({
        success: false,
        message: "Views cannot be lower than the current view count",
      });
      return;
    }

    if (!result) {
      res.status(500).json({
        success: false,
        message: "Unable to update views and calculate payout",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Views updated successfully",
      submission: result,
    });
  } catch (error) {
    console.error("Update views error:", error);

    if (!res.headersSent) {

      const mongoError = error as {
      code?: number;
      errorLabels?: string[];
      hasErrorLabel?: (label: string) => boolean;
    };

      const isTransactionConflict =
        mongoError.code === 112 ||
        mongoError.code === 251 ||
        mongoError.hasErrorLabel?.("TransientTransactionError") === true ||
        mongoError.hasErrorLabel?.("UnknownTransactionCommitResult") === true ||
        mongoError.errorLabels?.includes("TransientTransactionError") === true ||
        mongoError.errorLabels?.includes("UnknownTransactionCommitResult") === true;

      if (isTransactionConflict) {
        res.status(503).json({
          success: false,
          message: "The payout could not be completed because of a temporary database conflict. Please retry the request.",
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Unable to update views and calculate payout",
      });
    }
  } finally {
    await session.endSession();
  }
}