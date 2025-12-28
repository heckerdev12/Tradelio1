import { Newspaper } from 'lucide-react';

const NewsPage = () => {
  return (
    <div className="min-h-screen bg-transparent text-white p-0">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Forex News</h1>
              <p className="text-sm text-zinc-400 mt-1">Stay updated with the latest market news from MyFXBook</p>
            </div>
          </div>
        </div>

        {/* Embedded News Feed */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <iframe
            src="https://justmarkets.com/analytics/economic-calendar"
            className="w-full h-[calc(100vh-200px)] border-none"
            title="MyFXBook News Feed"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      </div>
    </div>
  );
};

export default NewsPage;