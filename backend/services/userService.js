const User = require("../models/User")
const bcrypt = require("bcryptjs")

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
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ created_at: -1 })

      const total = await User.countDocuments(filter)

      return {
        users,
        pagination: {
          current_page: Number.parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_users: total,
          per_page: Number.parseInt(limit),
        },
      }
    } catch (error) {
      throw error
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const user = await User.findOne({ id })
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

  // Update user
  async updateUser(id, updateData) {
    try {
      // Check if email is being updated and if it already exists
      if (updateData.email) {
        const existingUser = await User.findOne({
          email: updateData.email,
          id: { $ne: id },
        })
        if (existingUser) {
          throw new Error("Another user with this email already exists")
        }
      }

      const user = await User.findOneAndUpdate(
        { id },
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true },
      )

      if (!user) {
        throw new Error("User not found")
      }

      return user
    } catch (error) {
      throw error
    }
  }

  // Delete user
  async deleteUser(id) {
    try {
      const user = await User.findOneAndDelete({ id })
      if (!user) {
        throw new Error("User not found")
      }
      return user
    } catch (error) {
      throw error
    }
  }

  // Update last login
  async updateLastLogin(id) {
    try {
      const user = await User.findOneAndUpdate({ id }, { last_login_at: new Date() }, { new: true })
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
