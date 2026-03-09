const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

// ============ Market Data Service ============
class MarketDataService {
  constructor() {
    this.tickers = {
      'AAPL': { name: 'Apple', price: 150.25, change: 2.15 },
      'TSLA': { name: 'Tesla', price: 242.80, change: -1.50 },
      'GOOGL': { name: 'Google', price: 139.45, change: 0.85 },
      'MSFT': { name: 'Microsoft', price: 380.15, change: 3.20 },
      'BTC-USD': { name: 'Bitcoin', price: 43250.50, change: 5.75 },
      'ETH-USD': { name: 'Ethereum', price: 2280.30, change: -2.10 }
    };
    
    this.priceHistories = this._initializePriceHistories();
    this.subscribers = new Set();
    this.startMarketSimulation();
  }

  _initializePriceHistories() {
    const histories = {};
    const now = Date.now();
    const interval = 60000;

    Object.entries(this.tickers).forEach(([ticker, data]) => {
      const basePrice = data.price;
      histories[ticker] = [];
      
      for (let i = 119; i >= 0; i--) {
        const volatility = (Math.random() - 0.5) * (basePrice * 0.02);
        const price = basePrice + (Math.random() - 0.5) * basePrice * 0.05 + volatility;
        histories[ticker].push({
          timestamp: now - (i * interval),
          price: parseFloat(price.toFixed(2)),
          open: parseFloat((price + (Math.random() - 0.5) * 2).toFixed(2)),
          high: parseFloat((price + Math.abs(Math.random() * 3)).toFixed(2)),
          low: parseFloat((price - Math.abs(Math.random() * 3)).toFixed(2))
        });
      }
    });

    return histories;
  }

  startMarketSimulation() {
    setInterval(() => {
      Object.entries(this.tickers).forEach(([ticker, data]) => {
        const volatility = (Math.random() - 0.5) * 2;
        const changePercent = (Math.random() - 0.5) * 0.02;
        const newPrice = data.price * (1 + changePercent);
        
        this.tickers[ticker].price = parseFloat(newPrice.toFixed(2));
        this.tickers[ticker].change = parseFloat((this.tickers[ticker].change + volatility).toFixed(2));

        const now = Date.now();
        this.priceHistories[ticker].push({
          timestamp: now,
          price: this.tickers[ticker].price,
          open: parseFloat((newPrice + (Math.random() - 0.5) * 2).toFixed(2)),
          high: parseFloat((newPrice + Math.abs(Math.random() * 3)).toFixed(2)),
          low: parseFloat((newPrice - Math.abs(Math.random() * 3)).toFixed(2))
        });

        if (this.priceHistories[ticker].length > 120) {
          this.priceHistories[ticker].shift();
        }
      });

      this.broadcastUpdate();
    }, 1000);
  }

  broadcastUpdate() {
    const message = JSON.stringify({
      type: 'price_update',
      data: this.tickers,
      timestamp: Date.now()
    });

    this.subscribers.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  subscribe(client) {
    this.subscribers.add(client);
  }

  unsubscribe(client) {
    this.subscribers.delete(client);
  }

  getAllTickers() {
    return Object.entries(this.tickers).map(([symbol, data]) => ({
      symbol,
      ...data
    }));
  }

  getTickerHistory(ticker) {
    return this.priceHistories[ticker] || [];
  }
}

const marketDataService = new MarketDataService();

// ============ WebSocket Handler ============
wss.on('connection', (ws) => {
  console.log('Client connected');
  marketDataService.subscribe(ws);

  ws.send(JSON.stringify({
    type: 'initial_data',
    data: marketDataService.getAllTickers(),
    timestamp: Date.now()
  }));

  ws.on('close', () => {
    console.log('Client disconnected');
    marketDataService.unsubscribe(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// ============ REST API Endpoints ============

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/tickers', (req, res) => {
  res.json({
    status: 'success',
    data: marketDataService.getAllTickers()
  });
});

app.get('/api/tickers/:symbol', (req, res) => {
  const { symbol } = req.params;
  const ticker = marketDataService.tickers[symbol];

  if (!ticker) {
    return res.status(404).json({
      status: 'error',
      message: `Ticker ${symbol} not found`
    });
  }

  res.json({
    status: 'success',
    data: { symbol, ...ticker }
  });
});

app.get('/api/tickers/:symbol/history', (req, res) => {
  const { symbol } = req.params;
  const { limit = 120 } = req.query;
  
  const history = marketDataService.getTickerHistory(symbol);

  if (!history || history.length === 0) {
    return res.status(404).json({
      status: 'error',
      message: `No history found for ticker ${symbol}`
    });
  }

  const limitedHistory = history.slice(-parseInt(limit));

  res.json({
    status: 'success',
    data: limitedHistory,
    metadata: {
      symbol,
      count: limitedHistory.length
    }
  });
});

// ============ Error Handling ============
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// ============ Start Server ============
const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Trading Backend running on port ${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`REST API: http://localhost:${PORT}/api`);
});
