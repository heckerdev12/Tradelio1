import React, { useState } from 'react';
import { Upload, Plus, Filter, ChevronDown, Calendar, Pencil } from 'lucide-react';
import Modal from '../components/Modal';
import DatePicker from '../components/DatePicker';
import { showToast } from '../utils/toastConfig';
import { supabase } from "../lib/supabase";

function TradesPage() {
  const [selectedAccount, setSelectedAccount] = useState('standard-cent-account');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trades, setTrades] = useState([]);
  const [showAddTradeModal, setShowAddTradeModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showEditTradeModal, setShowEditTradeModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [expandedTradeId, setExpandedTradeId] = useState(null);
  const [newTrade, setNewTrade] = useState({
    symbol: '',
    type: 'BUY',
    date: '',
    session: 'New York',
    lotSize: 1.0,
    price: 0,
    stopLoss: 0,
    takeProfit: 0,
    swap: 0,
    commission: 0,
    profit: 0,
    account: 'standard-cent-account'
  });

  const accounts = [
    { id: 'standard-cent-account', name: 'Standard Cent Account', type: 'Cent', currency: 'USD' },
    { id: 'standard-account', name: 'Standard Account', type: 'Standard', currency: 'USD' },
    { id: 'european-account', name: 'European Account', type: 'Standard', currency: 'EUR' },
  ];

  const sessionOptions = ['New York', 'London', 'Tokyo', 'Sydney', 'Hong Kong'];

  const calculateAdjustedProfit = (trade) => {
    const profit = trade.profit;
    if (trade.account === 'standard-cent-account') {
      return profit / 100;
    }
    return profit;
  };

  const filteredTrades = trades.filter(trade => {
    const matchesAccount = !selectedAccount || trade.account === selectedAccount;
    const tradeDate = new Date(trade.date);

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && tradeDate >= new Date(startDate);
    }
    if (endDate) {
      matchesDate = matchesDate && tradeDate <= new Date(endDate);
    }

    return matchesAccount && matchesDate;
  });

  const handleCSVImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Importing CSV file:', file.name);
    }
  };

  const toggleTradeDetails = (tradeId) => {
    setExpandedTradeId(expandedTradeId === tradeId ? null : tradeId);
  };

  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    setShowEditTradeModal(true);
  };

  const handleAddTrade = () => {
    const newId = trades.length > 0 ? Math.max(...trades.map(t => t.id)) + 1 : 1;
    setTrades([...trades, { ...newTrade, id: newId }]);
    setShowAddTradeModal(false);
    setNewTrade({
      symbol: '',
      type: 'BUY',
      date: '',
      session: 'New York',
      lotSize: 1.0,
      price: 0,
      stopLoss: 0,
      takeProfit: 0,
      swap: 0,
      commission: 0,
      profit: 0,
      account: 'standard-cent-account'
    });
  };

  const handleUpdateTrade = () => {
    setTrades(trades.map(t => t.id === editingTrade.id ? editingTrade : t));
    setShowEditTradeModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trade History</h1>
          <p className="text-zinc-400">View and manage all your trading activities</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Account Selection */}
          <div className="relative">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="appearance-none bg-zinc-800 border border-zinc-700 text-white rounded-lg pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="">All Accounts</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none" />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>

          {/* Action Buttons */}
          <label className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setShowAddTradeModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Trade
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm mb-1">Total Trades</p>
          <p className="text-2xl font-bold text-white">{filteredTrades.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm mb-1">Win Rate</p>
          <p className="text-2xl font-bold text-green-500">
            {filteredTrades.length > 0
              ? `${Math.round((filteredTrades.filter(t => t.profit > 0).length / filteredTrades.length) * 100)}%`
              : '0%'}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm mb-1">Total P&L</p>
          <p className={`text-2xl font-bold ${
            filteredTrades.reduce((sum, t) => sum + calculateAdjustedProfit(t), 0) >= 0
              ? 'text-green-500'
              : 'text-red-500'
          }`}>
            ${filteredTrades.reduce((sum, t) => sum + calculateAdjustedProfit(t), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm mb-1">Avg. Profit</p>
          <p className={`text-2xl font-bold ${
            filteredTrades.length > 0 && (filteredTrades.reduce((sum, t) => sum + calculateAdjustedProfit(t), 0) / filteredTrades.length) >= 0
              ? 'text-green-500'
              : 'text-red-500'
          }`}>
            ${filteredTrades.length > 0
              ? (filteredTrades.reduce((sum, t) => sum + calculateAdjustedProfit(t), 0) / filteredTrades.length).toFixed(2)
              : '0.00'
            }
          </p>
        </div>
      </div>

      {/* Trade Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Date</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Symbol</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Type</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-zinc-400">Quantity</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-zinc-400">Entry Price</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-zinc-400">P&L</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Session</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400"></th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.map(trade => {
              const adjustedProfit = calculateAdjustedProfit(trade);
              const isExpanded = expandedTradeId === trade.id;

              return (
                <React.Fragment key={trade.id}>
                  <tr className="border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-zinc-300">{trade.date}</td>
                    <td className="px-6 py-4 text-sm font-medium">{trade.symbol}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.type === 'BUY' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-zinc-300">
                      {trade.quantity} ({trade.lotSize} lot)
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-zinc-300">${trade.price.toFixed(2)}</td>
                    <td className={`px-6 py-4 text-sm text-right font-medium ${
                      adjustedProfit >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {adjustedProfit >= 0 ? '+' : ''}${adjustedProfit.toFixed(2)}
                      {trade.account === 'standard-cent-account' && (
                        <span className="text-xs text-zinc-400 ml-1">({trade.profit} USC)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-300">
                      <span className="px-2 py-1 bg-zinc-800 rounded text-xs">{trade.session}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400 flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditTrade(trade); }}
                        className="p-1 hover:bg-zinc-700 rounded"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform cursor-pointer ${isExpanded ? 'rotate-180' : ''}`}
                        onClick={() => toggleTradeDetails(trade.id)}
                      />
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-zinc-800/30">
                      <td colSpan="8" className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-zinc-400 mb-1">Stop Loss</p>
                            <p className="text-white">${trade.stopLoss?.toFixed(2) || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-zinc-400 mb-1">Take Profit</p>
                            <p className="text-white">${trade.takeProfit?.toFixed(2) || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-zinc-400 mb-1">Swap</p>
                            <p className="text-white">${trade.swap?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div>
                            <p className="text-zinc-400 mb-1">Commission</p>
                            <p className="text-white">${trade.commission?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div>
                            <p className="text-zinc-400 mb-1">Account Type</p>
                            <p className="text-white">
                              {accounts.find(a => a.id === trade.account)?.type || 'Standard'}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-400 mb-1">Net P&L</p>
                            <p className={`font-medium ${
                              (adjustedProfit - (trade.commission || 0) - (trade.swap || 0)) >= 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}>
                              ${((adjustedProfit - (trade.commission || 0) - (trade.swap || 0))).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {filteredTrades.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-400">No trades found for selected filters</p>
            <button
              onClick={() => setShowAddTradeModal(true)}
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Trade
            </button>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} maxWidth="max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Filter Trades</h3>
          </div>

          <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 mb-4">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-400 text-sm">From</span>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="Start"
              align="left"
            />
            <span className="text-zinc-400 text-sm mx-1">—</span>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="End"
              align="right"
            />
            {(startDate || endDate) && (
              <button
                onClick={clearDateFilters}
                className="text-zinc-400 hover:text-zinc-200 ml-2"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowFilterModal(false)}
              className="px-4 py-2 text-zinc-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowFilterModal(false)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Trade Modal */}
      <Modal isOpen={showAddTradeModal} onClose={() => setShowAddTradeModal(false)} maxWidth="max-w-2xl">
        <div className="p-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Add New Trade</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="md:col-span-2">
              <div className="flex flex-col md:flex-row gap-4">
                
                {/* Account */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Account
                  </label>
                  <select
                    value={newTrade.account}
                    onChange={(e) =>
                      setNewTrade({ ...newTrade, account: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Symbol */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Symbol
                  </label>
                  <input
                    type="text"
                    value={newTrade.symbol}
                    onChange={(e) =>
                      setNewTrade({ ...newTrade, symbol: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., AAPL, EUR/USD"
                  />
                </div>
              </div>
            </div>


            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Direction</label>
              <select
                value={newTrade.type}
                onChange={(e) => setNewTrade({...newTrade, type: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Date</label>
              <DatePicker
                value={newTrade.date}
                onChange={(date) => setNewTrade({...newTrade, date: date})}
                placeholder="Trade Date"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Session</label>
              <select
                value={newTrade.session}
                onChange={(e) => setNewTrade({...newTrade, session: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sessionOptions.map(session => (
                  <option key={session} value={session}>{session}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Lot Size</label>
              <input
                type="number"
                step="0.01"
                value={newTrade.lotSize}
                onChange={(e) => setNewTrade({...newTrade, lotSize: parseFloat(e.target.value)})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Entry Price</label>
              <input
                type="number"
                step="0.01"
                value={newTrade.price}
                onChange={(e) => setNewTrade({...newTrade, price: parseFloat(e.target.value)})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 175.50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Stop Loss</label>
              <input
                type="number"
                step="0.01"
                value={newTrade.stopLoss}
                onChange={(e) => setNewTrade({...newTrade, stopLoss: parseFloat(e.target.value)})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Take Profit</label>
              <input
                type="number"
                step="0.01"
                value={newTrade.takeProfit}
                onChange={(e) => setNewTrade({...newTrade, takeProfit: parseFloat(e.target.value)})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Swap</label>
              <input
                type="number"
                step="0.01"
                value={newTrade.swap}
                onChange={(e) => setNewTrade({...newTrade, swap: parseFloat(e.target.value)})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 0.50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Commission</label>
              <input
                type="number"
                step="0.01"
                value={newTrade.commission}
                onChange={(e) => setNewTrade({...newTrade, commission: parseFloat(e.target.value)})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Profit/Loss</label>
              <input
                type="number"
                step="0.01"
                value={newTrade.profit}
                onChange={(e) => setNewTrade({...newTrade, profit: parseFloat(e.target.value)})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 125.00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowAddTradeModal(false)}
              className="px-4 py-2 text-zinc-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTrade}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Trade
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Trade Modal */}
      <Modal isOpen={showEditTradeModal} onClose={() => setShowEditTradeModal(false)} maxWidth="max-w-2xl">
        <div className="p-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Edit Trade</h3>
          </div>

          {editingTrade && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="md:col-span-2">
                <div className="flex flex-col md:flex-row gap-4">

                  {/* Account */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Account
                    </label>
                    <select
                      value={editingTrade.account}
                      onChange={(e) =>
                        setEditingTrade({ ...editingTrade, account: e.target.value })
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Symbol */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Symbol
                    </label>
                    <input
                      type="text"
                      value={editingTrade.symbol}
                      onChange={(e) =>
                        setEditingTrade({ ...editingTrade, symbol: e.target.value })
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                </div>
              </div>


              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Direction</label>
                <select
                  value={editingTrade.type}
                  onChange={(e) => setEditingTrade({...editingTrade, type: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Date</label>
                <DatePicker
                  value={editingTrade.date}
                  onChange={(date) => setEditingTrade({...editingTrade, date: date})}
                  placeholder="Trade Date"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Session</label>
                <select
                  value={editingTrade.session}
                  onChange={(e) => setEditingTrade({...editingTrade, session: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sessionOptions.map(session => (
                    <option key={session} value={session}>{session}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Lot Size</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTrade.lotSize}
                  onChange={(e) => setEditingTrade({...editingTrade, lotSize: parseFloat(e.target.value)})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Entry Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTrade.price}
                  onChange={(e) => setEditingTrade({...editingTrade, price: parseFloat(e.target.value)})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Stop Loss</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTrade.stopLoss}
                  onChange={(e) => setEditingTrade({...editingTrade, stopLoss: parseFloat(e.target.value)})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Take Profit</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTrade.takeProfit}
                  onChange={(e) => setEditingTrade({...editingTrade, takeProfit: parseFloat(e.target.value)})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Swap</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTrade.swap}
                  onChange={(e) => setEditingTrade({...editingTrade, swap: parseFloat(e.target.value)})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Commission</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTrade.commission}
                  onChange={(e) => setEditingTrade({...editingTrade, commission: parseFloat(e.target.value)})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Profit/Loss</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTrade.profit}
                  onChange={(e) => setEditingTrade({...editingTrade, profit: parseFloat(e.target.value)})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowEditTradeModal(false)}
              className="px-4 py-2 text-zinc-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateTrade}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default TradesPage;
