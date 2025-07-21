const mongoose = require("mongoose")
const PatientProfile = require("../models/PatientProfile")
const User = require("../models/User")

class PatientProfileService {
  // Create patient profile
  async createPatientProfile(profileData) {
    try {
      // Valider user_id
      if (!mongoose.Types.ObjectId.isValid(profileData.user_id)) {
        throw new Error("Invalid user_id")
      }

      // Vérifier si user existe et est patient
      const user = await User.findById(profileData.user_id)
      if (!user) {
        throw new Error("User not found")
      }
      if (user.role !== "patient") {
        throw new Error("User must have patient role to create a patient profile")
      }

      // Vérifier si profile existe déjà
      const existingProfile = await PatientProfile.findOne({ user_id: profileData.user_id })
      if (existingProfile) {
        throw new Error("Patient profile already exists for this user")
      }

      const profile = new PatientProfile(profileData)
      await profile.save()
      return profile
    } catch (error) {
      throw error
    }
  }

  // Get all patient profiles
  async getAllPatientProfiles(options = {}) {
    try {
      const { page = 1, limit = 10, gender, occupation } = options

      const filter = {}
      if (gender) filter.gender = gender
      if (occupation) filter.occupation = occupation

      const profiles = await PatientProfile.find(filter)
        .populate("user_id", "name last_name email is_active")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ created_at: -1 })

      const total = await PatientProfile.countDocuments(filter)

      return {
        profiles,
        pagination: {
          current_page: Number.parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_profiles: total,
          per_page: Number.parseInt(limit),
        },
      }
    } catch (error) {
      throw error
    }
  }

  // Get patient profile by user ID
  async getPatientProfileByUserId(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user id")
      }

      const profile = await PatientProfile.findOne({ user_id: userId }).populate(
        "user_id",
        "name last_name email is_active"
      )

      if (!profile) {
        throw new Error("Patient profile not found")
      }

      return profile
    } catch (error) {
      throw error
    }
  }

  // Update patient profile
  async updatePatientProfile(userId, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user id")
      }

      const profile = await PatientProfile.findOneAndUpdate(
        { user_id: userId },
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      ).populate("user_id", "name last_name email")

      if (!profile) {
        throw new Error("Patient profile not found")
      }

      return profile
    } catch (error) {
      throw error
    }
  }

  // Delete patient profile
  async deletePatientProfile(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user id")
      }

      const profile = await PatientProfile.findOneAndDelete({ user_id: userId })
      if (!profile) {
        throw new Error("Patient profile not found")
      }
      return profile
    } catch (error) {
      throw error
    }
  }

  // Get profiles by age range
  async getProfilesByAgeRange(minAge, maxAge) {
    try {
      const profiles = await PatientProfile.find({
        age: { $gte: minAge, $lte: maxAge },
      }).populate("user_id", "name last_name email")

      return profiles
    } catch (error) {
      throw error
    }
  }

  // Get profiles by occupation
  async getProfilesByOccupation(occupation) {
    try {
      const profiles = await PatientProfile.find({ occupation }).populate(
        "user_id",
        "name last_name email"
      )

      return profiles
    } catch (error) {
      throw error
    }
  }
}

module.exports = new PatientProfileService()
