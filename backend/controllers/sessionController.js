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

