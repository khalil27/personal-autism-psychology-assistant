const express = require("express")
const router = express.Router()
const Session = require("../models/Session")

// GET /api/sessions - Get all sessions
router.get("/", async (req, res) => {
  try {
    const { status, patient_id, doctor_id } = req.query
    const filter = {}

    if (status) filter.status = status
    if (patient_id) filter.patient_id = patient_id
    if (doctor_id) filter.doctor_id = doctor_id

    const sessions = await Session.find(filter)
      .populate("patient_id", "name last_name email")
      .populate("doctor_id", "name last_name email")
      .sort({ start_time: -1 })

    res.status(200).json({ sessions })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions" })
  }
})

// POST /api/sessions - Create new session
router.post("/", async (req, res) => {
  try {
    const session = new Session(req.body)
    await session.save()
    res.status(201).json({ message: "Session created successfully", session })
  } catch (error) {
    res.status(400).json({ error: "Failed to create session", details: error.message })
  }
})

// PUT /api/sessions/:id - Update session
router.put("/:id", async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate({ id: req.params.id }, req.body, { new: true, runValidators: true })

    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }

    res.status(200).json({ message: "Session updated successfully", session })
  } catch (error) {
    res.status(400).json({ error: "Failed to update session", details: error.message })
  }
})

module.exports = router
