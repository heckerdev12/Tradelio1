import { useState, useEffect } from 'react';
import { Globe2, TrendingUp, AlertCircle, Bell, BellOff } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { showToast } from '../utils/toastConfig';

// Analog Clock Component
const AnalogClock = ({ timezone, size = 120 }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const marketTime = new Date(time.toLocaleString('en-US', { timeZone: timezone }));
  const hours = marketTime.getHours() % 12;
  const minutes = marketTime.getMinutes();
  const seconds = marketTime.getSeconds();

  const hourAngle = (hours * 30) + (minutes * 0.5);
  const minuteAngle = minutes * 6;
  const secondAngle = seconds * 6;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="58" fill="rgb(39, 39, 42)" stroke="rgb(63, 63, 70)" strokeWidth="2"/>
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x1 = 60 + 48 * Math.cos(angle);
          const y1 = 60 + 48 * Math.sin(angle);
          const x2 = 60 + 52 * Math.cos(angle);
          const y2 = 60 + 52 * Math.sin(angle);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(113, 113, 122)" strokeWidth="2" />
          );
        })}
        <line x1="60" y1="60" x2={60 + 30 * Math.sin(hourAngle * Math.PI / 180)} y2={60 - 30 * Math.cos(hourAngle * Math.PI / 180)} stroke="rgb(228, 228, 231)" strokeWidth="4" strokeLinecap="round" />
        <line x1="60" y1="60" x2={60 + 40 * Math.sin(minuteAngle * Math.PI / 180)} y2={60 - 40 * Math.cos(minuteAngle * Math.PI / 180)} stroke="rgb(228, 228, 231)" strokeWidth="3" strokeLinecap="round" />
        <line x1="60" y1="60" x2={60 + 45 * Math.sin(secondAngle * Math.PI / 180)} y2={60 - 45 * Math.cos(secondAngle * Math.PI / 180)} stroke="rgb(59, 130, 246)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="60" cy="60" r="4" fill="rgb(59, 130, 246)"/>
      </svg>
    </div>
  );
};

// Session definitions in UTC
const sessions = [
  { name: "New York", startHour: 14, startMinute: 30, endHour: 21, endMinute: 0 },
  { name: "London", startHour: 8, startMinute: 0, endHour: 16, endMinute: 30 },
  { name: "Tokyo", startHour: 0, startMinute: 0, endHour: 9, endMinute: 0 },
];

// Check if current UTC time matches session time
function checkSessionTime(session, status) {
  const now = new Date();
  const currentUTCHour = now.getUTCHours();
  const currentUTCMinute = now.getUTCMinutes();
  let targetHour, targetMinute;

  if (status === 'started') {
    targetHour = session.startHour;
    targetMinute = session.startMinute;
  } else if (status === 'winding_down') {
    targetHour = session.endHour;
    targetMinute = session.endMinute - 30;
    if (targetMinute < 0) {
      targetMinute += 60;
      targetHour -= 1;
    }
  } else if (status === 'closed') {
    targetHour = session.endHour;
    targetMinute = session.endMinute;
  }

  return currentUTCHour === targetHour && currentUTCMinute === targetMinute;
}

