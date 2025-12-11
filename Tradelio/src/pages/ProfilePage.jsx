import { useState, useEffect } from "react";
import { Store } from '@tauri-apps/plugin-store';
import { FaCamera, FaEdit, FaUser, FaChartLine, FaDollarSign, FaExchangeAlt } from "react-icons/fa";

// Initialize store
const store = new Store('settings.json');

// ----- MODAL COMPONENT -----
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 p-6 rounded-lg w-96 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white transition-colors"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// Format large numbers (1000000 -> 1M)
function formatVolume(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// ----- PROFILE PAGE -----
function ProfilePage() {
  const [user, setUser] = useState({
    fullName: "",
    profilePic: "",
    bio: "",
    joinDate: new Date().toISOString().split('T')[0],
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
  const [tempPicUrl, setTempPicUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load profile data on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await store.get('user_profile');
      const statsData = await store.get('user_stats');

      if (profileData) {
        const parsed = typeof profileData === 'string' ? JSON.parse(profileData) : profileData;
        setUser(parsed);
        setTempUser(parsed);
      }
      if (statsData) {
        const parsed = typeof statsData === 'string' ? JSON.parse(statsData) : statsData;
        setStats(parsed);
      }
    } catch (err) {
      console.log('No profile data found, using defaults:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    console.log('Starting save...', tempUser);
    setSaving(true);
    try {
      console.log('Setting user_profile in store...');
      await store.set('user_profile', tempUser);
      console.log('Calling store.save()...');
      await store.save();
      console.log('Save successful!');
      setUser(tempUser);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUrlSave = async () => {
    if (tempPicUrl.trim()) {
      try {
        const updatedUser = { ...user, profilePic: tempPicUrl };
        await store.set('user_profile', updatedUser);
        await store.save();
        setUser(updatedUser);
        setTempUser(updatedUser);
        setIsPicModalOpen(false);
        setTempPicUrl("");
      } catch (err) {
        console.error('Failed to save profile picture:', err);
        alert('Failed to save profile picture. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center text-zinc-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Profile</h2>
        <button
          onClick={() => {
            setTempUser({ ...user });
            setIsEditModalOpen(true);
          }}
          className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors"
        >
          <FaEdit /> Edit Profile
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* PROFILE CARD */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <div className="flex flex-col items-center">
              <div className="relative group">
                {user.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-2 border-zinc-700"
                    onError={(e) => {
                      e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.fullName || 'User') + '&size=128&background=27272a&color=fff';
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700">
                    <FaUser className="text-5xl text-zinc-600" />
                  </div>
                )}
                <button
                  onClick={() => setIsPicModalOpen(true)}
                  className="absolute bottom-0 right-0 bg-zinc-700 p-3 rounded-full hover:bg-zinc-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                >
                  <FaCamera className="text-white" />
                </button>
              </div>

              <h3 className="text-xl font-semibold text-white mt-4">
                {user.fullName || "Set your name"}
              </h3>

              {user.bio && (
                <p className="text-sm text-zinc-500 mt-3 text-center">
                  {user.bio}
                </p>
              )}

              <div className="mt-4 text-xs text-zinc-600">
                Member since {new Date(user.joinDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
          {/* Total Trades */}
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 mb-1">Total Trades</p>
                <p className="text-3xl font-bold text-white">{stats.totalTrades}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <FaChartLine className="text-2xl text-blue-500" />
              </div>
            </div>
          </div>

          {/* Trading Volume */}
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 mb-1">Trading Volume</p>
                <p className="text-3xl font-bold text-white">${formatVolume(stats.tradingVolume)}</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <FaExchangeAlt className="text-2xl text-green-500" />
              </div>
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 mb-1">Win Rate</p>
                <p className="text-3xl font-bold text-white">{stats.winRate}%</p>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-purple-500 flex items-center justify-center">
                <span className="text-sm font-bold text-purple-500">{stats.winRate}%</span>
              </div>
            </div>
          </div>

          {/* Account Balance */}
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 mb-1">Account Balance</p>
                <p className="text-3xl font-bold text-white">${stats.accountBalance.toFixed(2)}</p>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-lg">
                <FaDollarSign className="text-2xl text-yellow-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 block mb-2">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={tempUser.fullName}
              onChange={(e) => setTempUser({ ...tempUser, fullName: e.target.value })}
              className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg w-full text-white focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-2">Bio</label>
            <textarea
              placeholder="Tell us about yourself..."
              value={tempUser.bio}
              onChange={(e) => setTempUser({ ...tempUser, bio: e.target.value })}
              rows={3}
              maxLength={200}
              className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg w-full text-white focus:outline-none focus:border-zinc-600 resize-none"
            />
            <p className="text-xs text-zinc-600 mt-1">{tempUser.bio.length}/200</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setIsEditModalOpen(false)}
            className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={saveProfile}
            className="px-4 py-2 rounded-lg bg-green-500 text-black hover:bg-green-600 transition-colors disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </Modal>

      {/* PROFILE PICTURE MODAL */}
      <Modal isOpen={isPicModalOpen} onClose={() => { setIsPicModalOpen(false); setTempPicUrl(""); }}>
        <h3 className="text-lg font-semibold mb-4">Update Profile Picture</h3>
        
        <div>
          <label className="text-sm text-zinc-400 block mb-2">Enter image URL</label>
          <input
            type="text"
            placeholder="https://example.com/image.jpg"
            value={tempPicUrl}
            onChange={(e) => setTempPicUrl(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg w-full text-white focus:outline-none focus:border-zinc-600"
          />
          <p className="text-xs text-zinc-500 mt-2">
            Or use a service like <a href="https://imgur.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Imgur</a> to upload and get a URL
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => {
              setIsPicModalOpen(false);
              setTempPicUrl("");
            }}
            className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImageUrlSave}
            className="px-4 py-2 rounded-lg bg-green-500 text-black hover:bg-green-600 transition-colors disabled:opacity-50"
            disabled={!tempPicUrl.trim()}
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default ProfilePage;