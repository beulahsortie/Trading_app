import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign, AlertCircle } from 'lucide-react';

const App = () => {
  const [tickers, setTickers] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    // In Docker: backend is on same network, use backend:3001
    // Locally: backend might be on different port
    let wsUrl;
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Local development
      wsUrl = 'ws://localhost:3001/ws';
    } else {
      // Docker - use relative path or container hostname
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;
    }

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message.type, message);

        if (message.type === 'initial_data') {
          // Backend sends array of tickers
          const tickersArray = Array.isArray(message.data) 
            ? message.data 
            : Object.entries(message.data).map(([symbol, data]) => ({ symbol, ...data }));
          
          console.log('Initial data loaded:', tickersArray);
          setTickers(tickersArray);
          if (tickersArray.length > 0) {
            setSelectedTicker(tickersArray[0].symbol);
            fetchTickerHistory(tickersArray[0].symbol);
          }
        } else if (message.type === 'price_update') {
          // message.data is an object of tickers: {AAPL: {...}, TSLA: {...}, ...}
          // Convert to array for React state
          const tickersArray = Object.entries(message.data).map(([symbol, data]) => ({
            symbol,
            ...data
          }));
          console.log('Price update received:', tickersArray[0]); // Log first ticker as sample
          setTickers(tickersArray);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        setError('Connection error. Retrying...');
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to connect to server');
    }
  }, []);

  // Fetch historical data for a ticker
  const fetchTickerHistory = useCallback(async (symbol) => {
    try {
      // Vite proxy in dev redirects to backend:3001
      // Docker serve/nginx can proxy /api to backend:3001
      const apiUrl = `/api/tickers/${symbol}/history`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const result = await response.json();

      if (result.status === 'success') {
        const formattedHistory = result.data.map((candle) => ({
          timestamp: candle.timestamp,
          price: candle.price,
          time: new Date(candle.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        }));
        setPriceHistory(formattedHistory);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError('Failed to load price history');
    }
  }, []);

  // Initialize WebSocket on mount
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  // Handle ticker selection
  const handleTickerSelect = (symbol) => {
    setSelectedTicker(symbol);
    fetchTickerHistory(symbol);
  };

  const selectedTickerData = tickers.find((t) => t.symbol === selectedTicker);
  const isArrayTickers = Array.isArray(tickers);
  const tickersList = isArrayTickers ? tickers : Object.entries(tickers).map(([symbol, data]) => ({
    symbol,
    ...data
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" style={{
      backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)'
    }}>
      {/* Header */}
      <div className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Trading Dashboard
                </h1>
                <p className="text-sm text-slate-400">Real-time market data & analytics</p>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'
              }`} />
              <span className="text-xs font-medium text-slate-400">
                {connectionStatus === 'connected' && 'Live'}
                {connectionStatus === 'connecting' && 'Connecting...'}
                {connectionStatus === 'error' && 'Error'}
                {connectionStatus === 'disconnected' && 'Reconnecting...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-200">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tickers List */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-100 px-2">Market Tickers</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {tickersList.map((ticker) => {
                const isSelected = selectedTicker === ticker.symbol;
                const isPositive = ticker.change >= 0;
                
                return (
                  <button
                    key={ticker.symbol}
                    onClick={() => handleTickerSelect(ticker.symbol)}
                    className={`w-full p-4 rounded-lg transition-all duration-200 border text-left ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/50 ring-1 ring-blue-400/20'
                        : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-100">{ticker.symbol}</p>
                        <p className="text-xs text-slate-400">{ticker.name}</p>
                      </div>
                      {isPositive ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-lg font-bold text-slate-100">
                        ${ticker.price?.toFixed(2) || 'N/A'}
                      </p>
                      <span className={`text-sm font-semibold px-2 py-1 rounded ${
                        isPositive
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {isPositive ? '+' : ''}{ticker.change?.toFixed(2) || 'N/A'}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTickerData && (
              <>
                {/* Ticker Header */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Selected Asset</p>
                      <h2 className="text-3xl font-bold text-slate-100">{selectedTickerData.symbol}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400 mb-1">Current Price</p>
                      <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        ${selectedTickerData.price?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-900/50 rounded">
                      <p className="text-xs text-slate-400 mb-1">24h Change</p>
                      <p className={`text-lg font-semibold ${
                        selectedTickerData.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedTickerData.change >= 0 ? '+' : ''}{selectedTickerData.change?.toFixed(2) || 'N/A'}%
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900/50 rounded">
                      <p className="text-xs text-slate-400 mb-1">Asset Name</p>
                      <p className="text-lg font-semibold text-slate-200">{selectedTickerData.name}</p>
                    </div>
                    <div className="p-3 bg-slate-900/50 rounded">
                      <p className="text-xs text-slate-400 mb-1">Status</p>
                      <p className="text-lg font-semibold text-slate-200">
                        {connectionStatus === 'connected' ? '🟢 Live' : '🔴 Offline'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price Chart */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4">Price History (Last 2 Hours)</h3>
                  {priceHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={priceHistory}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis 
                          dataKey="time" 
                          stroke="#94a3b8"
                          tick={{ fontSize: 12 }}
                          interval={Math.floor(priceHistory.length / 5)}
                        />
                        <YAxis 
                          stroke="#94a3b8"
                          tick={{ fontSize: 12 }}
                          domain="dataMin - 5"
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: '6px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                          }}
                          labelStyle={{ color: '#94a3b8' }}
                          formatter={(value) => `$${value.toFixed(2)}`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorPrice)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-slate-400">
                      <div className="text-center">
                        <p className="mb-2">Loading chart data...</p>
                        <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin mx-auto" />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Total Assets', value: tickersList.length },
            { label: 'Avg Change', value: `${(tickersList.reduce((sum, t) => sum + (t.change || 0), 0) / tickersList.length).toFixed(2)}%` },
            { label: 'Update Frequency', value: '1 sec' },
            { label: 'Data Points', value: priceHistory.length }
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-slate-100">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;