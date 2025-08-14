const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const userService = require('../services/userService');
const notificationService = require('../services/notificationService');

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
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );

    // ✅ Envoyer le token dans un cookie HttpOnly
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // à mettre `true` en production avec HTTPS
      sameSite: 'Lax',
      maxAge: 3600000, // 1h
    });

    res.status(200).json({
      message: "Logged in successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Login error", err);
    res.status(500).json({ message: "Internal server error" });
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

    // Forcer le rôle à 'patient'
    const role = "patient";

    // Création utilisateur
    const user = await userService.createUser({ name, last_name, email, password, role });

    // ✅ Création automatique d'une notification
    await notificationService.createNotification({
      user_id: user.id, // ⚠ ici on utilise bien user.id et non _id car ton modèle l'a défini comme String id
      type: "info",
      message: "Merci de compléter votre profil patient.",
    });

    res.status(201).json({
      message: "Patient account created successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};


exports.getMe = (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, SECRET_KEY);

    // Tu peux ici soit juste retourner le contenu du token,
    // soit aller chercher les infos en base si tu veux + de détails
    res.status(200).json({
      id: decoded.id,
      role: decoded.role,
    });

  } catch (err) {
    console.error("Error in getMe:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
