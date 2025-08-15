const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const sessionController = require("../controllers/sessionController");
const { authenticateToken, authorizeRoles } = require("../middlewares/authMiddleware");

// ✅ GET /api/sessions - Récupérer les sessions (doctors, patients, admin)
router.get("/", authenticateToken, authorizeRoles("admin", "doctor", "patient"), async (req, res) => {
  try {
    const { status, patient_id, doctor_id } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (patient_id) filter.patient_id = patient_id;
    if (doctor_id) filter.doctor_id = doctor_id;

    const sessions = await Session.find(filter)
      .populate("patient_id", "name last_name email")
      .populate("doctor_id", "name last_name email")
      .sort({ start_time: -1 });

    res.status(200).json({ sessions });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// ✅ POST /api/sessions - Créer une session (doctors uniquement ou patients selon besoin)
router.post("/", authenticateToken, authorizeRoles("doctor", "patient"), sessionController.createSession);

// ✅ PUT /api/sessions/:id - Mettre à jour une session (doctor/admin)
router.put("/:id", authenticateToken, authorizeRoles("admin", "doctor"), async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate({ id: req.params.id }, req.body, { new: true, runValidators: true });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.status(200).json({ message: "Session updated successfully", session });
  } catch (error) {
    res.status(400).json({ error: "Failed to update session", details: error.message });
  }
});

router.post("/:sessionId/join", authenticateToken, authorizeRoles("patient"), sessionController.joinSession);


module.exports = router;
