const mongoose = require("mongoose")

const patientProfileSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      ref: "User",
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 150,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    occupation: {
      type: String,
      enum: ["student", "employed", "unemployed", "other"],
      required: true,
    },
    education_level: {
      type: String,
      required: true,
      trim: true,
    },
    marital_status: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      maxlength: 2000,
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
patientProfileSchema.index({ user_id: 1 })

module.exports = mongoose.model("PatientProfile", patientProfileSchema)
