import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

// Components
import Sidebar from "./components/Navigation";
import PasscodeSetup from "./components/PasscodeSetup";
import LockScreen from "./components/LockScreen";

// Pages
import DashboardPage from "./pages/DashboardPage";
import TradesPage from "./pages/TradesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import AccountsPage from "./pages/AccountsPage";
import CalendarPage from "./pages/CalendarPage";
import ProfilePage from "./pages/ProfilePage";
import NewsPage from "./pages/NewsPage";

// ---------------------------------------------------------------------------
// Splash Screen
// ---------------------------------------------------------------------------
function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center animate-fadeIn">
        <div className="w-24 h-24 mb-6 mx-auto animate-pulse">
          <div className="text-7xl font-bold text-white flex items-center justify-center">
            <span className="bg-gradient-to-br from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              T
            </span>
          </div>
        </div>

        <h1 className="text-4xl font-semibold text-white mb-8 tracking-tight">
          Tradelio
        </h1>

        <div className="w-64 h-1 bg-zinc-800 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-white rounded-full animate-loading-bar"></div>
        </div>

        <p className="text-zinc-500 text-sm mt-6 animate-pulse">
          Loading your dashboard...
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main App Layout
// ---------------------------------------------------------------------------
function MainApp({ onLockRequest, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || "dashboard");

  // Save active tab to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('lastActiveTab', activeTab);
  }, [activeTab]);

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">

      {/* SIDEBAR */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto p-6 animate-fadeIn">

        {activeTab === "dashboard" && <DashboardPage />}
        {activeTab === "accounts" && <AccountsPage />}
        {activeTab === "trades" && <TradesPage />}
        {activeTab === "analytics" && <AnalyticsPage />}
        {activeTab === "calendar" && <CalendarPage />}
        {activeTab === "news" && <NewsPage />}
        {activeTab === "profile" && <ProfilePage />}
        {activeTab === "settings" && <SettingsPage onLockRequest={onLockRequest} />}

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root Component with Passcode Logic
// ---------------------------------------------------------------------------
function App() {
  const [windowLabel, setWindowLabel] = useState("");
  const [passcodeExists, setPasscodeExists] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lockSettings, setLockSettings] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Check window label
  useEffect(() => {
    const currentWindow = getCurrentWindow();
    setWindowLabel(currentWindow.label);
  }, []);

  // Check passcode status on mount
  useEffect(() => {
    const checkPasscode = async () => {
      try {
        const exists = await invoke('check_passcode_exists');
        setPasscodeExists(exists);
        
        if (exists) {
          const locked = await invoke('is_app_locked');
          setIsLocked(locked);
          
          const settings = await invoke('get_lock_settings');
          setLockSettings(settings);
        }
      } catch (err) {
        console.error('Failed to check passcode:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkPasscode();
  }, []);

  // Activity tracking and auto-lock
  useEffect(() => {
    if (!passcodeExists || !lockSettings || lockSettings.auto_lock_minutes === 0) {
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const resetTimer = () => {
      setLastActivity(Date.now());
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Check for inactivity every second
    const interval = setInterval(() => {
      const inactiveTime = (Date.now() - lastActivity) / 1000;
      const lockTimeout = lockSettings.auto_lock_minutes * 60;

      if (inactiveTime >= lockTimeout && !isLocked) {
        handleLock();
      }
    }, 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      clearInterval(interval);
    };
  }, [passcodeExists, lockSettings, lastActivity, isLocked]);

  const handlePasscodeSetupComplete = async () => {
    setPasscodeExists(true);
    const settings = await invoke('get_lock_settings');
    setLockSettings(settings);
    setIsLocked(false);
  };

  const handleUnlock = () => {
    setIsLocked(false);
    setLastActivity(Date.now());
  };

  const handleLock = async () => {
    try {
      await invoke('lock_app');
      setIsLocked(true);
    } catch (err) {
      console.error('Failed to lock app:', err);
    }
  };

  // Get last active tab from sessionStorage
  const getInitialTab = () => {
    return sessionStorage.getItem('lastActiveTab') || 'dashboard';
  };

  // Show splash screen
  if (windowLabel === "splashscreen") {
    return <SplashScreen />;
  }

  // Show loading
  if (isLoading) {
    return <SplashScreen />;
  }

  // Show passcode setup if no passcode exists
  if (!passcodeExists) {
    return <PasscodeSetup onComplete={handlePasscodeSetupComplete} />;
  }

  // Show lock screen if locked
  if (isLocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  // Show main app
  return <MainApp onLockRequest={handleLock} initialTab={getInitialTab()} />;
}

export default App;