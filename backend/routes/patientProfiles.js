const express = require("express")
const router = express.Router()
const patientProfileController = require("../controllers/patientProfileController")

// GET /api/patient-profiles - Get all patient profiles
router.get("/", patientProfileController.getAllPatientProfiles)

// GET /api/patient-profiles/:userId - Get patient profile by user ID
router.get("/:userId", patientProfileController.getPatientProfileByUserId)

// POST /api/patient-profiles - Create patient profile
router.post("/", patientProfileController.createPatientProfile)

// PUT /api/patient-profiles/:userId - Update patient profile
router.put("/:userId", patientProfileController.updatePatientProfile)

// DELETE /api/patient-profiles/:userId - Delete patient profile
router.delete("/:userId", patientProfileController.deletePatientProfile)

module.exports = router
