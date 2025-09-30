const Session = require("../models/Session")
const User = require("../models/User")
const patientProfileService = require("../services/patientProfileService");
const { LiveKitServerSDK } = require('livekit-server-sdk');
const mongoose = require("mongoose");
const fetch = require("node-fetch");
require("dotenv").config()


class SessionService {
  // Create new session
async createSession(sessionData) {
  try {
    // ✅ Corriger ici : utiliser _id au lieu de id
    const patient = await User.findOne({ _id: sessionData.patient_id });
    const doctor = await User.findOne({ _id: sessionData.doctor_id });

    if (!patient || patient.role !== "patient") {
      throw new Error("Invalid patient ID");
    }
    if (!doctor || doctor.role !== "doctor") {
      throw new Error("Invalid doctor ID");
    }

    const session = new Session(sessionData);
    await session.save();
    return session;
  } catch (error) {
    throw error;
  }
}


  // Get all sessions with filtering
  async getAllSessions(options = {}) {
    try {
      const { page = 1, limit = 10, status, patient_id, doctor_id, start_date, end_date } = options

      const filter = {}
      if (status) filter.status = status
      if (patient_id) filter.patient_id = patient_id
      if (doctor_id) filter.doctor_id = doctor_id

      // Date range filtering
      if (start_date || end_date) {
        filter.start_time = {}
        if (start_date) filter.start_time.$gte = new Date(start_date)
        if (end_date) filter.start_time.$lte = new Date(end_date)
      }

      const sessions = await Session.find(filter)
        .populate("patient_id", "name last_name email")
        .populate("doctor_id", "name last_name email")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ start_time: -1 })

      const total = await Session.countDocuments(filter)

      return {
        sessions,
        pagination: {
          current_page: Number.parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_sessions: total,
          per_page: Number.parseInt(limit),
        },
      }
    } catch (error) {
      throw error
    }
  }

  // Get session by ID
  async getSessionById(id) {
    try {
      const session = await Session.findOne({ _id: id })
        .populate("patient_id", "name last_name email")
        .populate("doctor_id", "name last_name email")

      if (!session) {
        throw new Error("Session not found")
      }

      return session
    } catch (error) {
      throw error
    }
  }

  // Update session
  async updateSession(id, updateData) {
    try {
      const session = await Session.findOneAndUpdate(
        { _id: id },
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true },
      )
        .populate("patient_id", "name last_name email")
        .populate("doctor_id", "name last_name email")

      if (!session) {
        throw new Error("Session not found")
      }

      return session
    } catch (error) {
      throw error
    }
  }

  // End session
  async endSession(id) {
    try {
      const session = await Session.findOneAndUpdate(
        { _id: id },
        {
          status: "completed",
          end_time: new Date(),
          updated_at: new Date(),
        },
        { new: true },
      )

      if (!session) {
        throw new Error("Session not found")
      }

      return session
    } catch (error) {
      throw error
    }
  }

  // Cancel session
  async cancelSession(id) {
    try {
      const session = await Session.findOneAndUpdate(
        { _id: id },
        {
          status: "canceled",
          updated_at: new Date(),
        },
        { new: true },
      )

      if (!session) {
        throw new Error("Session not found")
      }

      return session
    } catch (error) {
      throw error
    }
  }

  // Get sessions by patient
  async getSessionsByPatient(patientId) {
    try {
      const sessions = await Session.find({ patient_id: patientId })
        .populate("doctor_id", "name last_name email")
        .sort({ start_time: -1 })

      return sessions
    } catch (error) {
      throw error
    }
  }

  // Get sessions by doctor
  async getSessionsByDoctor(doctorId) {
    try {
      const sessions = await Session.find({ doctor_id: doctorId })
        .populate("patient_id", "name last_name email")
        .sort({ start_time: -1 })

      return sessions
    } catch (error) {
      throw error
    }
  }

  // Get active sessions
  async getActiveSessions() {
    try {
      const sessions = await Session.find({ status: "active" })
        .populate("patient_id", "name last_name email")
        .populate("doctor_id", "name last_name email")
        .sort({ start_time: -1 })

      return sessions
    } catch (error) {
      throw error
    }
  }

async joinSession(sessionId, patientId) {
  // 🔹 Cherche par champ "id", pas _id
  const session = await Session.findOne({ id: sessionId });
  if (!session) throw new Error("Session not found");

  if (!session.patient_id || session.patient_id !== patientId) {
    throw new Error("Unauthorized");
  }

  if (session.status !== "active") {
    throw new Error("Session not active");
  }

  const roomName = session.id;

  const patientProfile = await patientProfileService.getPatientProfileByUserId(patientId);
  if (!patientProfile) {
    throw new Error("Patient profile not found");
  }

  const pythonTokenUrl = `${process.env.PYTHON_BACKEND_URL}/getConnectionDetails`;
  const tokenResp = await fetch(pythonTokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ room: roomName, identity: patientId }),
  });

  if (!tokenResp.ok) {
    const errorText = await tokenResp.text();
    throw new Error(`Failed to get LiveKit token: ${errorText}`);
  }

  const tokenData = await tokenResp.json();

  session.room_name = roomName;
  session.join_token = tokenData.participantToken;
  await session.save();

  const pythonWorkerUrl = `${process.env.PYTHON_BACKEND_URL}/connectAgent`;
  const workerResp = await fetch(pythonWorkerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      room: roomName,
      identity: "assistant_psychologique",
      profile: patientProfile,
    }),
  });

  if (!workerResp.ok) {
    const errorText = await workerResp.text();
    console.warn(`Failed to start AI Worker: ${errorText}`);
  }

  return {
    room_name: roomName,
    join_token: tokenData.participantToken,
    server_url: tokenData.serverUrl,
    session_id: session.id,
  };
}
}

module.exports = new SessionService()
