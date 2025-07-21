const patientProfileService = require("../services/patientProfileService")
const Joi = require("joi")

// Validation schema
const patientProfileValidationSchema = Joi.object({
  user_id: Joi.string().required(),
  age: Joi.number().integer().min(0).max(150).required(),
  gender: Joi.string().valid("male", "female", "other").required(),
  occupation: Joi.string().valid("student", "employed", "unemployed", "other").required(),
  education_level: Joi.string().required().trim(),
  marital_status: Joi.string().required().trim(),
  notes: Joi.string().max(2000).default(""),
})

const updatePatientProfileValidationSchema = Joi.object({
  age: Joi.number().integer().min(0).max(150),
  gender: Joi.string().valid("male", "female", "other"),
  occupation: Joi.string().valid("student", "employed", "unemployed", "other"),
  education_level: Joi.string().trim(),
  marital_status: Joi.string().trim(),
  notes: Joi.string().max(2000),
})

// Create patient profile
exports.createPatientProfile = async (req, res) => {
  try {
    const { error, value } = patientProfileValidationSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details[0].message,
      })
    }

    const profile = await patientProfileService.createPatientProfile(value)

    res.status(201).json({
      message: "Patient profile created successfully",
      profile,
    })
  } catch (error) {
    console.error("Create patient profile error:", error)

    if (error.message.includes("not found") || error.message.includes("patient role")) {
      return res.status(400).json({
        error: "Invalid request",
        message: error.message,
      })
    }

    if (error.message.includes("already exists")) {
      return res.status(409).json({
        error: "Profile already exists",
        message: error.message,
      })
    }

    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create patient profile",
    })
  }
}

// Get all patient profiles
exports.getAllPatientProfiles = async (req, res) => {
  try {
    const result = await patientProfileService.getAllPatientProfiles(req.query)
    res.status(200).json(result)
  } catch (error) {
    console.error("Get all patient profiles error:", error)
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch patient profiles",
    })
  }
}

// Get patient profile by user ID
exports.getPatientProfileByUserId = async (req, res) => {
  try {
    const profile = await patientProfileService.getPatientProfileByUserId(req.params.userId)
    res.status(200).json({ profile })
  } catch (error) {
    console.error("Get patient profile error:", error)

    if (error.message === "Patient profile not found") {
      return res.status(404).json({
        error: "Profile not found",
        message: "No patient profile found for the provided user ID",
      })
    }

    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch patient profile",
    })
  }
}

// Update patient profile
exports.updatePatientProfile = async (req, res) => {
  try {
    const { error, value } = updatePatientProfileValidationSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details[0].message,
      })
    }

    const profile = await patientProfileService.updatePatientProfile(req.params.userId, value)

    res.status(200).json({
      message: "Patient profile updated successfully",
      profile,
    })
  } catch (error) {
    console.error("Update patient profile error:", error)

    if (error.message === "Patient profile not found") {
      return res.status(404).json({
        error: "Profile not found",
        message: "No patient profile found for the provided user ID",
      })
    }

    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update patient profile",
    })
  }
}

// Delete patient profile
exports.deletePatientProfile = async (req, res) => {
  try {
    const profile = await patientProfileService.deletePatientProfile(req.params.userId)

    res.status(200).json({
      message: "Patient profile deleted successfully",
      deleted_profile: profile,
    })
  } catch (error) {
    console.error("Delete patient profile error:", error)

    if (error.message === "Patient profile not found") {
      return res.status(404).json({
        error: "Profile not found",
        message: "No patient profile found for the provided user ID",
      })
    }

    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete patient profile",
    })
  }
}
