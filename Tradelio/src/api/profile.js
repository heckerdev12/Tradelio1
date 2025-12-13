import { invoke } from "@tauri-apps/api/core";

/**
 * Save a profile image by copying it to the app data directory
 * @param {string} filePath - The source file path selected by the user
 * @returns {Promise<string>} - The destination path where the image was saved
 */
export async function saveProfileImage(filePath) {
  try {
    const result = await invoke("save_profile_image", {
      sourcePath: filePath,
    });
    console.log("Profile image saved successfully:", result);
    return result;
  } catch (error) {
    console.error("Failed to save profile image:", error);
    throw error;
  }
}

/**
 * Load the profile picture path from the database
 * @returns {Promise<string|null>} - The profile picture path or null
 */
export async function loadProfile() {
  try {
    const result = await invoke("get_profile");
    console.log("Profile loaded:", result);
    return result;
  } catch (error) {
    console.error("Failed to load profile:", error);
    throw error;
  }
}