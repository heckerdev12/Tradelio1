function TradesPage() {
  // Sample trade data (replace with real data later)
  const trades = [
    { id: 1, symbol: 'AAPL', type: 'BUY', quantity: 10, price: 175.50, date: '2024-12-08', profit: 125.00 },
    { id: 2, symbol: 'GOOGL', type: 'SELL', quantity: 5, price: 140.25, date: '2024-12-07', profit: -50.00 },
    { id: 3, symbol: 'MSFT', type: 'BUY', quantity: 15, price: 380.00, date: '2024-12-06', profit: 220.00 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-0 py-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Trade History</h2>
        <button className="bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors">
          + Add Trade
        </button>
      </div>
      
      {/* Trade Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-zinc-400">Date</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-zinc-400">Symbol</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-zinc-400">Type</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-zinc-400">Quantity</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-zinc-400">Price</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-zinc-400">P&L</th>
            </tr>
          </thead>
          <tbody>
            {trades.map(trade => (
              <tr key={trade.id} className="border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 text-sm text-zinc-300">{trade.date}</td>
                <td className="px-6 py-4 text-sm font-medium">{trade.symbol}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    trade.type === 'BUY' ? 'bg-blue-900/50 text-blue-400' : 'bg-orange-900/50 text-orange-400'
                  }`}>
                    {trade.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-right text-zinc-300">{trade.quantity}</td>
                <td className="px-6 py-4 text-sm text-right text-zinc-300">${trade.price.toFixed(2)}</td>
                <td className={`px-6 py-4 text-sm text-right font-medium ${
                  trade.profit >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TradesPage;