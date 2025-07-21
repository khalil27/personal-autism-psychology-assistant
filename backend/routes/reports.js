const express = require("express")
const router = express.Router()
const Report = require("../models/Report")

// GET /api/reports - Get all reports
router.get("/", async (req, res) => {
  try {
    const reports = await Report.find().populate("session_id").sort({ created_at: -1 })
    res.status(200).json({ reports })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reports" })
  }
})

// POST /api/reports - Create new report
router.post("/", async (req, res) => {
  try {
    const report = new Report(req.body)
    await report.save()
    res.status(201).json({ message: "Report created successfully", report })
  } catch (error) {
    res.status(400).json({ error: "Failed to create report", details: error.message })
  }
})

module.exports = router
