const mongoose = require("mongoose")
const { v4: uuidv4 } = require("uuid")

const reportSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    session_id: {
      type: String,
      required: true,
      ref: "Session",
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    doctor_notes: {
      type: String,
      default: "",
    },
    notified_to_doctor: {
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

// Index for better query performance
reportSchema.index({ session_id: 1 })
reportSchema.index({ notified_to_doctor: 1 })

module.exports = mongoose.model("Report", reportSchema)
