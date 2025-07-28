const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const sessionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    patient_id: {
      type: String,
      required: true,
      ref: "User",
    },
    doctor_id: {
      type: String,
      required: true,
      ref: "User",
    },
    start_time: {
      type: Date,
      required: true,
    },
    end_time: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "canceled"],
      default: "pending",
    },
    audio_transcript: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
sessionSchema.index({ patient_id: 1 });
sessionSchema.index({ doctor_id: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ start_time: 1 });

module.exports = mongoose.model("Session", sessionSchema);
