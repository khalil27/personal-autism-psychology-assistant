const express = require("express")
const router = express.Router()
const Notification = require("../models/Notification")

// GET /api/notifications/:userId - Get notifications for user
router.get("/:userId", async (req, res) => {
  try {
    const { is_read } = req.query
    const filter = { user_id: req.params.userId }

    if (is_read !== undefined) filter.is_read = is_read === "true"

    const notifications = await Notification.find(filter).sort({ created_at: -1 })

    res.status(200).json({ notifications })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" })
  }
})

// POST /api/notifications - Create new notification
router.post("/", async (req, res) => {
  try {
    const notification = new Notification(req.body)
    await notification.save()
    res.status(201).json({ message: "Notification created successfully", notification })
  } catch (error) {
    res.status(400).json({ error: "Failed to create notification", details: error.message })
  }
})

// PUT /api/notifications/:id/read - Mark notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate({ id: req.params.id }, { is_read: true }, { new: true })

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" })
    }

    res.status(200).json({ message: "Notification marked as read", notification })
  } catch (error) {
    res.status(400).json({ error: "Failed to update notification" })
  }
})

module.exports = router
