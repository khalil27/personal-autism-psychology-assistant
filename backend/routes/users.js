const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken, authorizeRoles } = require("../middlewares/authMiddleware");

// -- Création d'un utilisateur --
// Pour créer un patient (auto-inscription) il faudra une route dédiée dans /auth/register (publique)
// Ici, création via API : uniquement admin ou doctor peuvent créer des utilisateurs (patients, doctors, admins selon leur rôle)
router.post("/", authenticateToken, authorizeRoles("admin", "doctor"), userController.createUser);

// -- Liste de tous les utilisateurs --
// Seul l'admin peut accéder à la liste complète
router.get("/", authenticateToken, authorizeRoles("admin"), userController.getAllUsers);

// -- Détails d'un utilisateur par ID --
// Tout utilisateur authentifié peut accéder à son propre profil
// Le doctor peut accéder à ses patients (vérifié dans le controller)
// L'admin peut accéder à tout
router.get("/:id", authenticateToken, userController.getUserById);

// -- Mise à jour d'un utilisateur par ID --
// Même logique que pour la lecture : vérification dans le controller de qui peut modifier quoi
router.put("/:id", authenticateToken, userController.updateUser);

// -- Suppression d'un utilisateur par ID --
// Réservé aux admins
router.delete("/:id", authenticateToken, authorizeRoles("admin"), userController.deleteUser);

module.exports = router;
