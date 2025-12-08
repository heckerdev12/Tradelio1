import { useState } from 'react';
import { 
  FaTachometerAlt, 
  FaChartLine, 
  FaChartPie, 
  FaCog, 
  FaUsers, 
  FaRegCalendarAlt, 
  FaUserCircle, 
  FaBars,       // For expand/collapse
  FaTimes,      // Close icon
  FaSignOutAlt  // Logout icon
} from 'react-icons/fa';

function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { id: 'accounts', label: 'Accounts', icon: <FaUsers /> },
    { id: 'trades', label: 'Trades', icon: <FaChartLine /> },
    { id: 'analytics', label: 'Analytics', icon: <FaChartPie /> },
    { id: 'calendar', label: 'Calendar', icon: <FaRegCalendarAlt /> },
    { id: 'profile', label: 'Profile', icon: <FaUserCircle /> },
    { id: 'settings', label: 'Settings', icon: <FaCog /> },
  ];

  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`flex flex-col h-screen bg-zinc-900 text-zinc-200 transition-width duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      
      {/* Logo / Brand */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        {!collapsed && <h1 className="text-xl font-bold">Tradelio</h1>}
        <button onClick={() => setCollapsed(!collapsed)} className="text-zinc-400 hover:text-white text-lg">
          {collapsed ? <FaBars /> : <FaTimes />}
        </button>
      </div>

      {/* Tabs */}
      <nav className="flex-1 p-2 space-y-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center w-full p-2 rounded-md transition-colors
              ${activeTab === tab.id ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-700 hover:text-white'}
            `}
          >
            <span className="text-lg">{tab.icon}</span>
            {!collapsed && <span className="ml-3">{tab.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-zinc-800">
        <button className="flex items-center w-full p-2 rounded-md hover:bg-zinc-700 hover:text-white">
          <span className="text-lg"><FaSignOutAlt /></span>
          {!collapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
