const userService = require("../services/userService")
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

    const user = await userService.createUser(value)

    res.status(201).json({
      message: "User created successfully",
      user: user.toJSON(),
    })
  } catch (error) {
    console.error("Create user error:", error)

    if (error.message === "User with this email already exists") {
      return res.status(409).json({
        error: "User already exists",
        message: error.message,
      })
    }

    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create user",
    })
  }
}

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const result = await userService.getAllUsers(req.query)
    res.status(200).json(result)
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
    const user = await userService.getUserById(req.params.id)
    res.status(200).json({ user })
  } catch (error) {
    console.error("Get user by ID error:", error)

    if (error.message === "User not found") {
      return res.status(404).json({
        error: "User not found",
        message: "No user found with the provided ID",
      })
    }

    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch user",
    })
  }
}

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { error, value } = updateUserValidationSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details[0].message,
      })
    }

    const user = await userService.updateUser(req.params.id, value)

    res.status(200).json({
      message: "User updated successfully",
      user,
    })
  } catch (error) {
    console.error("Update user error:", error)

    if (error.message === "User not found") {
      return res.status(404).json({
        error: "User not found",
        message: "No user found with the provided ID",
      })
    }

    if (error.message === "Another user with this email already exists") {
      return res.status(409).json({
        error: "Email already exists",
        message: error.message,
      })
    }

    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update user",
    })
  }
}

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await userService.deleteUser(req.params.id)

    res.status(200).json({
      message: "User deleted successfully",
      deleted_user: user,
    })
  } catch (error) {
    console.error("Delete user error:", error)

    if (error.message === "User not found") {
      return res.status(404).json({
        error: "User not found",
        message: "No user found with the provided ID",
      })
    }

    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete user",
    })
  }
}
