const express = require("express");
const router = express.Router();
const patientProfileController = require("../controllers/patientProfileController");
const { authenticateToken, authorizeRoles } = require("../middlewares/authMiddleware");

// GET all profiles — admin & doctor only
router.get("/", authenticateToken, authorizeRoles("admin", "doctor"), patientProfileController.getAllPatientProfiles);

// GET one profile — owner, doctor (if assigned), or admin
router.get("/:userId", authenticateToken, patientProfileController.getPatientProfileByUserId);

// POST create profile — patient or admin
router.post("/", authenticateToken, authorizeRoles("patient", "admin"), patientProfileController.createPatientProfile);

// PUT update profile — owner or admin
router.put("/:userId", authenticateToken, (req, res, next) => {
  const userId = req.params.userId;
  const { id, role } = req.user;
  if (role === "admin" || id === userId) return next();
  res.status(403).json({ message: "Forbidden" });
}, patientProfileController.updatePatientProfile);

// DELETE profile — admin only
router.delete("/:userId", authenticateToken, authorizeRoles("admin"), patientProfileController.deletePatientProfile);

module.exports = router;

