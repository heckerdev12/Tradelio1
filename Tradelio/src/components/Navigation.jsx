import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  PieChart,
  Newspaper,
  Calendar,
  UserCircle,
  Settings,
  Menu,
  Clock,
  X,
  Terminal
} from 'lucide-react';
import { Store } from "@tauri-apps/plugin-store";
import { loadProfile } from "../api/profile";
import { convertFileSrc } from "@tauri-apps/api/core";

// Initialize store
let store = null;

async function getStore() {
  if (!store) {
    store = await Store.load("settings.json");
  }
  return store;
}

function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'trades', label: 'Trades', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'markethours', label: 'Market Hours', icon: Clock },
    { id: 'profile', label: 'Profile', icon: UserCircle },
    { id: 'codes', label: 'Codes', icon:  Terminal},
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState({
    fullName: "",
    profilePic: "",
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storeInstance = await getStore();
      const profileData = await storeInstance.get("user_profile");

      let userData = {
        fullName: "",
        profilePic: "",
      };

      if (profileData) {
        const parsed = typeof profileData === "string" ? JSON.parse(profileData) : profileData;
        userData = { ...userData, ...parsed };
      }

      // Load profile pic from database
      try {
        const dbProfilePic = await loadProfile();
        if (dbProfilePic) {
          userData.profilePic = convertFileSrc(dbProfilePic);
        }
      } catch (dbErr) {
        console.log("No profile picture in database yet:", dbErr);
      }

      setUser(userData);
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  };

  return (
    <div className={`flex flex-col h-screen bg-zinc-900 text-zinc-200 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo / Brand */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        {!collapsed && <h1 className="text-xl font-bold">Tradelio</h1>}
        <button onClick={() => setCollapsed(!collapsed)} className="text-zinc-400 hover:text-white text-lg">
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Tabs */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center w-full p-3 rounded-lg transition-colors
                ${activeTab === tab.id ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800/50 hover:text-white'}
              `}
              title={collapsed ? tab.label : ''}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="ml-3 text-sm font-medium">{tab.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {user.profilePic ? (
              <img
                src={user.profilePic}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <UserCircle size={16} className="text-zinc-600" />
              </div>
            )}
            {!collapsed && (
              <div className="ml-3">
                <p className="text-sm font-medium">{user.fullName || "User"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;