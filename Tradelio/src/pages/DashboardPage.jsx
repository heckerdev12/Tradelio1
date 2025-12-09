import PnLCard from '../components/PnLCard';

function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
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
  );
}

export default DashboardPage;