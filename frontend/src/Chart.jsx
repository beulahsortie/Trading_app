import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Chart({ symbol }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch price history
    fetch(`/api/tickers/${symbol}/history`)
      .then(res => res.json())
      .then(result => {
        if (result.status === 'success') {
          const formattedData = result.data.map(item => ({
            time: new Date(item.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            price: item.price,
            timestamp: item.timestamp
          }));
          setData(formattedData);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch chart data:', err);
        setLoading(false);
      });
  }, [symbol]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400">
        Loading chart...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="time" 
          tick={{ fontSize: 12 }}
          interval={Math.floor(data.length / 6)}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          formatter={(value) => `$${value.toFixed(2)}`}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <Line 
          type="monotone" 
          dataKey="price" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default Chart;