const Session = require("../models/Session")
const User = require("../models/User")
const { RoomServiceClient, AccessToken } = require("livekit-server-sdk");
const { spawn } = require("child_process");
require("dotenv").config()

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

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

    async acceptSession(id) {
    // 1. Récupérer la session
    const session = await Session.findOne({ _id: id });
    if (!session) throw new Error("Session not found");

    // 2. Passer en "active"
    session.status = "active";
    await session.save();

    // 3. Créer une room LiveKit
    const roomName = `session_${session.id}`;
    await roomService.createRoom({
      name: roomName,
      emptyTimeout: 300, // 5 min
      maxParticipants: 2,
    });

    // 4. Lancer ton backend Python avec le nom de la room
    spawn("python", ["assistant.py"], {
      env: {
        ...process.env,
        LIVEKIT_ROOM: roomName,
      },
      stdio: "inherit",
    });

    // 5. Générer un token JWT LiveKit pour le patient
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: session.patient_id,
    });
    at.addGrant({ roomJoin: true, room: roomName });

    const token = at.toJwt();

    return {
      message: "Session accepted",
      room_name: roomName,
      join_token: token,
      session,
    };
  }
}

module.exports = new SessionService()
