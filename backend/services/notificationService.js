const Notification = require("../models/Notification")
const User = require("../models/User")

class NotificationService {
  // Create new notification
  async createNotification(notificationData) {
    try {
      // Verify user exists
      const user = await User.findById(notificationData.user_id)
      if (!user) {
        throw new Error("User not found")
      }

      const notification = new Notification(notificationData)
      await notification.save()
      return notification
    } catch (error) {
      throw error
    }
  }

  // Get notifications for user
  async getNotificationsByUserId(userId, options = {}) {
    try {
      const { page = 1, limit = 20, is_read, type } = options

      const filter = { user_id: userId }
      if (is_read !== undefined) filter.is_read = is_read
      if (type) filter.type = type

      const notifications = await Notification.find(filter)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ created_at: -1 })

      const total = await Notification.countDocuments(filter)

      return {
        notifications,
        pagination: {
          current_page: Number.parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_notifications: total,
          per_page: Number.parseInt(limit),
        },
      }
    } catch (error) {
      throw error
    }
  }

  // Get notification by ID
  async getNotificationById(id) {
    try {
      const notification = await Notification.findById(id)
  .populate("user_id", "name last_name email")


      if (!notification) {
        throw new Error("Notification not found")
      }

      return notification
    } catch (error) {
      throw error
    }
  }

  // Mark notification as read
  async markAsRead(id) {
    try {
      const notification = await Notification.findByIdAndUpdate(
  id,
  {
    is_read: true,
    updated_at: new Date(),
  },
  { new: true },
)


      if (!notification) {
        throw new Error("Notification not found")
      }

      return notification
    } catch (error) {
      throw error
    }
  }

  // Mark all notifications as read for user
  async markAllAsReadForUser(userId) {
    try {
      const result = await Notification.updateMany(
        { user_id: userId, is_read: false },
        {
          is_read: true,
          updated_at: new Date(),
        },
      )

      return result
    } catch (error) {
      throw error
    }
  }

  // Get unread notifications count for user
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        user_id: userId,
        is_read: false,
      })

      return count
    } catch (error) {
      throw error
    }
  }

  // Delete notification
  async deleteNotification(id) {
    try {
      const notification = await Notification.findByIdAndDelete(id)
      if (!notification) {
        throw new Error("Notification not found")
      }
      return notification
    } catch (error) {
      throw error
    }
  }

  // Delete all notifications for user
  async deleteAllForUser(userId) {
    try {
      const result = await Notification.deleteMany({ user_id: userId })
      return result
    } catch (error) {
      throw error
    }
  }

  // Create bulk notifications
  async createBulkNotifications(userIds, notificationData) {
    try {
      const notifications = userIds.map((userId) => ({
        ...notificationData,
        user_id: userId,
      }))

      const createdNotifications = await Notification.insertMany(notifications)
      return createdNotifications
    } catch (error) {
      throw error
    }
  }

  // Get notifications by type
  async getNotificationsByType(type, options = {}) {
    try {
      const { page = 1, limit = 20 } = options

      const notifications = await Notification.find({ type })
        .populate("user_id", "name last_name email")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ created_at: -1 })

      const total = await Notification.countDocuments({ type })

      return {
        notifications,
        pagination: {
          current_page: Number.parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_notifications: total,
          per_page: Number.parseInt(limit),
        },
      }
    } catch (error) {
      throw error
    }
  }
}

module.exports = new NotificationService()
