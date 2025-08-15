const sessionService = require("../services/sessionService");

exports.createSession = async (req, res) => {
  try {
    console.log("user:", req.user);
    console.log("sessionData:", req.body);
    const sessionData = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        details: "User not authenticated",
      });
    }

    if (req.user.role === "patient") {
      sessionData.patient_id = req.user.id;
      sessionData.status = "pending";
    } else if (req.user.role === "doctor" || req.user.role === "admin") {
      sessionData.status = "active";
    }

    const session = await sessionService.createSession(sessionData);

    res.status(201).json({
      message: "Session created successfully",
      session,
    });
  } catch (error) {
    res.status(400).json({
      error: "Failed to create session",
      details: error.message,
    });
  }
};

exports.joinSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const patientId = req.user.id;

    // 🔹 Log des données entrantes
    console.log("Join request received:", { sessionId, patientId });

    const result = await sessionService.joinSession(sessionId, patientId);

    // 🔹 Log du résultat du service
    console.log("joinSession result:", result);

    res.status(200).json({
      message: "Room ready",
      room_name: result.room_name,
      join_token: result.join_token,
      server_url: process.env.LIVEKIT_URL,
    });
  } catch (error) {
    // 🔹 Log de l'erreur
    console.error("Failed to join session:", error.message, error.stack);

    res.status(400).json({ error: error.message });
  }
};


