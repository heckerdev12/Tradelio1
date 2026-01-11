import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  History,
  FileSpreadsheet,
  FileText,
  Download,
  Plus,
  X,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Pencil,
  Trash2,
  Eye, 
  EyeOff
} from 'lucide-react';
import DatePicker from '../components/DatePicker';
import { showToast } from '../utils/toastConfig';

// ----- CONFIRMATION MODAL COMPONENT -----
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", cancelText = "Cancel" }) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center p-4">
        <h3 className="text-xl font-semibold mb-4 text-white">{title}</h3>
        <p className="text-zinc-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition font-medium text-white"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
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

// ----- DEPOSIT MODAL -----
function DepositModal({ isOpen, onClose, accounts, onDeposit }) {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount || !amount || !date) {
      showToast.warning('Missing Information', 'Please fill in all required fields');
      return;
    }

    const account = accounts.find(a => a.id.toString() === selectedAccount);
    const transaction = {
      account_name: account.name,
      transaction_type: 'Deposit',
      amount: parseFloat(amount),
      date,
      created_at: new Date().toISOString()
    };

    try {
      const savedTransaction = await invoke('add_transaction', { transaction });
      const newBalance = account.balance + parseFloat(amount);
      await invoke('update_account_balance', {
        accountId: account.id,
        newBalance
      });

      onDeposit(savedTransaction, account.id, newBalance);
      showToast.success('Deposit Successful', `$${parseFloat(amount).toFixed(2)} added to ${account.name}`);
      setSelectedAccount('');
      setAmount('');
      setDate('');
      onClose();
    } catch (error) {
      console.error('Failed to add deposit:', error);
      showToast.error('Deposit Failed', error.message || 'Please try again');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
        <ArrowUpFromLine size={20} />
        Deposit Funds
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-sm text-zinc-400 block mb-2 font-medium">
            Select Account <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none"
            required
          >
            <option value="">Choose account...</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} - ${acc.balance.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-zinc-400 block mb-2 font-medium">
            Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none placeholder:text-zinc-600"
            required
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 block mb-2 font-medium">
            Date <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={date}
            onChange={setDate}
            placeholder="Select date"
          />
        </div>

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
            Deposit
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ----- WITHDRAWAL MODAL -----
function WithdrawalModal({ isOpen, onClose, accounts, onWithdraw }) {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  const selectedAccountData = accounts.find(a => a.id.toString() === selectedAccount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount || !amount || !date) {
      alert('Please fill in all fields');
      return;
    }

    if (parseFloat(amount) > selectedAccountData.balance) {
      showToast.error('Insufficient Balance', `Available: $${selectedAccountData.balance.toFixed(2)}`);
      return;
    }

    const transaction = {
      account_name: selectedAccountData.name,
      transaction_type: 'Withdrawal',
      amount: parseFloat(amount),
      date,
      created_at: new Date().toISOString()
    };

    try {
      const savedTransaction = await invoke('add_transaction', { transaction });
      const newBalance = selectedAccountData.balance - parseFloat(amount);
      await invoke('update_account_balance', {
        accountId: selectedAccountData.id,
        newBalance
      });

      onWithdraw(savedTransaction, selectedAccountData.id, newBalance);
      showToast.success('Withdrawal Successful', `$${parseFloat(amount).toFixed(2)} withdrawn from ${selectedAccountData.name}`);
      setSelectedAccount('');
      setAmount('');
      setDate('');
      onClose();
    } catch (error) {
      console.error('Failed to add withdrawal:', error);
      showToast.error('Withdrawal Failed', error.message || 'Please try again');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
        <ArrowDownToLine size={20} />
        Withdraw Funds
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-sm text-zinc-400 block mb-2 font-medium">
            Select Account <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none"
            required
          >
            <option value="">Choose account...</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} - ${acc.balance.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        {selectedAccountData && (
          <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-700">
            <p className="text-sm text-zinc-400">
              Available Balance: <span className="text-white font-semibold">${selectedAccountData.balance.toFixed(2)}</span>
            </p>
          </div>
        )}

        <div>
          <label className="text-sm text-zinc-400 block mb-2 font-medium">
            Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            max={selectedAccountData?.balance || 0}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none placeholder:text-zinc-600"
            required
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 block mb-2 font-medium">
            Date <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={date}
            onChange={setDate}
            placeholder="Select date"
          />
        </div>

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
            Withdraw
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ----- TRANSFER MODAL -----
function TransferModal({ isOpen, onClose, accounts, onTransfer }) {
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  const fromAccountData = accounts.find(a => a.id.toString() === fromAccount);
  const toAccountData = accounts.find(a => a.id.toString() === toAccount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromAccount || !toAccount || !amount || !date) {
      showToast.error('Please fill in all fields');
      return;
    }

    if (fromAccount === toAccount) {
      showToast.error('Invalid Transfer', 'Cannot transfer to the same account');;
      return;
    }

    if (parseFloat(amount) > fromAccountData.balance) {
      showToast.error('Insufficient balance');
      return;
    }

    try {
      const withdrawalTransaction = {
        account_name: fromAccountData.name,
        transaction_type: 'Transfer Out',
        amount: parseFloat(amount),
        date,
        created_at: new Date().toISOString()
      };

      const depositTransaction = {
        account_name: toAccountData.name,
        transaction_type: 'Transfer In',
        amount: parseFloat(amount),
        date,
        created_at: new Date().toISOString()
      };

      await invoke('add_transaction', { transaction: withdrawalTransaction });
      await invoke('add_transaction', { transaction: depositTransaction });

      const newFromBalance = fromAccountData.balance - parseFloat(amount);
      const newToBalance = toAccountData.balance + parseFloat(amount);

      await invoke('update_account_balance', {
        accountId: fromAccountData.id,
        newBalance: newFromBalance
      });
      await invoke('update_account_balance', {
        accountId: toAccountData.id,
        newBalance: newToBalance
      });

      onTransfer(fromAccountData.id, newFromBalance, toAccountData.id, newToBalance);
      showToast.success('Transfer Complete', `$${parseFloat(amount).toFixed(2)} transferred from ${fromAccountData.name} to ${toAccountData.name}`);
      setFromAccount('');
      setToAccount('');
      setAmount('');
      setDate('');
      onClose();
    } catch (error) {
      console.error('Failed to transfer:', error);
      showToast.error('Transfer Failed', error.message || 'Please try again');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
        <ArrowLeftRight size={20} />
        Transfer Funds
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-sm text-zinc-400 block mb-2 font-medium">
            From Account <span className="text-red-500">*</span>
          </label>
          <select
            value={fromAccount}
            onChange={(e) => setFromAccount(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none"
            required
          >
            <option value="">Choose account...</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} - ${acc.balance.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-zinc-400 block mb-2 font-medium">
            To Account <span className="text-red-500">*</span>
          </label>
          <select
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none"
            required
          >
            <option value="">Choose account...</option>
            {accounts.filter(acc => acc.id.toString() !== fromAccount).map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} - ${acc.balance.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        {fromAccountData && (
          <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-700">
            <p className="text-sm text-zinc-400">
              Available Balance: <span className="text-white font-semibold">${fromAccountData.balance.toFixed(2)}</span>
            </p>
          </div>
        )}

        <div>
          <label className="text-sm text-zinc-400 block mb-2 font-medium">
            Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            max={fromAccountData?.balance || 0}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none placeholder:text-zinc-600"
            required
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 block mb-2 font-medium">
            Date <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={date}
            onChange={setDate}
            placeholder="Select date"
          />
        </div>

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
            Transfer
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ----- ADD ACCOUNT MODAL -----
function AddAccountModal({ isOpen, onClose, onAddAccount }) {
  const [formData, setFormData] = useState({
    brokerName: '',
    accountNumber: '',
    accountNickname: '',
    accountType: 'Live',
    accountPlan: 'Standard',
    leverage: '1:200',
    tradingTerminal: 'MT5'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.brokerName || !formData.accountNumber) {
      showToast.warning('Missing Information', 'Please fill in all required fields');
      return;
    }

    const newAccount = {
      name: `${formData.brokerName} - ${formData.accountNumber}`,
      broker: formData.brokerName,
      account_number: formData.accountNumber,
      account_nickname: formData.accountNickname,
      account_type: formData.accountType,
      account_plan: formData.accountPlan,
      balance: 0,  // ADD THIS
      total_deposits: 0, 
      leverage: formData.leverage,
      trading_terminal: formData.tradingTerminal,
      created_at: new Date().toISOString()
    };

    try {
      const savedAccount = await invoke('add_account', { account: newAccount });
      onAddAccount(savedAccount);
      showToast.success('Account Created', `${newAccount.broker} account added successfully`);
      setFormData({
        brokerName: '',
        accountNumber: '',
        accountNickname: '',
        accountType: 'Live',
        accountPlan: 'Standard',
        leverage: '1:200',
        tradingTerminal: 'MT5'
      });

      onClose();
    } catch (error) {
      console.error('Failed to add account:', error);
      showToast.error('Failed to add account. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-xl font-semibold mb-6 text-white">
        Add Trading Account
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div>
            <label className="text-sm text-zinc-400 block mb-2 font-medium">
              Account Nickname
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

        <div className="flex gap-4">
          <div className="flex-1">
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

          <div className="flex-1">
            <label className="text-sm text-zinc-400 block mb-2 font-medium">
              Account Plan
            </label>
            <select
              name="accountPlan"
              value={formData.accountPlan}
              onChange={handleChange}
              className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none"
            >
              <option value="Standard">Standard</option>
              <option value="Standard Cent">Standard Cent</option>
              <option value="Pro">Pro</option>
              <option value="Raw Spread">Raw Spread</option>
              <option value="Zero Spread">Zero Spread</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <label className="text-sm text-zinc-400 block mb-2 font-medium">
              Trading platform
            </label>
            <select
              name="tradingTerminal"
              value={formData.tradingTerminal}
              onChange={handleChange}
              className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none"
            >
              <option value="MT4">MT4</option>
              <option value="MT5">MT5</option>
              <option value="C-Trader">C-Trader</option>
            </select>
          </div>
        </div>
        
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

// ----- EDIT ACCOUNT MODAL -----
function EditAccountModal({ isOpen, onClose, account, onUpdateAccount }) {
  const [formData, setFormData] = useState({
    brokerName: account?.broker || '',
    accountNumber: account?.account_number || '',
    accountNickname: account?.account_nickname || '',
    accountType: account?.account_type || 'Live',
    accountPlan: account?.account_plan || 'Standard',
    leverage: account?.leverage || '1:200',
    tradingTerminal: account?.trading_terminal || 'MT5',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        brokerName: account.broker,
        accountNumber: account.account_number,
        accountNickname: account.account_nickname,
        accountType: account.account_type,
        accountPlan: account.account_plan,
        leverage: account.leverage,
        tradingTerminal: account.trading_terminal,
      });
    }
  }, [account]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedAccount = {
      id: account.id,
      name: `${formData.brokerName} - ${formData.accountNumber}`,
      broker: formData.brokerName,
      account_number: formData.accountNumber,
      account_nickname: formData.accountNickname,
      account_type: formData.accountType,
      account_plan: formData.accountPlan,
      balance: account.balance,  // ADD THIS
      total_deposits: account.total_deposits,
      leverage: formData.leverage,
      trading_terminal: formData.tradingTerminal,
      created_at: account.created_at,
    };

    try {
      const savedAccount = await invoke('update_account', { account: updatedAccount });
      onUpdateAccount(savedAccount);
      showToast.success('Account Updated', `${updatedAccount.broker} updated successfully`);
      onClose();
    } catch (error) {
      console.error('Failed to update account:', error);
      showToast.error('Failed to Add Account', error.message || 'Please try again');
    }
  };

  if (!account) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-xl font-semibold mb-6 text-white">
        Edit Trading Account
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div>
            <label className="text-sm text-zinc-400 block mb-2 font-medium">
              Account Nickname
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

        <div className="flex gap-4">
          <div className="flex-1">
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

          <div className="flex-1">
            <label className="text-sm text-zinc-400 block mb-2 font-medium">
              Account Plan
            </label>
            <select
              name="accountPlan"
              value={formData.accountPlan}
              onChange={handleChange}
              className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none"
            >
              <option value="Standard">Standard</option>
              <option value="Standard Cent">Standard Cent</option>
              <option value="Pro">Pro</option>
              <option value="Raw Spread">Raw Spread</option>
              <option value="Zero Spread">Zero Spread</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
            name="tradingTerminal"
            value={formData.tradingTerminal}
            onChange={handleChange}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg w-full text-white focus:border-white focus:outline-none"
          >
            <option value="MT4">MT4</option>
            <option value="MT5">MT5</option>
            <option value="C-Trader">C-Trader</option>
          </select>
        </div>

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
            Update Account
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
      filtered = filtered.filter(t => t.account_name === selectedAccount);
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
      showToast.warning('No Data', 'No transactions to export');
      return;
    }

    const headers = "Account Name,Type,Amount,Date\n";
    const rows = filteredTransactions.map(t =>
      `"${t.account_name}","${t.transaction_type}",${t.amount},"${t.date}"`
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

    showToast.success('Export Complete', 'Transaction history downloaded successfully');
  };

  const exportToHTML = () => {
    if (filteredTransactions.length === 0) {
      showToast.error("No transactions to export!");
      return;
    }

    const totalDeposits = filteredTransactions
      .filter(t => t.transaction_type === "Deposit")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = filteredTransactions
      .filter(t => t.transaction_type === "Withdrawal")
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
                    <td>${t.account_name}</td>
                    <td>${t.transaction_type}</td>
                    <td class="${t.transaction_type.toLowerCase()}">
                        ${t.transaction_type === "Deposit" ? "+" : "-"}$${t.amount.toFixed(2)}
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
    showToast.success('Export Complete', 'Transaction history downloaded successfully');
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
              <FileText size={18} />
              PDF
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
                {fileType === "excel" ? "Excel (CSV)" : "PDF Report"}
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
  const [transactions, setTransactions] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAccountForTransaction, setSelectedAccountForTransaction] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [balanceVisibility, setBalanceVisibility] = useState({});
  const [inactivityTimers, setInactivityTimers] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const resetTimer = () => {
      // Clear all timers
      Object.keys(balanceVisibility).forEach(accountId => {
        if (inactivityTimers[accountId]) {
          clearTimeout(inactivityTimers[accountId]);
        }
      });

      // Set new timers for visible balances
      const newTimers = {};
      Object.entries(balanceVisibility).forEach(([accountId, isVisible]) => {
        if (isVisible) {
          newTimers[accountId] = setTimeout(() => {
            setBalanceVisibility(prev => ({
              ...prev,
              [accountId]: false
            }));
          }, 10000); // 10 seconds
        }
      });
      setInactivityTimers(newTimers);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      Object.values(inactivityTimers).forEach(timer => clearTimeout(timer));
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [balanceVisibility]);

  const loadData = async () => {
    try {
      const [loadedAccounts, loadedTransactions] = await Promise.all([
        invoke('get_all_accounts'),
        invoke('get_all_transactions')
      ]);

      setAccounts(loadedAccounts || []);
      setTransactions(loadedTransactions || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = (newAccount) => {
    setAccounts(prev => [newAccount, ...prev]);
  };

  const openEditAccountModal = (account) => {
    setSelectedAccount(account);
    setIsEditAccountModalOpen(true);
  };

  const handleUpdateAccount = (updatedAccount) => {
    setAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading accounts...</p>
        </div>
      </div>
    );
  }
  const handleDeposit = (transaction, accountId, newBalance) => {
    setTransactions(prev => [transaction, ...prev]);
    setAccounts(prev => prev.map(acc => acc.id === accountId ? {...acc, balance: newBalance} : acc));
  };

  const handleWithdraw = (transaction, accountId, newBalance) => {
    setTransactions(prev => [transaction, ...prev]);
    setAccounts(prev => prev.map(acc => acc.id === accountId ? {...acc, balance: newBalance} : acc));
  };

  const handleTransfer = (fromAccountId, newFromBalance, toAccountId, newToBalance) => {
    setAccounts(prev => prev.map(acc =>
      acc.id === fromAccountId ? {...acc, balance: newFromBalance} :
      acc.id === toAccountId ? {...acc, balance: newToBalance} : acc
    ));
  };

  const handleDeleteAccount = async (accountId) => {
    try {
      await invoke('delete_account', { accountId });
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
    } catch (error) {
      console.error('Failed to delete account:', error);
      showToast.error('Failed to delete account. Please try again.');
    }
  };

  
  return (
    <div className="min-h-screen bg-transparent text-white p-0">
      <div className="max-w-7xl mx-auto px-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((account) => (
            <div key={account.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{account.broker}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      account.account_type === 'Live'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-zinc-700 text-zinc-300'
                    }`}>
                      {account.account_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-400">
                      #{account.account_number}
                    </span>

                    <button
                      onClick={() => openEditAccountModal(account)}
                      title="Edit account"
                      className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setAccountToDelete(account); // Pass the whole account object
                        setIsDeleteConfirmOpen(true);
                      }}
                      title="Delete account"
                      className="p-1.5 rounded-md text-red-400 hover:text-white hover:bg-red-700 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="text-3xl font-bold text-green-500">
                    {balanceVisibility[account.id] ? `$${account.balance.toFixed(2)}` : '••••••••'}
                  </div>
                  <button
                    onClick={() => {
                      setBalanceVisibility(prev => ({
                        ...prev,
                        [account.id]: !prev[account.id]
                      }));
                    }}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    title={balanceVisibility[account.id] ? "Hide balance" : "Show balance"}
                  >
                    {balanceVisibility[account.id] ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                  <span>Leverage <span className="text-white font-semibold">{account.leverage}</span></span>
                  <span>Platform <span className="text-white font-semibold">{account.trading_terminal}</span></span>
                  {account.account_nickname && (
                    <span>Alias <span className="text-white font-semibold">{account.account_nickname}</span></span>
                  )}
                  <span>Type <span className="text-white font-semibold">{account.account_plan}</span></span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedAccountForTransaction(account);
                      setIsWithdrawModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-zinc-800 hover:bg-white text-white hover:text-black rounded-lg transition-all duration-200 border border-zinc-700 hover:border-zinc-300 font-semibold text-sm"
                  >
                    <ArrowDownToLine size={16} />
                    Withdraw
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAccountForTransaction(account);
                      setIsTransferModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-zinc-800 hover:bg-white text-white hover:text-black rounded-lg transition-all duration-200 border border-zinc-700 hover:border-zinc-300 font-semibold text-sm"
                  >
                    <ArrowLeftRight size={16} />
                    Transfer
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAccountForTransaction(account);
                      setIsDepositModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-zinc-800 hover:bg-white text-white hover:text-black rounded-lg transition-all duration-200 border border-zinc-700 hover:border-zinc-300 font-semibold text-sm"
                  >
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

      <button
        onClick={() => setIsAddAccountModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-white text-black rounded-full shadow-lg hover:bg-zinc-200 transition flex items-center justify-center group"
        aria-label="Add Account"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

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

      <EditAccountModal
        isOpen={isEditAccountModalOpen}
        onClose={() => setIsEditAccountModalOpen(false)}
        account={selectedAccount}
        onUpdateAccount={handleUpdateAccount}
      />
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        accounts={accounts}
        onDeposit={handleDeposit}
      />

      <WithdrawalModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        accounts={accounts}
        onWithdraw={handleWithdraw}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={accounts}
        onTransfer={handleTransfer}
      />
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setAccountToDelete(null);
        }}
        onConfirm={async () => {
          if (accountToDelete) {
            await handleDeleteAccount(accountToDelete.id);
            showToast.success('Account Deleted', `The account "${accountToDelete.broker}" was deleted successfully.`);
            setIsDeleteConfirmOpen(false);
            setAccountToDelete(null);
          }
        }}
        title="Delete Trading Account"
        message={
          accountToDelete
            ? `Are you sure you want to delete the account "${accountToDelete.broker}"${
                accountToDelete.account_nickname ? ` (Alias: "${accountToDelete.account_nickname}")` : ""
              }? This action cannot be undone.`
            : "Are you sure you want to delete this account? This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}