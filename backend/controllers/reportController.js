const ReportService = require("../services/reportService")

class ReportController {
  // Créer un nouveau rapport
  async createReport(req, res) {
    try {
      const reportData = req.body
      const report = await ReportService.createReport(reportData)
      return res.status(201).json({
        success: true,
        message: "Report created successfully",
        data: report,
      })
    } catch (error) {
      console.error("Error creating report:", error)
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create report",
      })
    }
  }

  // Récupérer tous les rapports
  async getAllReports(req, res) {
    try {
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        notified_to_doctor: req.query.notified_to_doctor,
        session_id: req.query.session_id,
      }

      const reports = await ReportService.getAllReports(options)
      return res.status(200).json({
        success: true,
        data: reports,
      })
    } catch (error) {
      console.error("Error fetching reports:", error)
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch reports",
      })
    }
  }

  // Récupérer un rapport par son ID
  async getReportById(req, res) {
    try {
      const { id } = req.params
      const report = await ReportService.getReportById(id)
      return res.status(200).json({
        success: true,
        data: report,
      })
    } catch (error) {
      console.error("Error fetching report by ID:", error)
      return res.status(404).json({
        success: false,
        message: error.message || "Report not found",
      })
    }
  }

  // Récupérer un rapport par l'ID de session
  async getReportBySessionId(req, res) {
    try {
      const { sessionId } = req.params
      const report = await ReportService.getReportBySessionId(sessionId)
      return res.status(200).json({
        success: true,
        data: report,
      })
    } catch (error) {
      console.error("Error fetching report by session ID:", error)
      return res.status(404).json({
        success: false,
        message: error.message || "Report not found for this session",
      })
    }
  }

    // Mettre à jour un rapport
  async updateReport(req, res) {
    try {
      const { id } = req.params
      const updateData = req.body

      const report = await ReportService.updateReport(id, updateData)

      return res.status(200).json({
        success: true,
        message: "Report updated successfully",
        data: report,
      })
    } catch (error) {
      console.error("Error updating report:", error)
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update report",
      })
    }
  }

    // Supprimer un rapport
  async deleteReport(req, res) {
    try {
      const { id } = req.params

      const result = await ReportService.deleteReport(id)

      return res.status(200).json({
        success: true,
        message: result.message,
      })
    } catch (error) {
      console.error("Error deleting report:", error)
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to delete report",
      })
    }
  }

   async getReportsByPatientId(patientId) {
    try {
      const reports = await ReportService.getReportsByPatientId(patientId);
      return reports;
    } catch (error) {
      throw new Error(error.message);
    }
  }

}

module.exports = new ReportController()
