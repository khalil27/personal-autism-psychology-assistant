const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const SECRET_KEY = process.env.JWT_SECRET || "super_secret_key";

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 60 * 60 * 1000, // 1 heure
    });

    res.json({ message: "Logged in successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.json({ message: "Logged out successfully" });
};

// Inscription publique pour patient
 exports.register = async (req, res, next) => {
  try {
    const { name, last_name, email, password } = req.body;

    // Forcer le rôle à 'patient' pour toute inscription publique
    const role = "patient";

    // Appel à service pour créer utilisateur
    const user = await userService.createUser({ name, last_name, email, password, role });

    res.status(201).json({
      message: "Patient account created successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};