const express = require("express")
const router = express.Router()
const ActionLog = require("../models/ActionLog")

// GET /api/action-logs - Get action logs
router.get("/", async (req, res) => {
  try {
    const { user_id, action_type, limit = 50 } = req.query
    const filter = {}

    if (user_id) filter.user_id = user_id
    if (action_type) filter.action_type = action_type

    const logs = await ActionLog.find(filter)
      .populate("user_id", "name last_name email")
      .sort({ timestamp: -1 })
      .limit(Number.parseInt(limit))

    res.status(200).json({ logs })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch action logs" })
  }
})

// POST /api/action-logs - Create new action log
router.post("/", async (req, res) => {
  try {
    const log = new ActionLog(req.body)
    await log.save()
    res.status(201).json({ message: "Action log created successfully", log })
  } catch (error) {
    res.status(400).json({ error: "Failed to create action log", details: error.message })
  }
})

module.exports = router
