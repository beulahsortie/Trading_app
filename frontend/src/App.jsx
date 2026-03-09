import React, { useState, useEffect, useRef } from 'react';
import Chart from './Chart';

function App() {
  const [tickers, setTickers] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const wsRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    fetch('/api/tickers')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setTickers(data.data);
          if (data.data.length > 0) {
            setSelectedTicker(data.data[0]);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Connect WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'price_update') {
          const updatedTickers = Object.entries(message.data).map(([symbol, data]) => ({
            symbol,
            ...data
          }));
          setTickers(updatedTickers);
        }
      };

      wsRef.current.onerror = () => {
        console.error('WebSocket error');
        setConnectionStatus('error');
        setError('Connection error. Retrying...');
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        setTimeout(() => {
          wsRef.current = null;
        }, 3000);
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to connect to server');
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen">Error: {error}</div>;

  const statusColor = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    disconnected: 'bg-red-500',
    error: 'bg-red-500'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Trading Dashboard</h1>
            <p className="text-blue-100">Real-time market data & analytics</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusColor[connectionStatus]}`}></div>
            <span className="text-sm">
              {connectionStatus === 'connected' && 'Live'}
              {connectionStatus === 'connecting' && 'Connecting...'}
              {connectionStatus === 'disconnected' && 'Offline'}
              {connectionStatus === 'error' && 'Error'}
            </span>
          </div>
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
                className={`w-full p-4 rounded-lg transition-all text-left ${
                  selectedTicker?.symbol === ticker.symbol
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
          {selectedTicker && (
            <>
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

              {/* Chart */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Price History (2 Hours)</h3>
                <Chart symbol={selectedTicker.symbol} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;