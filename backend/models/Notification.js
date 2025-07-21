const mongoose = require("mongoose")
const { v4: uuidv4 } = require("uuid")

const notificationSchema = new mongoose.Schema(
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
    type: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
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
notificationSchema.index({ user_id: 1 })
notificationSchema.index({ is_read: 1 })
notificationSchema.index({ created_at: -1 })

module.exports = mongoose.model("Notification", notificationSchema)
