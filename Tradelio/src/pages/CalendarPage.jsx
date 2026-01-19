import { useState, useEffect } from "react";
import { showToast } from '../utils/toastConfig';

// ----- ACCOUNTS DATA -----
const accounts = [
  { id: 1, name: "Demo Account" },
  { id: 2, name: "Live Account" },
  { id: 3, name: "Standard Account" },
];

// ----- DUMMY PnL DATA -----
const dummyPnL = [
  { accountId: 1, date: "2025-12-01", pnl: 2.5 },
  { accountId: 2, date: "2025-12-01", pnl: -1.2 },
  { accountId: 1, date: "2025-12-02", pnl: 0.5 },
  { accountId: 1, date: "2025-12-03", pnl: -0.8 },
  { accountId: 2, date: "2025-12-05", pnl: 1.1 },
];

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

// ----- CALENDAR PAGE -----
function CalendarPage() {
  const today = new Date();
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Generate days of current month
  const generateDays = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDayOfWeek = date.getDay(); // 0 = Sunday
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Empty slots for previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const days = generateDays(currentYear, currentMonth);

  const getPnLForDay = (date) => {
    if (!date) return null;
    const dateStr = date.toISOString().split("T")[0];
    let filtered = dummyPnL.filter(
      (d) => d.date === dateStr && (selectedAccount === "all" || d.accountId === Number(selectedAccount))
    );
    if (!filtered.length) return null;
    // Sum PnL if multiple accounts
    const total = filtered.reduce((sum, d) => sum + d.pnl, 0);
    return total;
  };

  const handlePrevMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="max-w-6xl mx-auto p-0">
      <h2 className="text-2xl font-bold mb-6">PnL Calendar</h2>

      {/* FILTERS */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm text-zinc-400 block mb-1">Account</label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg w-full"
          >
            <option value="all">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MONTH NAVIGATION */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          className="px-3 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition"
        >
          Prev
        </button>
        <h3 className="text-lg font-semibold">{monthNames[currentMonth]} {currentYear}</h3>
        <button
          onClick={handleNextMonth}
          className="px-3 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition"
        >
          Next
        </button>
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {weekDays.map((wd) => (
          <div key={wd} className="font-medium text-zinc-400">{wd}</div>
        ))}
        {days.map((day, idx) => {
          const pnl = getPnLForDay(day);
          const isToday =
            day &&
            day.getDate() === today.getDate() &&
            day.getMonth() === today.getMonth() &&
            day.getFullYear() === today.getFullYear();

          return (
            <div
              key={idx}
              className={`p-2 rounded-lg min-h-[60px] flex flex-col justify-center items-center text-sm ${
                day ? "bg-zinc-900 border border-zinc-800" : ""
              } ${isToday ? "border-green-500 border-2" : ""}`}
            >
              {day && (
                <>
                  <span className="font-semibold">{day.getDate()}</span>
                  {pnl !== null && (
                    <span className={`text-xs font-bold mt-1 ${
                      pnl >= 0 ? "text-green-400" : "text-red-500"
                    }`}>{pnl.toFixed(2)}%</span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarPage;
