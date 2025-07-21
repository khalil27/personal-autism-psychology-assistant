const User = require("../models/User")
const bcrypt = require("bcryptjs")
const mongoose = require("mongoose")

class UserService {
  // Create a new user
  async createUser(userData) {
    try {
      const { name, last_name, email, password, role } = userData

      // Check if user already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        throw new Error("User with this email already exists")
      }

      // Hash password
      const saltRounds = 12
      const password_hash = await bcrypt.hash(password, saltRounds)

      // Create user
      const user = new User({
        name,
        last_name,
        email,
        password_hash,
        role,
      })

      await user.save()
      return user
    } catch (error) {
      throw error
    }
  }

  // Get all users with pagination and filtering
  async getAllUsers(options = {}) {
    try {
      const { page = 1, limit = 10, role, is_active } = options

      // Build filter object
      const filter = {}
      if (role) filter.role = role
      if (is_active !== undefined) filter.is_active = is_active

      const users = await User.find(filter)
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ created_at: -1 })

      const total = await User.countDocuments(filter)

      return {
        users,
        pagination: {
          current_page: Number(page),
          total_pages: Math.ceil(total / limit),
          total_users: total,
          per_page: Number(limit),
        },
      }
    } catch (error) {
      throw error
    }
  }

  // Get user by ID (expects MongoDB ObjectId string)
  async getUserById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid user id")
      }
      const user = await User.findById(id)
      if (!user) {
        throw new Error("User not found")
      }
      return user
    } catch (error) {
      throw error
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email })
      return user
    } catch (error) {
      throw error
    }
  }

  // Update user by ID
  async updateUser(id, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid user id")
      }

      // Check if email is being updated and if it already exists in another user
      if (updateData.email) {
        const existingUser = await User.findOne({
          email: updateData.email,
          _id: { $ne: id },
        })
        if (existingUser) {
          throw new Error("Another user with this email already exists")
        }
      }

      const user = await User.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      )

      if (!user) {
        throw new Error("User not found")
      }

      return user
    } catch (error) {
      throw error
    }
  }

  // Delete user by ID
  async deleteUser(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid user id")
      }
      const user = await User.findByIdAndDelete(id)
      if (!user) {
        throw new Error("User not found")
      }
      return user
    } catch (error) {
      throw error
    }
  }

  // Update last login timestamp
  async updateLastLogin(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid user id")
      }
      const user = await User.findByIdAndUpdate(
        id,
        { last_login_at: new Date() },
        { new: true }
      )
      return user
    } catch (error) {
      throw error
    }
  }

  // Get users by role
  async getUsersByRole(role) {
    try {
      const users = await User.find({ role, is_active: true }).sort({ created_at: -1 })
      return users
    } catch (error) {
      throw error
    }
  }

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword)
    } catch (error) {
      throw error
    }
  }
}

module.exports = new UserService()
