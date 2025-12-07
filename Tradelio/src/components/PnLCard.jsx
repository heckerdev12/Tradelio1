function PnLCard({ title, amount, isPositive, percentage }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm">
      <div className="p-6 space-y-1.5">
        <h3 className="text-sm font-medium text-gray-500">
          {title}
        </h3>
        <div className="flex items-baseline gap-2">
          <p className={`text-3xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{amount}
          </p>
          {percentage && (
            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '↑' : '↓'} {percentage}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default PnLCard;