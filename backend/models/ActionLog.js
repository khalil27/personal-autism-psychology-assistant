const mongoose = require("mongoose")
const { v4: uuidv4 } = require("uuid")

const actionLogSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    user_id: {
      type: String,
      required: true,
      ref: "User",
    },
    action_type: {
      type: String,
      required: true,
      trim: true,
    },
    target_id: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

// Indexes for better query performance
actionLogSchema.index({ user_id: 1 })
actionLogSchema.index({ action_type: 1 })
actionLogSchema.index({ timestamp: -1 })

module.exports = mongoose.model("ActionLog", actionLogSchema)
