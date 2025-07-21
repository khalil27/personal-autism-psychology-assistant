const User = require("../models/User")
const bcrypt = require("bcryptjs")
const Joi = require("joi")

// Validation schema
const userValidationSchema = Joi.object({
  name: Joi.string().required().max(100).trim(),
  last_name: Joi.string().required().max(100).trim(),
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("patient", "doctor", "admin").default("patient"),
})

const updateUserValidationSchema = Joi.object({
  name: Joi.string().max(100).trim(),
  last_name: Joi.string().max(100).trim(),
  email: Joi.string().email().lowercase().trim(),
  role: Joi.string().valid("patient", "doctor", "admin"),
  is_active: Joi.boolean(),
})

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { error, value } = userValidationSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details[0].message,
      })
    }

    const { name, last_name, email, password, role } = value

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({
        error: "User already exists",
        message: "A user with this email already exists",
      })
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

    res.status(201).json({
      message: "User created successfully",
      user: user.toJSON(),
    })
  } catch (error) {
    console.error("Create user error:", error)
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create user",
    })
  }
}

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, is_active } = req.query

    // Build filter object
    const filter = {}
    if (role) filter.role = role
    if (is_active !== undefined) filter.is_active = is_active === "true"

    const users = await User.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ created_at: -1 })

    const total = await User.countDocuments(filter)

    res.status(200).json({
      users,
      pagination: {
        current_page: Number.parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_users: total,
        per_page: Number.parseInt(limit),
      },
    })
  } catch (error) {
    console.error("Get all users error:", error)
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch users",
    })
  }
}

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findOne({ id })
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "No user found with the provided ID",
      })
    }

    res.status(200).json({ user })
  } catch (error) {
    console.error("Get user by ID error:", error)
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch user",
    })
  }
}

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params

    const { error, value } = updateUserValidationSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details[0].message,
      })
    }

    // Check if email is being updated and if it already exists
    if (value.email) {
      const existingUser = await User.findOne({ email: value.email, id: { $ne: id } })
      if (existingUser) {
        return res.status(409).json({
          error: "Email already exists",
          message: "Another user with this email already exists",
        })
      }
    }

    const user = await User.findOneAndUpdate(
      { id },
      { ...value, updated_at: new Date() },
      { new: true, runValidators: true },
    )

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "No user found with the provided ID",
      })
    }

    res.status(200).json({
      message: "User updated successfully",
      user,
    })
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update user",
    })
  }
}

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findOneAndDelete({ id })
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "No user found with the provided ID",
      })
    }

    res.status(200).json({
      message: "User deleted successfully",
      deleted_user: user,
    })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete user",
    })
  }
}
