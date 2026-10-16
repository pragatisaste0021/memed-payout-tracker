import mongoose, { Document, Schema } from "mongoose";

export type CampaignPlatform = "Instagram" | "YouTube";

export interface IMilestone {
  views: number;
  payout: number;
}

export interface ICampaign extends Document {
  name: string;
  platform: CampaignPlatform;
  budget: number;
  spent: number;
  remainingBudget: number;
  milestones: IMilestone[];
  brandId: mongoose.Types.ObjectId;
}

const milestoneSchema = new Schema<IMilestone>(
  {
    views: {
      type: Number,
      required: true,
      min: 1,
    },
    payout: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const campaignSchema = new Schema<ICampaign>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["Instagram", "YouTube"],
      required: true,
    },
    budget: {
      type: Number,
      required: true,
      min: 1,
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingBudget: {
      type: Number,
      required: true,
      min: 0,
    },
    milestones: {
      type: [milestoneSchema],
      required: true,
      validate: {
        validator: (milestones: IMilestone[]) => milestones.length > 0,
        message: "At least one milestone is required",
      },
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICampaign>("Campaign", campaignSchema);