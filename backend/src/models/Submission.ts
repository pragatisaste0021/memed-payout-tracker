import mongoose, { Document, Schema } from "mongoose";

export interface ISubmission extends Document {
  campaignId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  postUrl: string;
  views: number;
  payout: number;
  paid: boolean;
}

const submissionSchema = new Schema<ISubmission>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postUrl: {
      type: String,
      required: true,
      trim: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    payout: {
      type: Number,
      default: 0,
      min: 0,
    },
    paid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

submissionSchema.index(
  { campaignId: 1, creatorId: 1, postUrl: 1 },
  { unique: true }
);

export default mongoose.model<ISubmission>("Submission", submissionSchema);