// Market Card Component
const MarketCard = ({ market, currentTime }) => {
  const getMarketTime = (timezone) => {
    return currentTime.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getMarketDate = (timezone) => {
    return currentTime.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const isMarketOpen = (timezone, openTime, closeTime) => {
    const marketTime = new Date(currentTime.toLocaleString('en-US', { timeZone: timezone }));
    const day = marketTime.getDay();
    if (day === 0 || day === 6) return false;

    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    const hour = marketTime.getHours();
    const minute = marketTime.getMinutes();
    const currentMinutes = hour * 60 + minute;
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  };

  const getTimeUntil = (timezone, openTime, closeTime) => {
    const marketTime = new Date(currentTime.toLocaleString('en-US', { timeZone: timezone }));
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    const hour = marketTime.getHours();
    const minute = marketTime.getMinutes();
    
    if (isMarketOpen(timezone, openTime, closeTime)) {
      const closeMinutes = closeHour * 60 + closeMin;
      const currentMinutes = hour * 60 + minute;
      const diff = closeMinutes - currentMinutes;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return `Closes in ${hours}h ${mins}m`;
    } else {
      const openMinutes = openHour * 60 + openMin;
      const currentMinutes = hour * 60 + minute;
      let diff = openMinutes - currentMinutes;
      if (diff < 0) diff += 24 * 60;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return `Opens in ${hours}h ${mins}m`;
    }
  };

  const isOpen = isMarketOpen(market.timezone, market.open, market.close);

  return (
    <div className={`bg-zinc-900 border rounded-lg p-6 transition-all hover:border-zinc-700 ${
      isOpen ? 'border-green-500/50' : 'border-zinc-800'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{market.flag}</span>
          <div>
            <h3 className="text-lg font-semibold">{market.name}</h3>
            <p className="text-xs text-zinc-500">{market.timezone.split('/')[1].replace('_', ' ')}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${
          isOpen ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-green-400 animate-pulse' : 'bg-zinc-500'}`}></div>
          {isOpen ? 'OPEN' : 'CLOSED'}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <AnalogClock timezone={market.timezone} size={100} />
        <div className="flex-1">
          <div className="text-2xl font-mono font-bold mb-1">
            {getMarketTime(market.timezone)}
          </div>
          <div className="text-xs text-zinc-500">
            {getMarketDate(market.timezone)}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Trading Hours</span>
          <span className="font-medium text-zinc-300">
            {market.open} - {market.close}
          </span>
        </div>
        <div className={`flex items-center gap-2 text-xs p-2 rounded ${
          isOpen ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800/50 text-zinc-400'
        }`}>
          {isOpen ? <TrendingUp size={14} /> : <AlertCircle size={14} />}
          <span className="font-medium">{getTimeUntil(market.timezone, market.open, market.close)}</span>
        </div>
      </div>
    </div>
  );
};

const MarketHoursPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userTimezone, setUserTimezone] = useState("");

  const markets = [
    { name: 'New York', flag: '🇺🇸', timezone: 'America/New_York', open: '09:30', close: '16:00' },
    { name: 'London', flag: '🇬🇧', timezone: 'Europe/London', open: '08:00', close: '16:30' },
    { name: 'Tokyo', flag: '🇯🇵', timezone: 'Asia/Tokyo', open: '09:00', close: '15:00' },
    { name: 'Hong Kong', flag: '🇭🇰', timezone: 'Asia/Hong_Kong', open: '09:30', close: '16:00' },
    { name: 'Sydney', flag: '🇦🇺', timezone: 'Australia/Sydney', open: '10:00', close: '16:00' },
    { name: 'Frankfurt', flag: '🇩🇪', timezone: 'Europe/Berlin', open: '09:00', close: '17:30' }
  ];

  // Detect timezone and load settings on mount
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(tz);

    // Load notification setting from backend
    const loadSettings = async () => {
      try {
        const enabled = await invoke('get_session_notifications_enabled');
        setNotificationsEnabled(enabled);
      } catch (err) {
        console.error('Failed to load notification settings:', err);
      }
    };
    loadSettings();
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Session notification scheduler
  useEffect(() => {
    if (!notificationsEnabled) return;

    const interval = setInterval(() => {
      const currentDay = new Date().getDay();
      
      // Skip on weekends
      if (currentDay === 0 || currentDay === 6) return;

      // Check for Friday 4 PM weekend message
      const now = new Date();
      if (currentDay === 5 && now.getHours() === 16 && now.getMinutes() === 0) {
        showToast.info('Weekend Break', '🌴 Markets closing for the weekend. Time to rest and review. See you Monday!');
      }

      // Check each session
      sessions.forEach(async (session) => {
        if (checkSessionTime(session, 'started')) {
          try {
            await invoke('send_session_alert', {
              sessionName: session.name,
              status: 'started'
            });
          } catch (err) {
            console.error('Failed to send notification:', err);
          }
        }

        if (checkSessionTime(session, 'winding_down')) {
          try {
            await invoke('send_session_alert', {
              sessionName: session.name,
              status: 'winding_down'
            });
          } catch (err) {
            console.error('Failed to send notification:', err);
          }
        }

        if (checkSessionTime(session, 'closed')) {
          try {
            await invoke('send_session_alert', {
              sessionName: session.name,
              status: 'closed'
            });
          } catch (err) {
            console.error('Failed to send notification:', err);
          }
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  // Toggle notifications
  const handleToggleNotifications = async () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);

    try {
      await invoke('set_session_notifications_enabled', { enabled: newState });
      
      if (newState) {
        showToast.success('Notifications Enabled', `Session alerts activated for ${userTimezone}. No notifications on weekends.`);
      } else {
        showToast.info('Notifications Disabled', 'Session alerts have been turned off');
      }
    } catch (err) {
      console.error('Failed to save notification settings:', err);
      showToast.error('Settings Error', 'Failed to save notification settings');
      setNotificationsEnabled(!newState); // Revert on error
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-0 py-0">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe2 className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold">Market Hours</h2>
              <p className="text-zinc-400 text-sm mt-1">Real-time trading sessions worldwide</p>
            </div>
          </div>

          {/* Notification Toggle */}
          <button
            onClick={handleToggleNotifications}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              notificationsEnabled
                ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
            <span className="font-medium text-sm">
              {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
            </span>
          </button>
        </div>

      
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {markets.map((market) => (
          <MarketCard key={market.name} market={market} currentTime={currentTime} />
        ))}
      </div>
    </div>
  );
};

export default MarketHoursPage;