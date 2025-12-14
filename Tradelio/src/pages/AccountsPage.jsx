import { useState } from "react";
import { FaPlus, FaHistory, FaFilter } from "react-icons/fa";

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto relative custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white text-xl"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// ----- TRANSACTION HISTORY MODAL -----
function TransactionHistoryModal({ isOpen, onClose, transactions, accounts }) {
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedDuration, setSelectedDuration] = useState("30");

  const filterTransactions = () => {
    let filtered = [...transactions];
    
    // Filter by account
    if (selectedAccount !== "all") {
      filtered = filtered.filter(t => t.accountName === selectedAccount);
    }
    
    // Filter by duration
    const days = parseInt(selectedDuration);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    filtered = filtered.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= cutoffDate;
    });
    
    return filtered;
  };

  const filteredTransactions = filterTransactions();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <FaHistory className="text-green-400" />
        Transaction History
      </h3>
      
      {/* Filters */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm text-zinc-400 block mb-2 flex items-center gap-2">
            <FaFilter className="text-xs" />
            Select Account
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg w-full text-white"
          >
            <option value="all">All Accounts</option>
            {accounts.map((acc, idx) => (
              <option key={idx} value={acc.name}>{acc.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-zinc-400 block mb-2">Duration</label>
          <div className="grid grid-cols-4 gap-2">
            {["7", "30", "90", "365"].map((days) => (
              <button
                key={days}
                onClick={() => setSelectedDuration(days)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  selectedDuration === days
                    ? "bg-green-500 text-black"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {days === "365" ? "1Y" : `${days}D`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <FaHistory className="text-4xl mx-auto mb-3 opacity-50" />
            <p>No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((transaction, idx) => (
            <div
              key={idx}
              className="bg-zinc-800 p-4 rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-white">{transaction.accountName}</p>
                <p className="text-sm text-zinc-400">{transaction.date}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold text-lg ${
                  transaction.type === "Deposit" ? "text-green-400" : "text-red-400"
                }`}>
                  {transaction.type === "Deposit" ? "+" : "-"}${transaction.amount.toFixed(2)}
                </p>
                <p className="text-xs text-zinc-500">{transaction.type}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

// ----- ACCOUNTS PAGE -----
function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(null);
  const [transactionAmount, setTransactionAmount] = useState("");

  const [newAccount, setNewAccount] = useState({
    name: "",
    demo: true,
    deposit: "",
    leverage: "1:100",
    type: "Standard",
    terminal: "MT4",
    broker: "",
    profileLetters: "",
    profileColor: "#10b981",
  });

  const handleAccountSave = () => {
    if (!newAccount.name || !newAccount.deposit || !newAccount.broker || !newAccount.profileLetters) {
      alert("Please fill all required fields (Account Name, Broker, Profile Letters, and Initial Deposit)");
      return;
    }
    if (newAccount.profileLetters.length !== 2) {
      alert("Profile letters must be exactly 2 characters");
      return;
    }
    setAccounts([...accounts, { ...newAccount, balance: parseFloat(newAccount.deposit) }]);
    setNewAccount({
      name: "",
      demo: true,
      deposit: "",
      leverage: "1:100",
      type: "Standard",
      terminal: "MT4",
      broker: "",
      profileLetters: "",
      profileColor: "#10b981",
    });
    setIsModalOpen(false);
  };

  const handleDeposit = () => {
    if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    const amount = parseFloat(transactionAmount);
    const updatedAccounts = [...accounts];
    updatedAccounts[selectedAccountIndex].balance += amount;
    setAccounts(updatedAccounts);
    
    setTransactions([
      { type: "Deposit", amount, date: new Date().toISOString().split('T')[0], accountName: accounts[selectedAccountIndex].name },
      ...transactions,
    ]);
    
    setTransactionAmount("");
    setIsDepositModalOpen(false);
  };

  const handleWithdraw = () => {
    if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    const amount = parseFloat(transactionAmount);
    if (amount > accounts[selectedAccountIndex].balance) {
      alert("Insufficient balance");
      return;
    }
    const updatedAccounts = [...accounts];
    updatedAccounts[selectedAccountIndex].balance -= amount;
    setAccounts(updatedAccounts);
    
    setTransactions([
      { type: "Withdrawal", amount, date: new Date().toISOString().split('T')[0], accountName: accounts[selectedAccountIndex].name },
      ...transactions,
    ]);
    
    setTransactionAmount("");
    setIsWithdrawModalOpen(false);
  };

  return (
    <>
      <div className="min-h-screen text-white px-0">
        <div className="max-w-6xl mx-auto">
          {/* Header with History Button */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Accounts</h2>
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg transition"
            >
              <FaHistory />
              <span className="hidden sm:inline">History</span>
            </button>
          </div>

          {/* ACCOUNTS LIST */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">
            {accounts.map((acc, idx) => (
              <div key={idx} className="bg-zinc-800 p-6 rounded-lg shadow-md">
                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
                    style={{ backgroundColor: acc.profileColor }}
                  >
                    {acc.profileLetters}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold text-white truncate">
                      {acc.name}
                    </h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      acc.demo ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
                    }`}>
                      {acc.demo ? "DEMO" : "LIVE"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-zinc-400">Broker: <span className="font-semibold text-white">{acc.broker}</span></p>
                  <p className="text-zinc-400">Balance: <span className="font-bold text-green-400 text-lg">${acc.balance.toFixed(2)}</span></p>
                  <p className="text-zinc-400">Leverage: <span className="font-semibold text-white">{acc.leverage}</span></p>
                  <p className="text-zinc-400">Type: <span className="font-semibold text-white">{acc.type}</span></p>
                  <p className="text-zinc-400">Terminal: <span className="font-semibold text-white">{acc.terminal}</span></p>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setSelectedAccountIndex(idx);
                      setIsDepositModalOpen(true);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition"
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAccountIndex(idx);
                      setIsWithdrawModalOpen(true);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* FLOATING ACTION BUTTON */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-8 right-8 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/70 text-black flex items-center justify-center shadow-lg hover:bg-white transition z-40"
          >
            <FaPlus className="text-xl" />
          </button>

          {/* NEW ACCOUNT MODAL */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <h3 className="text-lg font-semibold mb-4">Create New Account</h3>
            <div className="space-y-4">
              {/* Demo / Live Toggle */}
              <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                <div>
                  <p className="font-medium text-white">Account Type</p>
                  <p className="text-sm text-zinc-400">{newAccount.demo ? "Demo Account" : "Live Account"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${!newAccount.demo ? 'text-green-400 font-bold' : 'text-zinc-500'}`}>LIVE</span>
                  <Switch
                    enabled={newAccount.demo}
                    onChange={(val) => setNewAccount({ ...newAccount, demo: val })}
                  />
                  <span className={`text-sm ${newAccount.demo ? 'text-blue-400 font-bold' : 'text-zinc-500'}`}>DEMO</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-1">Broker Name *</label>
                <input
                  type="text"
                  value={newAccount.broker}
                  onChange={(e) => setNewAccount({ ...newAccount, broker: e.target.value })}
                  placeholder="e.g., Exness, IC Markets"
                  className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg w-full text-white placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-1">Profile Letters (2 characters) *</label>
                <input
                  type="text"
                  value={newAccount.profileLetters}
                  onChange={(e) => setNewAccount({ ...newAccount, profileLetters: e.target.value.toUpperCase().slice(0, 2) })}
                  placeholder="e.g., EX, IC"
                  maxLength={2}
                  className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg w-full text-white uppercase placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">Profile Color</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={newAccount.profileColor}
                    onChange={(e) => setNewAccount({ ...newAccount, profileColor: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer bg-zinc-800 border border-zinc-700"
                  />
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: newAccount.profileColor }}
                  >
                    {newAccount.profileLetters || "??"}
                  </div>
                  <span className="text-sm text-zinc-400">{newAccount.profileColor}</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-1">Account Name *</label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  placeholder="e.g., Main Trading Account"
                  className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg w-full text-white placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-1">Initial Deposit (USD) *</label>
                <input
                  type="number"
                  value={newAccount.deposit}
                  onChange={(e) => setNewAccount({ ...newAccount, deposit: e.target.value })}
                  placeholder="1000"
                  className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg w-full text-white placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-1">Leverage</label>
                <select
                  value={newAccount.leverage}
                  onChange={(e) => setNewAccount({ ...newAccount, leverage: e.target.value })}
                  className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg w-full text-white"
                >
                  <option value="1:50">1:50</option>
                  <option value="1:100">1:100</option>
                  <option value="1:200">1:200</option>
                  <option value="1:500">1:500</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-1">Account Type</label>
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                  className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg w-full text-white"
                >
                  <option value="Raw Spread">Raw Spread</option>
                  <option value="Cent">Cent</option>
                  <option value="Standard">Standard</option>
                  <option value="Pro">Pro</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-1">Terminal</label>
                <select
                  value={newAccount.terminal}
                  onChange={(e) => setNewAccount({ ...newAccount, terminal: e.target.value })}
                  className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg w-full text-white"
                >
                  <option value="MT4">MT4</option>
                  <option value="MT5">MT5</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAccountSave}
                className="px-4 py-2 rounded-lg bg-white text-black hover:bg-green-600 font-medium transition"
              >
                Create Account
              </button>
            </div>
          </Modal>

          {/* DEPOSIT MODAL */}
          <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)}>
            <h3 className="text-lg font-semibold mb-4">Deposit Funds</h3>
            {selectedAccountIndex !== null && (
              <div className="mb-4 p-4 bg-zinc-800 rounded-lg">
                <p className="text-zinc-400 text-sm">Account</p>
                <p className="text-white font-semibold">{accounts[selectedAccountIndex]?.name}</p>
                <p className="text-zinc-400 text-sm mt-2">Current Balance</p>
                <p className="text-green-400 font-bold text-2xl">${accounts[selectedAccountIndex]?.balance.toFixed(2)}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 block mb-1">Amount (USD)</label>
                <input
                  type="number"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg w-full text-white placeholder:text-zinc-600"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setIsDepositModalOpen(false);
                  setTransactionAmount("");
                }}
                className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 font-medium transition"
              >
                Confirm Deposit
              </button>
            </div>
          </Modal>

          {/* WITHDRAW MODAL */}
          <Modal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)}>
            <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>
            {selectedAccountIndex !== null && (
              <div className="mb-4 p-4 bg-zinc-800 rounded-lg">
                <p className="text-zinc-400 text-sm">Account</p>
                <p className="text-white font-semibold">{accounts[selectedAccountIndex]?.name}</p>
                <p className="text-zinc-400 text-sm mt-2">Available Balance</p>
                <p className="text-green-400 font-bold text-2xl">${accounts[selectedAccountIndex]?.balance.toFixed(2)}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 block mb-1">Amount (USD)</label>
                <input
                  type="number"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg w-full text-white placeholder:text-zinc-600"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setIsWithdrawModalOpen(false);
                  setTransactionAmount("");
                }}
                className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 font-medium transition"
              >
                Confirm Withdrawal
              </button>
            </div>
          </Modal>

          {/* TRANSACTION HISTORY MODAL */}
          <TransactionHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            transactions={transactions}
            accounts={accounts}
          />
        </div>
      </div>
    </>
  );
}

export default AccountsPage;