import React, { useState, useRef, useEffect } from 'react';
import { History, FileSpreadsheet, FileCode, Download, Plus, X, ChevronLeft, ChevronRight, Calendar, ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine} from 'lucide-react';

// ----- CUSTOM DATE PICKER COMPONENT -----
function DatePicker({ value, onChange, placeholder = "Select date", align = "left" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDateClick = (day) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onChange(formatDate(selected));
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    if (!value) return false;
    const selected = new Date(value + 'T00:00:00');
    return (
      day === selected.getDate() &&
      currentMonth.getMonth() === selected.getMonth() &&
      currentMonth.getFullYear() === selected.getFullYear()
    );
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const firstDay = firstDayOfMonth(currentMonth);

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9" />);
    }

    // Actual days
    for (let day = 1; day <= totalDays; day++) {
      const today = isToday(day);
      const selected = isSelected(day);
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          className={`h-9 w-9 rounded-md text-sm font-medium transition-colors hover:bg-zinc-800 flex items-center justify-center ${
            selected
              ? 'bg-white text-black hover:bg-zinc-200'
              : today
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-300'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };
  /* Calendar */
  return (
    <div ref={pickerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none text-left flex items-center justify-between"
      >
        <span className={value ? 'text-white' : 'text-zinc-600'}>
          {formatDisplayDate(value)}
        </span>
        <Calendar size={16} className="text-zinc-500" />
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-xl z-50 w-[280px] max-w-[calc(100vw-2rem)] ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-zinc-800 rounded transition"
            >
              <ChevronLeft size={20} className="text-zinc-400" />
            </button>
            
            <span className="text-sm font-semibold text-white">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-zinc-800 rounded transition"
            >
              <ChevronRight size={20} className="text-zinc-400" />
            </button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="h-9 flex items-center justify-center text-xs font-medium text-zinc-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>

          
        </div>
      )}
    </div>
  );
}

// ----- MODAL COMPONENT -----
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white text-xl"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

// ----- ADD ACCOUNT MODAL -----
function AddAccountModal({ isOpen, onClose, onAddAccount }) {
  const [formData, setFormData] = useState({
    brokerName: '',
    accountNumber: '',
    accountNickname: '',
    accountType: 'Live',
    initialBalance: '',
    leverage: '1:400',
    tradingTerminal: 'MT5'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.brokerName || !formData.accountNumber || !formData.initialBalance) {
      alert('Please fill in all required fields');
      return;
    }

    const newAccount = {
      name: `${formData.brokerName} - ${formData.accountNumber}`,
      broker: formData.brokerName,
      accountNumber: formData.accountNumber,
      accountNickname: formData.accountNickname,
      type: formData.accountType,
      balance: parseFloat(formData.initialBalance),
      leverage: formData.leverage,
      tradingTerminal: formData.tradingTerminal,
      createdAt: new Date().toISOString()
    };

    onAddAccount(newAccount);
    
    // Reset form
    setFormData({
      brokerName: '',
      accountNumber: '',
      accountNickname: '',
      accountType: 'Live',
      initialBalance: '',
      leverage: '1:400',
      tradingTerminal: 'MT5'
    });
    
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-xl font-semibold mb-6 text-white">
        Add Trading Account
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Broker Name */}
        <div>
          <label className="text-sm text-zinc-400 block mb-2 font-medium">
            Broker Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="brokerName"
            value={formData.brokerName}
            onChange={handleChange}
            placeholder="e.g., Interactive Brokers"
            className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none placeholder:text-zinc-600"
            required
          />
        </div>

        {/* Account Number and Account Nickname Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Number */}
          <div>
            <label className="text-sm text-zinc-400 block mb-2 font-medium">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              placeholder="e.g., U1234567"
              className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none placeholder:text-zinc-600"
              required
            />
          </div>

          {/* Account Nickname */}
          <div>
            <label className="text-sm text-zinc-400 block mb-2 font-medium">
              Account Nickname <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="accountNickname"
              value={formData.accountNickname || ''}
              onChange={handleChange}
              placeholder="e.g., Money Printing"
              className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* Account Type */}
        <div>
          <label className="text-sm text-zinc-400 block mb-2 font-medium">
            Account Type
          </label>
          <select
            name="accountType"
            value={formData.accountType}
            onChange={handleChange}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none"
          >
            <option value="Live">Live</option>
            <option value="Demo">Demo</option>
          </select>
        </div>

        {/* Initial Balance*/}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-zinc-400 block mb-2 font-medium">
              Initial Balance <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="initialBalance"
              value={formData.initialBalance}
              onChange={handleChange}
              placeholder="10000"
              step="0.01"
              className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none placeholder:text-zinc-600"
              required
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-2 font-medium">
              Leverage
            </label>
            <select
              name="leverage"
              value={formData.leverage}
              onChange={handleChange}
              className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none"
            >
              <option value="1:200">1:200</option>
              <option value="1:400">1:400</option>
              <option value="1:500">1:500</option>
              <option value="1:1000">1:1000</option>
              <option value="1:2000">1:2000</option>
              <option value="1:3000">1:3000</option>
            </select>
          </div>
        </div>
          <div>
            <label className="text-sm text-zinc-400 block mb-2 font-medium">
              Trading platform
            </label>
            <select
              name="TradingTerminal"
              value={formData.currency}
              className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none"
            >
              <option value="MT4">MT4</option>
              <option value="MT5">MT5</option>
              <option value="C-Trader">C-Trader</option>
            </select>
          </div>
        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition font-medium text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold transition"
          >
            Add Account
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ----- TRANSACTION HISTORY EXPORT MODAL -----
function TransactionHistoryModal({ isOpen, onClose, transactions = [], accounts = [] }) {
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fileType, setFileType] = useState("excel");

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (selectedAccount !== "all") {
      filtered = filtered.filter(t => t.accountName === selectedAccount);
    }

    if (startDate) {
      filtered = filtered.filter(t => t.date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(t => t.date <= endDate);
    }

    return filtered;
  };

  const filteredTransactions = filterTransactions();

  const exportToExcel = () => {
    if (filteredTransactions.length === 0) {
      alert("No transactions to export!");
      return;
    }

    const headers = "Account Name,Type,Amount,Date\n";
    const rows = filteredTransactions.map(t =>
      `"${t.accountName}","${t.type}",${t.amount},"${t.date}"`
    ).join("\n");

    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert("Excel file exported successfully!");
  };

  const exportToHTML = () => {
    if (filteredTransactions.length === 0) {
      alert("No transactions to export!");
      return;
    }

    const totalDeposits = filteredTransactions
      .filter(t => t.type === "Deposit")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = filteredTransactions
      .filter(t => t.type === "Withdrawal")
      .reduce((sum, t) => sum + t.amount, 0);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Transaction History Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1000px;
            margin: 40px auto;
            padding: 20px;
            background: #000;
            color: #fff;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 10px;
        }
        .summary {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #18181b;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #27272a;
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #a1a1aa;
            font-size: 14px;
            text-transform: uppercase;
        }
        .summary-card p {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        .deposits { color: #22c55e; }
        .withdrawals { color: #ef4444; }
        .net { color: #fff; }
        table {
            width: 100%;
            background: #18181b;
            border-collapse: collapse;
            border: 1px solid #27272a;
            border-radius: 8px;
            overflow: hidden;
        }
        th {
            background: #000;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            border-bottom: 1px solid #27272a;
        }
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #27272a;
        }
        tr:hover {
            background: #27272a;
        }
        .deposit {
            color: #22c55e;
            font-weight: bold;
        }
        .withdrawal {
            color: #ef4444;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #a1a1aa;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Transaction History Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        <p>Account: ${selectedAccount === "all" ? "All Accounts" : selectedAccount}</p>
        ${startDate || endDate ? `<p>Period: ${startDate || 'Start'} to ${endDate || 'End'}</p>` : ''}
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Deposits</h3>
            <p class="deposits">$${totalDeposits.toFixed(2)}</p>
        </div>
        <div class="summary-card">
            <h3>Total Withdrawals</h3>
            <p class="withdrawals">$${totalWithdrawals.toFixed(2)}</p>
        </div>
        <div class="summary-card">
            <h3>Net Change</h3>
            <p class="net">$${(totalDeposits - totalWithdrawals).toFixed(2)}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Account Name</th>
                <th>Type</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            ${filteredTransactions.map(t => `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.accountName}</td>
                    <td>${t.type}</td>
                    <td class="${t.type.toLowerCase()}">
                        ${t.type === "Deposit" ? "+" : "-"}$${t.amount.toFixed(2)}
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="footer">
        <p>Total Transactions: ${filteredTransactions.length}</p>
        <p>Trading Account Management System</p>
    </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert("HTML file exported successfully!");
  };

  const handleExport = () => {
    if (fileType === "excel") {
      exportToExcel();
    } else {
      exportToHTML();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
        <History size={20} />
        Export Transaction History
      </h3>

      <div className="space-y-6">
        <div>
          <label className="text-sm text-zinc-400 block mb-2 font-medium">
            Select Account
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none"
          >
            <option value="all">All Accounts</option>
            {accounts.map((acc, idx) => (
              <option key={idx} value={acc.name}>{acc.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-zinc-400 block mb-2 font-medium">
              Start Date
            </label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="Start date"
              align="left"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-2 font-medium">
              End Date
            </label>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="End date"
              align="right"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-zinc-400 block mb-3 font-medium">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFileType("excel")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                fileType === "excel"
                  ? "bg-white text-black"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <FileSpreadsheet size={18} />
              Excel (CSV)
            </button>

            <button
              type="button"
              onClick={() => setFileType("html")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                fileType === "html"
                  ? "bg-white text-black"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <FileCode size={18} />
              HTML
            </button>
          </div>
        </div>

        <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-600">
          <h4 className="text-sm font-semibold text-zinc-300 mb-2">Preview</h4>
          <div className="space-y-1 text-sm">
            <p className="text-zinc-400">
              Account: <span className="text-white font-medium">
                {selectedAccount === "all" ? "All Accounts" : selectedAccount}
              </span>
            </p>
            <p className="text-zinc-400">
              Date Range: <span className="text-white font-medium">
                {startDate || "Any"} to {endDate || "Any"}
              </span>
            </p>
            <p className="text-zinc-400">
              Format: <span className="text-white font-medium">
                {fileType === "excel" ? "Excel (CSV)" : "HTML Report"}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={filteredTransactions.length === 0}
          className="flex-1 px-4 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={18} />
          Export
        </button>
      </div>
    </Modal>
  );
}

// ----- MAIN APP -----
export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [transactions] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);

  const handleAddAccount = (newAccount) => {
    setAccounts(prev => [...prev, newAccount]);
    alert('Account added successfully!');
  };

  return (
    <div className="min-h-screen bg-transparent text-white p-0">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Trading Accounts</h1>

          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg transition font-semibold"
          >
            <History size={18} />
            Export History
          </button>
        </div>

        {/* Accounts Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((account, idx) => (
            <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              {/* Header Section */}
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{account.broker}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      account.type === 'Live' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-zinc-700 text-zinc-300'
                    }`}>
                      {account.type}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-400">#{account.accountNumber}</span>
                </div>
                
                {/* Balance */}
                <div className="text-3xl font-bold text-green-500 mb-3">
                  ${account.balance.toFixed(2)}
                </div>
                
                {/* Account Details */}
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span>Leverage <span className="text-white font-semibold">{account.leverage}</span></span>
                  <span>Platform <span className="text-white font-semibold">{account.tradingTerminal}</span></span>
                  <span>Alias <span className="text-white font-semibold">{account.accountNickname}</span></span>
                </div>
              </div>
              
              {/* Buttons Section */}
                <div className="p-4">
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-zinc-800 hover:bg-white text-white hover:text-black rounded-lg transition-all duration-200 border border-zinc-700 hover:border-zinc-300 font-semibold text-sm">
                      <ArrowDownToLine size={16} />
                      Withdraw
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-zinc-800 hover:bg-white text-white hover:text-black rounded-lg transition-all duration-200 border border-zinc-700 hover:border-zinc-300 font-semibold text-sm">
                      <ArrowLeftRight size={16} />
                      Transfer
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-zinc-800 hover:bg-white text-white hover:text-black rounded-lg transition-all duration-200 border border-zinc-700 hover:border-zinc-300 font-semibold text-sm">
                      <ArrowUpFromLine size={16} />
                      Deposit
                    </button>
                  </div>
                </div>
            </div>
          ))}
        </div>

        {accounts.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <p className="text-lg">No accounts yet. Click the + button to add your first trading account.</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsAddAccountModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-white text-black rounded-full shadow-lg hover:bg-zinc-200 transition flex items-center justify-center group"
        aria-label="Add Account"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Modals */}
      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
        onAddAccount={handleAddAccount}
      />

      <TransactionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        transactions={transactions}
        accounts={accounts}
      />
    </div>
  );
}