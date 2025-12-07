import PnLCard from './components/PnLCard';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Trading Dashboard
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PnLCard 
            title="Today's P&L"
            amount="$1,250.00"
            isPositive={true}
            percentage="2.5"
          />
          
          <PnLCard 
            title="This Week"
            amount="$850.00"
            isPositive={false}
            percentage="1.2"
          />
          
          <PnLCard 
            title="This Month"
            amount="$5,420.00"
            isPositive={true}
            percentage="8.3"
          />
        </div>
      </div>
    </div>
  );
}

export default App;