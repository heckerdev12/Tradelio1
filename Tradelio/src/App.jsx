import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

// Components
import Sidebar from "./components/Navigation";

// Pages
import DashboardPage from "./pages/DashboardPage";
import TradesPage from "./pages/TradesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import AccountsPage from "./pages/AccountsPage";
import CalendarPage from "./pages/CalendarPage";
import ProfilePage from "./pages/ProfilePage";

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
function MainApp() {
  const [activeTab, setActiveTab] = useState("dashboard");

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
        {activeTab === "profile" && <ProfilePage />}
        {activeTab === "settings" && <SettingsPage />}

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root Component
// ---------------------------------------------------------------------------
function App() {
  const [windowLabel, setWindowLabel] = useState("");

  useEffect(() => {
    const currentWindow = getCurrentWindow(); // Not a promise in Tauri 2
    setWindowLabel(currentWindow.label);
  }, []);

  if (windowLabel === "splashscreen") {
    return <SplashScreen />;
  }

  return <MainApp />;
}

export default App;
