const Report = require("../models/Report")
const Session = require("../models/Session")

class ReportService {

// Create new report
async createReport(reportData) {
  try {
    // Vérifier que la session existe
    const session = await Session.findById(reportData.session_id)
    if (!session) {
      throw new Error("Session not found");
    }

    // Construire le rapport structuré selon le schema mongoose
    const structuredReport = {
      session_id: reportData.session_id,
      patient_id: reportData.patient_id,
      overview: {
        name: reportData.overview?.name || "Unknown",
        age: reportData.overview?.age || null,
        gender: reportData.overview?.gender || "",
        occupation: reportData.overview?.occupation || "",
        education_level: reportData.overview?.education_level || "",
        marital_status: reportData.overview?.marital_status || "",
        session_info: reportData.overview?.session_info || "",
        initial_diagnosis: reportData.overview?.initial_diagnosis || "",
        scores: reportData.overview?.scores || []
      },
      narrative: {
        description: reportData.narrative?.description || "",
        symptoms_observed: reportData.narrative?.symptoms_observed || [],
        physical_markers: reportData.narrative?.physical_markers || [],
        behavioral_markers: reportData.narrative?.behavioral_markers || []
      },
      risk_indicators: {
        suicidal_ideation: reportData.risk_indicators?.suicidal_ideation || "",
        substance_use: reportData.risk_indicators?.substance_use || "",
        pregnancy: reportData.risk_indicators?.pregnancy || "",
        family_history: reportData.risk_indicators?.family_history || "",
        other_risks: reportData.risk_indicators?.other_risks || []
      },
      clinical_inference: {
        primary_diagnosis: reportData.clinical_inference?.primary_diagnosis || "",
        differential_diagnoses: reportData.clinical_inference?.differential_diagnoses || [],
        recommendations: reportData.clinical_inference?.recommendations || []
      },
      dialogue: reportData.dialogue || [],
      doctor_notes: reportData.doctor_notes || "",
      notified_to_doctor: reportData.notified_to_doctor || false
    };

    // Enregistrer
    const report = new Report(structuredReport);
    await report.save();
    return report;
  } catch (error) {
    throw error;
  }
}



// Get all reports
async getAllReports(options = {}) {
  try {
    const { page = 1, limit = 10, notified_to_doctor, session_id } = options

    // 1️⃣ Construire le filtre
    const filter = {}
    if (notified_to_doctor !== undefined) {
      filter.notified_to_doctor = notified_to_doctor
    }
    if (session_id) {
      filter.session_id = session_id
    }

    // 2️⃣ Récupérer les rapports
    const reports = await Report.find(filter)
      .populate({
        path: "session_id",
        populate: [
          { path: "patient_id", select: "name last_name email" },
          { path: "doctor_id", select: "name last_name email" },
        ],
      })
      .limit(Number(limit))
      .skip((page - 1) * limit)
      .sort({ created_at: -1 })

    // 3️⃣ Compter le total
    const total = await Report.countDocuments(filter)

    // 4️⃣ Retourner la structure complète
    return {
      reports: reports.map((r) => ({
        id: r.id,
        session: r.session_id,
        overview: r.overview,
        narrative: r.narrative,
        assessment: r.assessment,
        risk_indicators: r.risk_indicators,
        dialogue: r.dialogue,
        conclusion: r.conclusion,
        doctor_notes: r.doctor_notes,
        notified_to_doctor: r.notified_to_doctor,
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
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

    // Retourner la structure enrichie
    return {
      id: report.id,
      session: report.session_id,
      overview: report.overview,
      narrative: report.narrative,
      assessment: report.assessment,
      risk_indicators: report.risk_indicators,
      dialogue: report.dialogue,
      conclusion: report.conclusion,
      doctor_notes: report.doctor_notes,
      notified_to_doctor: report.notified_to_doctor,
      created_at: report.created_at,
      updated_at: report.updated_at,
    }
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

    if (!report) {
      throw new Error("Report not found for this session")
    }

    // Retourner un objet propre avec la nouvelle structure
    return {
      id: report.id,
      session: report.session_id,
      overview: report.overview,
      narrative: report.narrative,
      assessment: report.assessment,
      risk_indicators: report.risk_indicators,
      dialogue: report.dialogue,
      conclusion: report.conclusion,
      doctor_notes: report.doctor_notes,
      notified_to_doctor: report.notified_to_doctor,
      created_at: report.created_at,
      updated_at: report.updated_at,
    }
  } catch (error) {
    throw error
  }
}

// Update report
async updateReport(id, updateData) {
  try {
    const report = await Report.findOneAndUpdate(
      { id },
      { $set: { ...updateData, updated_at: new Date() } },
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

    // Retourner un objet bien structuré
    return {
      id: report.id,
      session: report.session_id,
      overview: report.overview,
      narrative: report.narrative,
      assessment: report.assessment,
      risk_indicators: report.risk_indicators,
      dialogue: report.dialogue,
      conclusion: report.conclusion,
      doctor_notes: report.doctor_notes,
      notified_to_doctor: report.notified_to_doctor,
      created_at: report.created_at,
      updated_at: report.updated_at,
    }
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
        $set: {
          notified_to_doctor: true,
          updated_at: new Date(),
        },
      },
      { new: true }
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

    // Retourner un objet formaté comme dans les autres services
    return {
      id: report.id,
      session: report.session_id,
      overview: report.overview,
      narrative: report.narrative,
      assessment: report.assessment,
      risk_indicators: report.risk_indicators,
      dialogue: report.dialogue,
      conclusion: report.conclusion,
      doctor_notes: report.doctor_notes,
      notified_to_doctor: report.notified_to_doctor,
      created_at: report.created_at,
      updated_at: report.updated_at,
    }
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

    // Transformer chaque rapport pour renvoyer un format cohérent
    return reports.map(report => ({
      id: report.id,
      session: report.session_id,
      overview: report.overview,
      narrative: report.narrative,
      assessment: report.assessment,
      risk_indicators: report.risk_indicators,
      dialogue: report.dialogue,
      conclusion: report.conclusion,
      doctor_notes: report.doctor_notes,
      notified_to_doctor: report.notified_to_doctor,
      created_at: report.created_at,
      updated_at: report.updated_at,
    }))
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

    return { message: "Report deleted successfully" }
  } catch (error) {
    throw error
  }
}

// Get reports by patient ID
async getReportsByPatientId(patientId) {
  try {
    const reports = await Report.find({ patient_id: patientId })
      .populate({
        path: "session_id",
        populate: [
          { path: "patient_id", select: "name last_name email" },
          { path: "doctor_id", select: "name last_name email" },
        ],
      })
      .sort({ created_at: -1 });

    if (!reports || reports.length === 0) {
      throw new Error("No reports found for this patient");
    }

    // Retourner un tableau propre avec les rapports
    return reports.map((report) => ({
      id: report.id,
      session: report.session_id,
      overview: report.overview,
      narrative: report.narrative,
      assessment: report.assessment,
      risk_indicators: report.risk_indicators,
      dialogue: report.dialogue,
      conclusion: report.conclusion,
      doctor_notes: report.doctor_notes,
      notified_to_doctor: report.notified_to_doctor,
      created_at: report.created_at,
      updated_at: report.updated_at,
    }));
  } catch (error) {
    throw error;
  }
}

}

module.exports = new ReportService()
