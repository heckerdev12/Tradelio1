import { useEffect, useRef } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';

const CalendarPage = () => {
  const widgetRef = useRef(null);

  useEffect(() => {
    // Load TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      isTransparent: true,
      width: "100%",
      height: "100%",
      locale: "en",
      importanceFilter: "-1,0,1",
      countryFilter: "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu"
    });

    if (widgetRef.current) {
      widgetRef.current.appendChild(script);
    }

    return () => {
      // Cleanup
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="h-screen bg-transparent text-white overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto px-0 w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-800 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Economic Calendar</h1>
                <p className="text-sm text-zinc-400 mt-1">Track major economic events and market-moving news</p>
              </div>
            </div>

            {/* Impact Levels - Moved to header */}
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                High Impact
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                Medium Impact
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                Low Impact
              </span>
            </div>
          </div>
        </div>

        {/* TradingView Economic Calendar Widget */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex-1 mb-4">
          <div 
            ref={widgetRef}
            className="tradingview-widget-container w-full h-full"
          >
            <div 
              className="tradingview-widget-container__widget w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;