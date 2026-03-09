
import React, { useState } from 'react';
import './App.css';

function App() {
  const [tickers] = useState([
    { symbol: 'AAPL', name: 'Apple', price: 150.25, change: 2.15 },
    { symbol: 'TSLA', name: 'Tesla', price: 242.80, change: -1.50 },
    { symbol: 'GOOGL', name: 'Google', price: 139.45, change: 0.85 },
  ]);
  const [selectedTicker, setSelectedTicker] = useState(tickers[0]);

  return (
    <div className="app">
      <header className="header">
        <h1>Trading Dashboard</h1>
        <p>Real-time market data</p>
      </header>

      <div className="container">
        <aside className="sidebar">
          <h2>Tickers</h2>
          <div className="ticker-list">
            {tickers.map(ticker => (
              <button
                key={ticker.symbol}
                className={`ticker-card ${selectedTicker.symbol === ticker.symbol ? 'active' : ''}`}
                onClick={() => setSelectedTicker(ticker)}
              >
                <div className="ticker-header">
                  <span className="symbol">{ticker.symbol}</span>
                  <span className={`price ${ticker.change >= 0 ? 'positive' : 'negative'}`}>
                    {ticker.price}
                  </span>
                </div>
                <div className="ticker-info">
                  <span>{ticker.name}</span>
                  <span className={`change ${ticker.change >= 0 ? 'positive' : 'negative'}`}>
                    {ticker.change > 0 ? '+' : ''}{ticker.change}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="main">
          <div className="ticker-detail">
            <h2>{selectedTicker.symbol}</h2>
            <p className="ticker-name">{selectedTicker.name}</p>
            <div className="price-large">${selectedTicker.price}</div>
            <p className={`change-large ${selectedTicker.change >= 0 ? 'positive' : 'negative'}`}>
              {selectedTicker.change > 0 ? '+' : ''}{selectedTicker.change}% change
            </p>
          </div>

          <div className="chart-placeholder">
            <p>Chart will be here </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
