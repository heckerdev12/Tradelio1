import { useState, useEffect, useRef } from "react";
import { Store } from "@tauri-apps/plugin-store";
import { open } from "@tauri-apps/plugin-dialog";
import { saveProfileImage, loadProfile } from "../api/profile";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  FaCamera,
  FaEdit,
  FaUser,
  FaChartLine,
  FaDollarSign,
  FaExchangeAlt,
} from "react-icons/fa";

// Initialize store - use async initialization
let store = null;

async function getStore() {
  if (!store) {
    store = await Store.load("settings.json");
    console.log("Store initialized");
  }
  return store;
}

// ----- MODAL COMPONENT -----
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 p-6 rounded-lg w-96 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// Format large numbers
function formatVolume(num) {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

// ----- PROFILE PAGE -----
function ProfilePage() {
  const fileInputRef = useRef(null);

  const [user, setUser] = useState({
    fullName: "",
    profilePic: "",
    bio: "",
    joinDate: new Date().toISOString().split("T")[0],
  });

  const [stats, setStats] = useState({
    totalTrades: 0,
    tradingVolume: 0,
    winRate: 0,
    accountBalance: 0,
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPicModalOpen, setIsPicModalOpen] = useState(false);
  const [tempUser, setTempUser] = useState({ ...user });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfileData();
  }, []);

  // Auto-dismiss error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(""); // Clear any previous errors
      
      console.log("Loading profile data...");
      
      const storeInstance = await getStore();
      
      // Load from Store
      const profileData = await storeInstance.get("user_profile");
      const statsData = await storeInstance.get("user_stats");

      console.log("Profile data from store:", profileData);
      console.log("Stats data from store:", statsData);

      let userData = {
        fullName: "",
        profilePic: "",
        bio: "",
        joinDate: new Date().toISOString().split("T")[0],
      };

      if (profileData) {
        const parsed = typeof profileData === "string" 
          ? JSON.parse(profileData) 
          : profileData;
        userData = { ...userData, ...parsed };
        console.log("Parsed user data:", userData);
      }

      // Try to load profile pic from database (may not exist yet)
      try {
        const dbProfilePic = await loadProfile();
        console.log("Profile pic from database:", dbProfilePic);
        if (dbProfilePic) {
          userData.profilePic = convertFileSrc(dbProfilePic);
          console.log("Converted profile pic URL:", userData.profilePic);
        }
      } catch (dbErr) {
        // It's okay if there's no profile pic yet
        console.log("No profile picture in database yet:", dbErr);
      }

      setUser(userData);
      setTempUser(userData);

      if (statsData) {
        const parsed = typeof statsData === "string"
          ? JSON.parse(statsData)
          : statsData;
        setStats(parsed);
      }
      
      console.log("Profile loaded successfully");
    } catch (err) {
      console.error("Error loading profile:", err);
      // Don't show error for initial load - just use defaults
    } finally {
      setLoading(false);
    }
  };

  const saveProfileData = async () => {
    setSaving(true);
    setError("");
    
    try {
      console.log("Saving profile data:", tempUser);
      
      const storeInstance = await getStore();
      
      const dataToSave = {
        fullName: tempUser.fullName,
        bio: tempUser.bio,
        joinDate: tempUser.joinDate,
      };
      
      console.log("Data to save:", dataToSave);
      
      await storeInstance.set("user_profile", dataToSave);
      await storeInstance.save();
      
      console.log("Profile saved successfully!");
      
      // Update current user state
      setUser({
        ...user,
        fullName: tempUser.fullName,
        bio: tempUser.bio,
        joinDate: tempUser.joinDate,
      });
      
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      setError(`Failed to save profile: ${err.message || err}`);
      // Keep modal open if there's an error
    } finally {
      setSaving(false);
    }
  };

  // ---- TAURI FILE PICKER HANDLER ----
  const handlePickImage = async () => {
    try {
      setError("");
      
      const selected = await open({
        multiple: false,
        filters: [{ 
          name: "Images", 
          extensions: ["png", "jpg", "jpeg", "gif", "webp"] 
        }],
      });

      if (!selected) return;

      console.log("Selected image:", selected);

      // Save image via Rust backend
      const savedPath = await saveProfileImage(selected);
      console.log("Image saved to:", savedPath);
      
      // Convert to browser-usable URL
      const imageUrl = convertFileSrc(savedPath);
      console.log("Converted URL:", imageUrl);

      // Update state
      const updatedUser = {
        ...user,
        profilePic: imageUrl,
      };

      const storeInstance = await getStore();

      // Save to store
      await storeInstance.set("user_profile", {
        fullName: updatedUser.fullName,
        bio: updatedUser.bio,
        joinDate: updatedUser.joinDate,
      });
      await storeInstance.save();

      setUser(updatedUser);
      setTempUser(updatedUser);
      setIsPicModalOpen(false);

      console.log("Profile picture updated successfully!");

    } catch (err) {
      console.error("Image pick error:", err);
      setError(`Failed to save image: ${err}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-4 bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Profile</h2>
        <button
          onClick={() => {
            setTempUser({ ...user });
            setIsEditModalOpen(true);
          }}
          className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-700"
        >
          <FaEdit /> Edit Profile
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* PROFILE CARD */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <div className="flex flex-col items-center">
            <div className="relative group">
              {user.profilePic ? (
                <img
                  src={user.profilePic}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover"
                  onError={(e) => {
                    console.error("Image failed to load");
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center">
                  <FaUser className="text-5xl text-zinc-600" />
                </div>
              )}

              <button
                onClick={() => setIsPicModalOpen(true)}
                className="absolute bottom-0 right-0 bg-zinc-700 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FaCamera />
              </button>
            </div>

            <h3 className="text-xl font-semibold mt-4">
              {user.fullName || "Set your name"}
            </h3>

            {user.bio && (
              <p className="text-sm text-zinc-500 mt-2 text-center">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
          <Stat label="Total Trades" value={stats.totalTrades} icon={<FaChartLine />} />
          <Stat
            label="Trading Volume"
            value={`$${formatVolume(stats.tradingVolume)}`}
            icon={<FaExchangeAlt />}
          />
          <Stat label="Win Rate" value={`${stats.winRate}%`} />
          <Stat
            label="Account Balance"
            value={`$${stats.accountBalance.toFixed(2)}`}
            icon={<FaDollarSign />}
          />
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>

        <input
          className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 rounded mb-4"
          placeholder="Full Name"
          value={tempUser.fullName}
          onChange={(e) =>
            setTempUser({ ...tempUser, fullName: e.target.value })
          }
        />

        <textarea
          className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 rounded"
          placeholder="Bio"
          rows={3}
          value={tempUser.bio}
          onChange={(e) =>
            setTempUser({ ...tempUser, bio: e.target.value })
          }
        />

        <div className="flex justify-end gap-2 mt-6">
          <button 
            onClick={() => setIsEditModalOpen(false)}
            className="px-4 py-2 text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={saveProfileData}
            disabled={saving}
            className="bg-green-500 text-black px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      {/* PROFILE PIC MODAL */}
      <Modal isOpen={isPicModalOpen} onClose={() => setIsPicModalOpen(false)}>
        <h3 className="text-lg font-semibold mb-4">Select Profile Picture</h3>

        <button
          onClick={handlePickImage}
          className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Choose Image
        </button>

        <p className="text-xs text-zinc-500 mt-3 text-center">
          Supported formats: PNG, JPG, JPEG, GIF, WEBP
        </p>
      </Modal>
    </div>
  );
}

// SMALL STAT CARD
function Stat({ label, value, icon }) {
  return (
    <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {icon && <div className="mt-2 text-zinc-500">{icon}</div>}
    </div>
  );
}

export default ProfilePage;