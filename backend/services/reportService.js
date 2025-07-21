const Report = require("../models/Report")
const Session = require("../models/Session")

class ReportService {
  // Create new report
  async createReport(reportData) {
    try {
      // Verify session exists
      const session = await Session.findOne({ id: reportData.session_id })
      if (!session) {
        throw new Error("Session not found")
      }

      const report = new Report(reportData)
      await report.save()
      return report
    } catch (error) {
      throw error
    }
  }

  // Get all reports
  async getAllReports(options = {}) {
    try {
      const { page = 1, limit = 10, notified_to_doctor, session_id } = options

      const filter = {}
      if (notified_to_doctor !== undefined) filter.notified_to_doctor = notified_to_doctor
      if (session_id) filter.session_id = session_id

      const reports = await Report.find(filter)
        .populate({
          path: "session_id",
          populate: [
            { path: "patient_id", select: "name last_name email" },
            { path: "doctor_id", select: "name last_name email" },
          ],
        })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ created_at: -1 })

      const total = await Report.countDocuments(filter)

      return {
        reports,
        pagination: {
          current_page: Number.parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_reports: total,
          per_page: Number.parseInt(limit),
        },
      }
    } catch (error) {
      throw error
    }
  }

  // Get report by ID
  async getReportById(id) {
    try {
      const report = await Report.findOne({ id }).populate({
        path: "session_id",
        populate: [
          { path: "patient_id", select: "name last_name email" },
          { path: "doctor_id", select: "name last_name email" },
        ],
      })

      if (!report) {
        throw new Error("Report not found")
      }

      return report
    } catch (error) {
      throw error
    }
  }

  // Get report by session ID
  async getReportBySessionId(sessionId) {
    try {
      const report = await Report.findOne({ session_id: sessionId }).populate({
        path: "session_id",
        populate: [
          { path: "patient_id", select: "name last_name email" },
          { path: "doctor_id", select: "name last_name email" },
        ],
      })

      return report
    } catch (error) {
      throw error
    }
  }

  // Update report
  async updateReport(id, updateData) {
    try {
      const report = await Report.findOneAndUpdate(
        { id },
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true },
      ).populate({
        path: "session_id",
        populate: [
          { path: "patient_id", select: "name last_name email" },
          { path: "doctor_id", select: "name last_name email" },
        ],
      })

      if (!report) {
        throw new Error("Report not found")
      }

      return report
    } catch (error) {
      throw error
    }
  }

  // Mark report as notified to doctor
  async markAsNotified(id) {
    try {
      const report = await Report.findOneAndUpdate(
        { id },
        {
          notified_to_doctor: true,
          updated_at: new Date(),
        },
        { new: true },
      )

      if (!report) {
        throw new Error("Report not found")
      }

      return report
    } catch (error) {
      throw error
    }
  }

  // Get unnotified reports
  async getUnnotifiedReports() {
    try {
      const reports = await Report.find({ notified_to_doctor: false })
        .populate({
          path: "session_id",
          populate: [
            { path: "patient_id", select: "name last_name email" },
            { path: "doctor_id", select: "name last_name email" },
          ],
        })
        .sort({ created_at: -1 })

      return reports
    } catch (error) {
      throw error
    }
  }

  // Delete report
  async deleteReport(id) {
    try {
      const report = await Report.findOneAndDelete({ id })
      if (!report) {
        throw new Error("Report not found")
      }
      return report
    } catch (error) {
      throw error
    }
  }
}

module.exports = new ReportService()
