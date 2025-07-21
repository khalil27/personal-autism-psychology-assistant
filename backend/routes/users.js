const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")

// POST /api/users - Create a new user
router.post("/", userController.createUser)

// GET /api/users - Get all users (with pagination and filtering)
router.get("/", userController.getAllUsers)

// GET /api/users/:id - Get user by ID
router.get("/:id", userController.getUserById)

// PUT /api/users/:id - Update user
router.put("/:id", userController.updateUser)

// DELETE /api/users/:id - Delete user
router.delete("/:id", userController.deleteUser)

module.exports = router
