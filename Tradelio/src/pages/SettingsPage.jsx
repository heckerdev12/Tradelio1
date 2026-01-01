import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FaFolderOpen, FaExternalLinkAlt } from "react-icons/fa";
import { toast } from "sonner";

// ----- SWITCH COMPONENT -----
function Switch({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
        enabled ? "bg-green-500" : "bg-zinc-700"
      }`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 ${
          enabled ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ----- MODAL COMPONENT -----
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 p-6 rounded-lg w-96 relative">
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

// ----- SESSION DEFINITIONS -----
const sessions = [
  { name: "New York", start: "09:30", end: "16:00", tz: "America/New_York" },
  { name: "London", start: "08:00", end: "16:30", tz: "Europe/London" },
  { name: "Tokyo", start: "09:00", end: "18:00", tz: "Asia/Tokyo" },
];

// ----- CONVERT SESSION TO LOCAL TIME -----
function convertToLocal(time, tz) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute));
  return new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(
    new Date(
      utcDate.toLocaleString("en-US", {
        timeZone: tz,
      })
    )
  );
}

// ----- SETTINGS PAGE -----
function SettingsPage({ onLockRequest }) {
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState("154.00");
  const [tradeLioPath, setTradeLioPath] = useState("");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [lockTimeout, setLockTimeout] = useState(5);
  const [sessionNotifications, setSessionNotifications] = useState(false);
  const [localSessions, setLocalSessions] = useState([]);
  const [isDisablePinModalOpen, setIsDisablePinModalOpen] = useState(false);
  const [disablePin, setDisablePin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load Tradelio path on mount (from saved preferences or default)
  useEffect(() => {
    const loadTradeLioPath = async () => {
      try {
        // Get saved path from store (or default Documents location)
        const path = await invoke('get_tradelio_path');
        if (path) {
          setTradeLioPath(path);
        }
      } catch (err) {
        console.error('Failed to get Tradelio path:', err);
      }
    };

    loadTradeLioPath();
  }, []);

  // Handle folder selection
  const handleSelectTradeLioLocation = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select location for Tradelio folder'
      });

      if (selected) {
        const newPath = await invoke('create_tradelio_at_custom_location', { 
          selectedPath: selected 
        });
        setTradeLioPath(newPath);
        toast.success('Tradelio folder created successfully', {
          description: newPath
        });
      }
    } catch (err) {
      console.error('Failed to select folder:', err);
      toast.error('Failed to create Tradelio folder', {
        description: err.toString()
      });
    }
  };

  // Load passcode settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const exists = await invoke('check_passcode_exists');
        setPinEnabled(exists);
        
        if (exists) {
          const settings = await invoke('get_lock_settings');
          setLockTimeout(settings.auto_lock_minutes);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };

    loadSettings();
  }, []);

  // Open Tradelio folder in file explorer
  const handleOpenTradeLioFolder = async () => {
    try {
      if (tradeLioPath) {
        await invoke('open_folder_at_path', { folderPath: tradeLioPath });
        toast.success('Opened Tradelio folder');
      } else {
        toast.warning('Please select a Tradelio location first');
      }
    } catch (err) {
      console.error('Failed to open folder:', err);
      toast.error('Failed to open folder', {
        description: err.toString()
      });
    }
  };

  // Handle PIN toggle
  const handlePinToggle = async (enabled) => {
    if (!enabled) {
      setIsDisablePinModalOpen(true);
    } else {
      toast.info('Please restart the app to set up a new PIN');
    }
  };

  // Handle disable PIN
  const handleDisablePin = async () => {
    if (disablePin.length !== 6) {
      setError("PIN must be 6 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await invoke('disable_passcode', { passcode: disablePin });
      setPinEnabled(false);
      setIsDisablePinModalOpen(false);
      setDisablePin("");
      toast.success('PIN lock disabled successfully');
    } catch (err) {
      setError(err.toString());
      toast.error('Failed to disable PIN', {
        description: err.toString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle lock timeout change
  const handleTimeoutChange = async (minutes) => {
    setLockTimeout(minutes);
    
    try {
      await invoke('update_lock_settings', { autoLockMinutes: minutes });
      toast.success('Auto-lock timeout updated');
    } catch (err) {
      console.error('Failed to update lock timeout:', err);
      toast.error('Failed to update lock timeout');
    }
  };

  // Manual lock
  const handleManualLock = () => {
    if (onLockRequest) {
      onLockRequest();
      toast.info('App locked');
    }
  };

  // ----- SESSION NOTIFICATIONS -----
  useEffect(() => {
    if (sessionNotifications) {
      const converted = sessions.map((s) => ({
        name: s.name,
        start: convertToLocal(s.start, s.tz),
        end: convertToLocal(s.end, s.tz),
      }));
      setLocalSessions(converted);
    } else {
      setLocalSessions([]);
    }
  }, [sessionNotifications]);

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-10">Settings</h2>
      <div className="space-y-12">

        {/* CURRENCY */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Currency</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Display Currency</label>
              <select
                className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg w-full"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="KES">KES</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">USD → KES Rate</label>
              <input
                type="number"
                step="0.01"
                className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg w-full"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* TRADING IMPORT SETTINGS */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Trading Data Import</h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-medium mb-1">Tradelio Data Folder</p>
                <p className="text-sm text-zinc-500">
                  Choose where to store your trading data
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectTradeLioLocation}
                  className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <FaFolderOpen />
                  Choose Location
                </button>
                {tradeLioPath && (
                  <button
                    onClick={handleOpenTradeLioFolder}
                    className="bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-700 flex items-center gap-2 text-sm"
                  >
                    <FaExternalLinkAlt />
                    Open
                  </button>
                )}
              </div>
            </div>
            
            {tradeLioPath ? (
              <div className="bg-zinc-950 rounded px-3 py-2 text-sm text-zinc-400 font-mono">
                {tradeLioPath}
              </div>
            ) : (
              <div className="bg-amber-900/20 border border-amber-900 rounded px-3 py-2 text-sm text-amber-400">
                ⚠ No location set. Click "Choose Location" to set up your Tradelio folder.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="font-medium">EA Manual Export (MT4)</p>
              </div>
              <p className="text-sm text-zinc-500 ml-5">
                Manually export your MT4 EA history and place files in:{" "}
                <span className="text-zinc-300 font-mono">Tradelio/EA_Manual/</span>
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="font-medium">MT5 Automatic Export</p>
              </div>
              <p className="text-sm text-zinc-500 ml-5">
                MT5 data will be automatically synced to:{" "}
                <span className="text-zinc-300 font-mono">Tradelio/MT5_Auto/</span>
              </p>
            </div>
          </div>
        </section>

        {/* SECURITY */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Security</h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">PIN Code Lock</p>
                  <p className="text-sm text-zinc-500">Secure your app with a 6-digit PIN</p>
                </div>
                <Switch enabled={pinEnabled} onChange={handlePinToggle} />
              </div>

              {pinEnabled && (
                <div className="space-y-4 pl-4 border-l border-zinc-700">
                  <div>
                    <label className="text-sm text-zinc-400 block mb-2">Auto-lock after inactivity</label>
                    <select
                      value={lockTimeout}
                      onChange={(e) => handleTimeoutChange(Number(e.target.value))}
                      className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg w-full"
                    >
                      <option value={0}>Never</option>
                      <option value={1}>1 minute</option>
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                    </select>
                  </div>

                  <button
                    onClick={handleManualLock}
                    className="bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-700 text-sm"
                  >
                    Lock Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* NOTIFICATIONS */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Notifications</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">Session Notifications</p>
                <p className="text-sm text-zinc-500">
                  Get notified during trading sessions
                </p>
              </div>
              <Switch enabled={sessionNotifications} onChange={setSessionNotifications} />
            </div>

            {sessionNotifications && (
              <div className="space-y-2 pl-4 border-l border-zinc-700">
                {localSessions.map((s) => (
                  <div key={s.name}>
                    <p className="text-sm text-zinc-400">
                      {s.name} Session: {s.start} - {s.end} (Local Time)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* DATA MANAGEMENT */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Data</h3>
          <button className="bg-red-900/40 text-red-400 px-5 py-2 rounded-lg border border-red-900 hover:bg-red-900 transition">
            Clear All Data
          </button>
        </section>
      </div>

      {/* Disable PIN Modal */}
      <Modal isOpen={isDisablePinModalOpen} onClose={() => { setIsDisablePinModalOpen(false); setDisablePin(""); setError(""); }}>
        <h3 className="text-lg font-semibold mb-4">Disable PIN Lock</h3>
        <p className="text-sm text-zinc-400 mb-4">Enter your current PIN to disable the lock</p>
        
        <input
          type="password"
          placeholder="Enter 6-digit PIN"
          value={disablePin}
          onChange={(e) => setDisablePin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg w-full mb-4"
          maxLength={6}
        />

        {error && (
          <div className="mb-4 p-2 bg-red-900/20 border border-red-900 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={() => { setIsDisablePinModalOpen(false); setDisablePin(""); setError(""); }}
            className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleDisablePin}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
            disabled={loading || disablePin.length !== 6}
          >
            {loading ? "Disabling..." : "Disable PIN"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default SettingsPage;