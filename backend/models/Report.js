const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const scoreSchema = new mongoose.Schema({
  tool: { type: String, required: true },
  intake: { type: Number, required: true },
  current: { type: Number, required: true },
});

const dialogueSchema = new mongoose.Schema({
  speaker: { type: String, enum: ["AI", "Patient"], required: true },
  text: { type: String, required: true },
});

const reportSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, required: true },

    session_id: { type: String, required: true, ref: "Session" },
    patient_id: { type: String, required: true, ref: "PatientProfile" },
    generated_by: { type: String, default: "AI_Assistant" },
    status: { type: String, enum: ["draft", "finalized", "reviewed"], default: "draft" },
    version: { type: Number, default: 1 },
    notified_to_doctor: { type: Boolean, default: false },

    overview: {
      name: { type: String, required: true },
      age: { type: Number },
      gender: { type: String },
      occupation: { type: String },
      education_level: { type: String },
      marital_status: { type: String },
      session_info: { type: String },
      initial_diagnosis: { type: String },
      scores: [scoreSchema],
    },

    narrative: {
      description: { type: String },
      symptoms_observed: [String],
      physical_markers: [String],
      behavioral_markers: [String],
    },

    risk_indicators: {
      suicidal_ideation: { type: String },
      substance_use: { type: String },
      pregnancy: { type: String },
      family_history: { type: String },
      other_risks: [String],
    },

    clinical_inference: {
      primary_diagnosis: { type: String },
      differential_diagnoses: [String],
      recommendations: [String],
    },

    dialogue: [dialogueSchema],

    doctor_notes: { type: String, default: "" },
    doctor_reviewed_at: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes pour la recherche rapide
reportSchema.index({ session_id: 1 });
reportSchema.index({ patient_id: 1 });
reportSchema.index({ notified_to_doctor: 1 });

module.exports = mongoose.model("Report", reportSchema);
