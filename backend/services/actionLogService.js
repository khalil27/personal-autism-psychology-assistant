const ActionLog = require("../models/ActionLog")
const User = require("../models/User")

class ActionLogService {
  // Create new action log
  async createActionLog(logData) {
    try {
      // Verify user exists
      const user = await User.findOne({ id: logData.user_id })
      if (!user) {
        throw new Error("User not found")
      }

      const log = new ActionLog(logData)
      await log.save()
      return log
    } catch (error) {
      throw error
    }
  }

  // Get action logs with filtering
  async getActionLogs(options = {}) {
    try {
      const { page = 1, limit = 50, user_id, action_type, start_date, end_date, target_id } = options

      const filter = {}
      if (user_id) filter.user_id = user_id
      if (action_type) filter.action_type = action_type
      if (target_id) filter.target_id = target_id

      // Date range filtering
      if (start_date || end_date) {
        filter.timestamp = {}
        if (start_date) filter.timestamp.$gte = new Date(start_date)
        if (end_date) filter.timestamp.$lte = new Date(end_date)
      }

      const logs = await ActionLog.find(filter)
        .populate("user_id", "name last_name email role")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ timestamp: -1 })

      const total = await ActionLog.countDocuments(filter)

      return {
        logs,
        pagination: {
          current_page: Number.parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_logs: total,
          per_page: Number.parseInt(limit),
        },
      }
    } catch (error) {
      throw error
    }
  }

  // Get action log by ID
  async getActionLogById(id) {
    try {
      const log = await ActionLog.findOne({ id }).populate("user_id", "name last_name email role")

      if (!log) {
        throw new Error("Action log not found")
      }

      return log
    } catch (error) {
      throw error
    }
  }

  // Get logs by user
  async getLogsByUser(userId, options = {}) {
    try {
      const { page = 1, limit = 50, action_type } = options

      const filter = { user_id: userId }
      if (action_type) filter.action_type = action_type

      const logs = await ActionLog.find(filter)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ timestamp: -1 })

      const total = await ActionLog.countDocuments(filter)

      return {
        logs,
        pagination: {
          current_page: Number.parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_logs: total,
          per_page: Number.parseInt(limit),
        },
      }
    } catch (error) {
      throw error
    }
  }

  // Get logs by action type
  async getLogsByActionType(actionType, options = {}) {
    try {
      const { page = 1, limit = 50 } = options

      const logs = await ActionLog.find({ action_type: actionType })
        .populate("user_id", "name last_name email role")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ timestamp: -1 })

      const total = await ActionLog.countDocuments({ action_type: actionType })

      return {
        logs,
        pagination: {
          current_page: Number.parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_logs: total,
          per_page: Number.parseInt(limit),
        },
      }
    } catch (error) {
      throw error
    }
  }

  // Get recent activity
  async getRecentActivity(options = {}) {
    try {
      const { limit = 20, hours = 24 } = options

      const timeThreshold = new Date()
      timeThreshold.setHours(timeThreshold.getHours() - hours)

      const logs = await ActionLog.find({
        timestamp: { $gte: timeThreshold },
      })
        .populate("user_id", "name last_name email role")
        .limit(limit)
        .sort({ timestamp: -1 })

      return logs
    } catch (error) {
      throw error
    }
  }

  // Delete old logs (cleanup)
  async deleteOldLogs(daysOld = 90) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await ActionLog.deleteMany({
        timestamp: { $lt: cutoffDate },
      })

      return result
    } catch (error) {
      throw error
    }
  }

  // Get activity statistics
  async getActivityStats(options = {}) {
    try {
      const { start_date, end_date } = options

      const matchStage = {}
      if (start_date || end_date) {
        matchStage.timestamp = {}
        if (start_date) matchStage.timestamp.$gte = new Date(start_date)
        if (end_date) matchStage.timestamp.$lte = new Date(end_date)
      }

      const stats = await ActionLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$action_type",
            count: { $sum: 1 },
            latest: { $max: "$timestamp" },
          },
        },
        { $sort: { count: -1 } },
      ])

      return stats
    } catch (error) {
      throw error
    }
  }
}

module.exports = new ActionLogService()
