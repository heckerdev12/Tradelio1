import { useState } from "react";
import { FaPlus } from "react-icons/fa";

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

// ----- ACCOUNTS PAGE -----
function AccountsPage() {
  const [accounts, setAccounts] = useState([
    {
      name: "Demo Account",
      demo: true,
      deposit: 1000,
      leverage: "1:100",
      type: "Standard",
      terminal: "MT4",
    },
  ]);

  const [transactions, setTransactions] = useState([
    { type: "Deposit", amount: 500, date: "2025-12-08" },
    { type: "Withdrawal", amount: 200, date: "2025-12-05" },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    demo: true,
    deposit: "",
    leverage: "1:100",
    type: "Standard",
    terminal: "MT4",
  });

  const handleAccountSave = () => {
    if (!newAccount.name || !newAccount.deposit) {
      alert("Please fill all required fields");
      return;
    }
    setAccounts([...accounts, newAccount]);
    setNewAccount({
      name: "",
      demo: true,
      deposit: "",
      leverage: "1:100",
      type: "Standard",
      terminal: "MT4",
    });
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-8 relative">
      <h2 className="text-2xl font-bold mb-8">Accounts</h2>

      {/* ACCOUNTS LIST */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {accounts.map((acc, idx) => (
          <div key={idx} className="bg-zinc-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-white mb-3">
              {acc.name} ({acc.demo ? "Demo" : "Live"})
            </h3>
            <p>Initial Deposit: <span className="font-bold">{acc.deposit} USD</span></p>
            <p>Leverage: <span className="font-bold">{acc.leverage}</span></p>
            <p>Type: <span className="font-bold">{acc.type}</span></p>
            <p>Terminal: <span className="font-bold">{acc.terminal}</span></p>
          </div>
        ))}
      </div>

      {/* TRANSACTIONS */}
      <div className="bg-zinc-800 p-6 rounded-lg shadow-md mb-12">
        <h3 className="text-xl font-semibold text-white mb-4">Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-zinc-400">No deposits or withdrawals yet.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((t, idx) => (
              <p key={idx} className="text-white">
                {t.date}: {t.type} of <span className="font-bold">{t.amount} USD</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* FLOATING ACTION BUTTON */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-12 right-12 w-16 h-16 rounded-full bg-green-500 text-black flex items-center justify-center shadow-lg hover:bg-green-600 transition"
      >
        <FaPlus />
      </button>

      {/* NEW ACCOUNT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3 className="text-lg font-semibold mb-4">Create New Account</h3>
        <div className="space-y-4">
          {/* Demo / Live Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Demo / Live</p>
              <p className="text-sm text-zinc-500">Choose account type</p>
            </div>
            <Switch
              enabled={newAccount.demo}
              onChange={(val) => setNewAccount({ ...newAccount, demo: val })}
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-1">Account Name</label>
            <input
              type="text"
              value={newAccount.name}
              onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
              className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg w-full"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-1">Initial Deposit</label>
            <input
              type="number"
              value={newAccount.deposit}
              onChange={(e) => setNewAccount({ ...newAccount, deposit: e.target.value })}
              className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg w-full"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-1">Leverage</label>
            <select
              value={newAccount.leverage}
              onChange={(e) => setNewAccount({ ...newAccount, leverage: e.target.value })}
              className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg w-full"
            >
              <option value="1:50">1:50</option>
              <option value="1:100">1:100</option>
              <option value="1:200">1:200</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-1">Account Type</label>
            <select
              value={newAccount.type}
              onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
              className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg w-full"
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
              className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg w-full"
            >
              <option value="MT4">MT4</option>
              <option value="MT5">MT5</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleAccountSave}
            className="px-4 py-2 rounded-lg bg-green-500 text-black hover:bg-green-600"
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default AccountsPage;
