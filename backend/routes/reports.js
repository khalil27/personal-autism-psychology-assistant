const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/reportController");
const { authenticateToken, authorizeRoles } = require("../middlewares/authMiddleware");

// ----------------- Routes des rapports -----------------

// GET /api/reports - Récupérer tous les rapports (admin & doctor seulement)
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin", "doctor"),
  async (req, res) => {
    try {
      const { page, limit, notified_to_doctor, session_id } = req.query;
      const result = await ReportController.getAllReports({
        page,
        limit,
        notified_to_doctor,
        session_id,
      });
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// GET /api/reports/:id - Récupérer un rapport par son ID
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("admin", "doctor", "patient"),
  async (req, res) => {
    try {
      const report = await ReportController.getReportById(req.params.id);
      res.status(200).json({ success: true, report });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }
);

// GET /api/reports/session/:sessionId - Récupérer un rapport par ID de session
router.get(
  "/session/:sessionId",
  authenticateToken,
  authorizeRoles("admin", "doctor", "patient"),
  async (req, res) => {
    try {
      const report = await ReportController.getReportBySessionId(req.params.sessionId);
      res.status(200).json({ success: true, report });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }
);

// POST /api/reports - Créer un nouveau rapport (depuis AI)
router.post("/", (req, res) => {
  ReportController.createReport(req, res);
});



// PUT /api/reports/:id - Mettre à jour un rapport (doctor & admin seulement)
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("doctor", "admin"),
  async (req, res) => {
    try {
      const updatedReport = await ReportController.updateReport(req.params.id, req.body);
      res.status(200).json({ success: true, report: updatedReport });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// DELETE /api/reports/:id - Supprimer un rapport (admin seulement)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const result = await ReportController.deleteReport(req.params.id);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
