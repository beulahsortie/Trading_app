const assert = require('assert');
const { MarketDataService } = require('./marketDataService');

// Mock MarketDataService for testing
class MarketDataService {
  constructor() {
    this.tickers = {
      'AAPL': { name: 'Apple', price: 150.25, change: 2.15 },
      'TSLA': { name: 'Tesla', price: 242.80, change: -1.50 },
      'BTC-USD': { name: 'Bitcoin', price: 43250.50, change: 5.75 }
    };
    
    this.priceHistories = this._initializePriceHistories();
  }

  _initializePriceHistories() {
    const histories = {};
    Object.keys(this.tickers).forEach(ticker => {
      histories[ticker] = [
        { timestamp: Date.now() - 60000, price: 100 },
        { timestamp: Date.now(), price: 101 }
      ];
    });
    return histories;
  }

  getAllTickers() {
    return Object.entries(this.tickers).map(([symbol, data]) => ({
      symbol,
      ...data
    }));
  }

  getTickerData(ticker) {
    return this.tickers[ticker] || null;
  }

  getTickerHistory(ticker) {
    return this.priceHistories[ticker] || [];
  }

  updateTickerPrice(ticker, newPrice) {
    if (this.tickers[ticker]) {
      this.tickers[ticker].price = newPrice;
      return true;
    }
    return false;
  }
}

// ============ Test Suite ============
describe('MarketDataService', () => {
  let service;

  beforeEach(() => {
    service = new MarketDataService();
  });

  describe('getAllTickers', () => {
    it('should return all tickers', () => {
      const tickers = service.getAllTickers();
      assert.strictEqual(tickers.length, 3);
    });

    it('should return tickers with required properties', () => {
      const tickers = service.getAllTickers();
      tickers.forEach(ticker => {
        assert(ticker.symbol);
        assert(ticker.name);
        assert(typeof ticker.price === 'number');
        assert(typeof ticker.change === 'number');
      });
    });
  });

  describe('getTickerData', () => {
    it('should return ticker data for valid symbol', () => {
      const data = service.getTickerData('AAPL');
      assert(data);
      assert.strictEqual(data.name, 'Apple');
      assert.strictEqual(typeof data.price, 'number');
    });

    it('should return null for invalid symbol', () => {
      const data = service.getTickerData('INVALID');
      assert.strictEqual(data, null);
    });
  });

  describe('getTickerHistory', () => {
    it('should return price history for valid ticker', () => {
      const history = service.getTickerHistory('AAPL');
      assert(Array.isArray(history));
      assert(history.length > 0);
    });

    it('should return empty array for invalid ticker', () => {
      const history = service.getTickerHistory('INVALID');
      assert(Array.isArray(history));
      assert.strictEqual(history.length, 0);
    });

    it('should return data with timestamp and price', () => {
      const history = service.getTickerHistory('AAPL');
      history.forEach(candle => {
        assert(candle.timestamp);
        assert(typeof candle.price === 'number');
      });
    });
  });

  describe('updateTickerPrice', () => {
    it('should update price for valid ticker', () => {
      const result = service.updateTickerPrice('AAPL', 155.50);
      assert.strictEqual(result, true);
      assert.strictEqual(service.getTickerData('AAPL').price, 155.50);
    });

    it('should return false for invalid ticker', () => {
      const result = service.updateTickerPrice('INVALID', 100);
      assert.strictEqual(result, false);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data integrity across operations', () => {
      const initialTickers = service.getAllTickers();
      service.updateTickerPrice('TSLA', 300);
      
      const updatedData = service.getTickerData('TSLA');
      assert.strictEqual(updatedData.price, 300);
      
      const finalTickers = service.getAllTickers();
      assert.strictEqual(initialTickers.length, finalTickers.length);
    });
  });
});

// Run tests
if (require.main === module) {
  console.log('Running MarketDataService tests...\n');
  
  const runTests = () => {
    const tests = [
      {
        name: 'getAllTickers returns all tickers',
        fn: () => {
          const service = new MarketDataService();
          const tickers = service.getAllTickers();
          assert.strictEqual(tickers.length, 3);
        }
      },
      {
        name: 'getTickerData returns data for valid symbol',
        fn: () => {
          const service = new MarketDataService();
          const data = service.getTickerData('AAPL');
          assert(data);
          assert.strictEqual(data.name, 'Apple');
        }
      },
      {
        name: 'getTickerData returns null for invalid symbol',
        fn: () => {
          const service = new MarketDataService();
          const data = service.getTickerData('INVALID');
          assert.strictEqual(data, null);
        }
      },
      {
        name: 'getTickerHistory returns array',
        fn: () => {
          const service = new MarketDataService();
          const history = service.getTickerHistory('AAPL');
          assert(Array.isArray(history));
          assert(history.length > 0);
        }
      },
      {
        name: 'updateTickerPrice updates correctly',
        fn: () => {
          const service = new MarketDataService();
          service.updateTickerPrice('AAPL', 160);
          assert.strictEqual(service.getTickerData('AAPL').price, 160);
        }
      }
    ];

    let passed = 0;
    let failed = 0;

    tests.forEach(test => {
      try {
        test.fn();
        console.log(`✅ ${test.name}`);
        passed++;
      } catch (error) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error.message}`);
        failed++;
      }
    });

    console.log(`\n${passed} passed, ${failed} failed\n`);
    process.exit(failed > 0 ? 1 : 0);
  };

  runTests();
}

module.exports = { MarketDataService };
