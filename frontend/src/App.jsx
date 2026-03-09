
import React, { useState } from 'react';

function App() {
  const [tickers] = useState([
    { symbol: 'AAPL', name: 'Apple', price: 150.25, change: 2.15 },
    { symbol: 'TSLA', name: 'Tesla', price: 242.80, change: -1.50 },
    { symbol: 'GOOGL', name: 'Google', price: 139.45, change: 0.85 },
    { symbol: 'MSFT', name: 'Microsoft', price: 380.15, change: 3.20 },
  ]);
  const [selectedTicker, setSelectedTicker] = useState(tickers[0]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Trading Dashboard</h1>
          <p className="text-blue-100">Real-time market data & analytics</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Market Tickers</h2>
          <div className="space-y-2">
            {tickers.map(ticker => (
              <button
                key={ticker.symbol}
                onClick={() => setSelectedTicker(ticker)}
                className={`w-full p-4 rounded-lg transition-all ${
                  selectedTicker.symbol === ticker.symbol
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-slate-800 shadow hover:shadow-md border border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">{ticker.symbol}</span>
                  <span className={ticker.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${ticker.price}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm opacity-75">
                  <span>{ticker.name}</span>
                  <span className={ticker.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {ticker.change > 0 ? '+' : ''}{ticker.change}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">
          {/* Selected Ticker Info */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{selectedTicker.symbol}</h2>
            <p className="text-slate-500 text-sm mb-4">{selectedTicker.name}</p>
            
            <div className="flex items-end gap-4">
              <div>
                <div className="text-5xl font-bold text-slate-800">
                  ${selectedTicker.price}
                </div>
                <div className={`text-xl font-semibold mt-2 ${
                  selectedTicker.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedTicker.change > 0 ? '▲' : '▼'} {selectedTicker.change > 0 ? '+' : ''}{selectedTicker.change}%
                </div>
              </div>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="bg-white rounded-lg shadow-lg p-8 h-96 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <p className="text-lg mb-2">📊 Chart Coming Soon</p>
              <p className="text-sm">Interactive charts will appear here</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
