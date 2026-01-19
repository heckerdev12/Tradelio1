import { useState, useEffect, useRef } from "react";
import { Store } from "@tauri-apps/plugin-store";
import { open } from "@tauri-apps/plugin-dialog";
import { saveProfileImage, loadProfile } from "../api/profile";
import { convertFileSrc } from "@tauri-apps/api/core";
import { supabase } from "../lib/supabase";
import { showToast } from '../utils/toastConfig';

import {
  FaCamera,
  FaEdit,
  FaUser,
  FaChartLine,
  FaDollarSign,
  FaExchangeAlt,
  FaSync,
} from "react-icons/fa";

let store = null;

async function getStore() {
  if (!store) {
    store = await Store.load("settings.json");
  }
  return store;
}

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

function formatVolume(num) {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

function ProfilePage() {
  const fileInputRef = useRef(null);

  const [user, setUser] = useState({
    username: "",
    profilePic: "",
    bio: "",
  });

  const [stats, setStats] = useState({
    totalTrades: 0,
    tradingVolume: 0,
    winRate: 0,
    accountBalance: 0,
  });

  const [userId, setUserId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPicModalOpen, setIsPicModalOpen] = useState(false);
  const [tempUser, setTempUser] = useState({ ...user });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState("");
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreUsername, setRestoreUsername] = useState("");

  useEffect(() => {
    loadProfileData();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (syncStatus) {
      const timer = setTimeout(() => setSyncStatus(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const storeInstance = await getStore();
      
      // Load from local store
      const profileData = await storeInstance.get("user_profile");
      const statsData = await storeInstance.get("user_stats");

      let userData = {
        username: "",
        profilePic: "",
        bio: "",
      };

      if (profileData) {
        const parsed = typeof profileData === "string" 
          ? JSON.parse(profileData) 
          : profileData;
        userData = { ...userData, ...parsed };
      }

      // Load profile pic from Tauri backend
      try {
        const dbProfilePic = await loadProfile();
        if (dbProfilePic) {
          userData.profilePic = convertFileSrc(dbProfilePic);
        }
      } catch (dbErr) {
        console.log("No profile picture yet");
      }

      setUser(userData);
      setTempUser(userData);

      // Load stats from local store
      if (statsData) {
        const parsed = typeof statsData === "string"
          ? JSON.parse(statsData)
          : statsData;
        setStats(parsed);
      }

      // If we have a username, try to sync with Supabase
      if (userData.username) {
        await syncFromSupabase(userData.username);
      }
      
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync FROM Supabase (pull cloud data)
  const syncFromSupabase = async (username) => {
    try {
      // Get user from Supabase
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      if (existingUser) {
        setUserId(existingUser.id);
        
        // Update local data with cloud data
        setUser(prev => ({
          ...prev,
          bio: existingUser.bio || prev.bio
        }));

        // Get stats from Supabase
        const { data: statsData, error: statsError } = await supabase
          .from('trading_stats')
          .select('*')
          .eq('user_id', existingUser.id)
          .single();

        if (!statsError && statsData) {
          const cloudStats = {
            totalTrades: statsData.total_trades || 0,
            tradingVolume: parseFloat(statsData.trading_volume) || 0,
            winRate: parseFloat(statsData.win_rate) || 0,
            accountBalance: parseFloat(statsData.account_balance) || 0,
          };
          
          setStats(cloudStats);

          // Save to local store
          const storeInstance = await getStore();
          await storeInstance.set("user_stats", cloudStats);
          await storeInstance.save();
        }

        console.log('✅ Synced from Supabase');
      }
    } catch (err) {
      console.error('Sync from Supabase error:', err);
    }
  };

  // Sync TO Supabase (push local data to cloud)
  const syncToSupabase = async () => {
    if (!user.username) {
      setError("Please set a username first");
      return;
    }

    setSyncing(true);
    setSyncStatus("");

    try {
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', user.username)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let currentUserId = userId;

      if (existingUser) {
        // User exists - UPDATE
        const { error: updateError } = await supabase
          .from('users')
          .update({ bio: user.bio })
          .eq('username', user.username);
        
        if (updateError) throw updateError;
        currentUserId = existingUser.id;
        
      } else {
        // User doesn't exist - INSERT
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            username: user.username,
            bio: user.bio
          }])
          .select()
          .single();
        
        if (insertError) throw insertError;
        currentUserId = newUser.id;
        setUserId(newUser.id);
      }

      // Sync stats to trading_stats table
      const { data: existingStats } = await supabase
        .from('trading_stats')
        .select('*')
        .eq('user_id', currentUserId)
        .single();

      const statsToSync = {
        user_id: currentUserId,
        total_trades: stats.totalTrades,
        trading_volume: stats.tradingVolume,
        win_rate: stats.winRate,
        account_balance: stats.accountBalance
      };

      if (existingStats) {
        // Update stats
        const { error: statsError } = await supabase
          .from('trading_stats')
          .update(statsToSync)
          .eq('user_id', currentUserId);
        
        if (statsError) throw statsError;
      } else {
        // Insert stats
        const { error: statsError } = await supabase
          .from('trading_stats')
          .insert([statsToSync]);
        
        if (statsError) throw statsError;
      }

      setSyncStatus("✅ Synced to cloud successfully!");
      console.log('✅ Synced to Supabase');

    } catch (err) {
      console.error('Sync to Supabase error:', err);
      setError(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Restore FROM Supabase (recover lost data)
  const restoreFromSupabase = async () => {
    if (!restoreUsername.trim()) {
      setError("Please enter a username");
      return;
    }

    setRestoring(true);
    setError("");
    setSyncStatus("");

    try {
      // Find user in Supabase
      const { data: cloudUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', restoreUsername.trim())
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') {
          throw new Error('Username not found in cloud');
        }
        throw userError;
      }

      if (!cloudUser) {
        throw new Error('Username not found in cloud');
      }

      // Get stats from cloud
      const { data: cloudStats, error: statsError } = await supabase
        .from('trading_stats')
        .select('*')
        .eq('user_id', cloudUser.id)
        .single();

      // Restore user data locally
      const restoredUser = {
        username: cloudUser.username,
        bio: cloudUser.bio || "",
        profilePic: "" // Profile pic can't be restored from cloud
      };

      const restoredStats = cloudStats ? {
        totalTrades: cloudStats.total_trades || 0,
        tradingVolume: parseFloat(cloudStats.trading_volume) || 0,
        winRate: parseFloat(cloudStats.win_rate) || 0,
        accountBalance: parseFloat(cloudStats.account_balance) || 0,
      } : {
        totalTrades: 0,
        tradingVolume: 0,
        winRate: 0,
        accountBalance: 0,
      };

      // Save to local store
      const storeInstance = await getStore();
      await storeInstance.set("user_profile", {
        username: restoredUser.username,
        bio: restoredUser.bio
      });
      await storeInstance.set("user_stats", restoredStats);
      await storeInstance.save();

      // Update UI
      setUser(restoredUser);
      setTempUser(restoredUser);
      setStats(restoredStats);
      setUserId(cloudUser.id);

      setSyncStatus(`✅ Restored data for ${cloudUser.username}!`);
      setIsRestoreModalOpen(false);
      setRestoreUsername("");

      console.log('✅ Data restored from Supabase');

    } catch (err) {
      console.error('Restore error:', err);
      setError(`Restore failed: ${err.message}`);
    } finally {
      setRestoring(false);
    }
  };

  const saveProfileData = async () => {
    setSaving(true);
    setError("");
    
    try {
      const storeInstance = await getStore();
      
      const dataToSave = {
        username: tempUser.username,
        bio: tempUser.bio,
      };
      
      // Save locally first
      await storeInstance.set("user_profile", dataToSave);
      await storeInstance.save();
      
      // Update UI
      setUser({
        ...user,
        username: tempUser.username,
        bio: tempUser.bio,
      });
      
      setIsEditModalOpen(false);

      // Auto-sync to cloud after save
      setTimeout(() => {
        syncToSupabase();
      }, 500);
      
    } catch (err) {
      console.error("Save error:", err);
      setError(`Failed to save profile: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

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

      const savedPath = await saveProfileImage(selected);
      const imageUrl = convertFileSrc(savedPath);

      const updatedUser = {
        ...user,
        profilePic: imageUrl,
      };

      const storeInstance = await getStore();
      await storeInstance.set("user_profile", {
        username: updatedUser.username,
        bio: updatedUser.bio,
      });
      await storeInstance.save();

      setUser(updatedUser);
      setTempUser(updatedUser);
      setIsPicModalOpen(false);

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

      {/* SYNC STATUS */}
      {syncStatus && (
        <div className="mb-4 bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded">
          {syncStatus}
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Profile</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsRestoreModalOpen(true)}
            className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <FaSync />
            Restore from Cloud
          </button>
          <button
            onClick={syncToSupabase}
            disabled={syncing || !user.username}
            className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <FaSync className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync to Cloud"}
          </button>
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
              {user.username || "Set your username"}
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
          placeholder="Username"
          value={tempUser.username}
          onChange={(e) =>
            setTempUser({ ...tempUser, username: e.target.value })
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
            className="bg-zinc-300 text-black px-4 py-2 rounded hover:bg-white disabled:opacity-50"
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

      {/* RESTORE FROM CLOUD MODAL */}
      <Modal isOpen={isRestoreModalOpen} onClose={() => setIsRestoreModalOpen(false)}>
        <h3 className="text-lg font-semibold mb-4">Restore from Cloud</h3>
        
        <p className="text-sm text-zinc-400 mb-4">
          Enter your username to restore your profile and stats from Supabase
        </p>

        <input
          className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 rounded mb-4"
          placeholder="Enter username"
          value={restoreUsername}
          onChange={(e) => setRestoreUsername(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') restoreFromSupabase();
          }}
        />

        <div className="bg-yellow-900/20 border border-yellow-600 text-yellow-400 px-3 py-2 rounded text-xs mb-4">
          ⚠️ This will overwrite your current local data
        </div>

        <div className="flex justify-end gap-2">
          <button 
            onClick={() => {
              setIsRestoreModalOpen(false);
              setRestoreUsername("");
            }}
            className="px-4 py-2 text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={restoreFromSupabase}
            disabled={restoring || !restoreUsername.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {restoring ? "Restoring..." : "Restore"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

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