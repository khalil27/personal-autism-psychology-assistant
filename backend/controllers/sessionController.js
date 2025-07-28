const sessionService = require("../services/sessionService");

exports.createSession = async (req, res) => {
  try {
    const sessionData = req.body;

    if (req.user.role === "patient") {
      // Patient ne peut pas choisir un autre patient_id
      sessionData.patient_id = req.user.id;
      sessionData.status = "pending";
    } else if (req.user.role === "doctor" || req.user.role === "admin") {
      // par défaut active pour doctor/admin
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
