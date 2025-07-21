const express = require("express")
const router = express.Router()
const PatientProfile = require("../models/PatientProfile")

// GET /api/patient-profiles - Get all patient profiles
router.get("/", async (req, res) => {
  try {
    const profiles = await PatientProfile.find().populate("user_id", "name last_name email")
    res.status(200).json({ profiles })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patient profiles" })
  }
})

// GET /api/patient-profiles/:userId - Get patient profile by user ID
router.get("/:userId", async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ user_id: req.params.userId }).populate(
      "user_id",
      "name last_name email",
    )

    if (!profile) {
      return res.status(404).json({ error: "Patient profile not found" })
    }

    res.status(200).json({ profile })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patient profile" })
  }
})

// POST /api/patient-profiles - Create patient profile
router.post("/", async (req, res) => {
  try {
    const profile = new PatientProfile(req.body)
    await profile.save()
    res.status(201).json({ message: "Patient profile created successfully", profile })
  } catch (error) {
    res.status(400).json({ error: "Failed to create patient profile", details: error.message })
  }
})

// PUT /api/patient-profiles/:userId - Update patient profile
router.put("/:userId", async (req, res) => {
  try {
    const profile = await PatientProfile.findOneAndUpdate({ user_id: req.params.userId }, req.body, {
      new: true,
      runValidators: true,
    })

    if (!profile) {
      return res.status(404).json({ error: "Patient profile not found" })
    }

    res.status(200).json({ message: "Patient profile updated successfully", profile })
  } catch (error) {
    res.status(400).json({ error: "Failed to update patient profile", details: error.message })
  }
})

module.exports = router
