'use client'
import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import axios from 'axios';

const CandleStickCharts = () => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<ReturnType<typeof createChart> | null>(null);
  const [timeFrame, setTimeFrame] = useState("30");

  const timeFrames = [
    { value: "1", label: "1 Day" },
    { value: "7", label: "7 Days" },
    { value: "14", label: "14 Days" },
    { value: "30", label: "30 Days" },
    { value: "90", label: "90 Days" },
    { value: "365", label: "1 Year" }
  ];

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=${timeFrame}`);
      const data = response.data.map((item: any) => ({
        time: item[0] / 1000,
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
      }));

      if (chartRef.current) {
        if (!chartInstanceRef.current) {
          chartInstanceRef.current = createChart(chartRef.current, {
            width: chartRef.current.clientWidth,
            height: chartRef.current.clientHeight,
          });
        }

        const series = chartInstanceRef.current.addCandlestickSeries({
          upColor: '#4fff4f',
          downColor: '#ff4976',
          borderUpColor: '#4fff4f',
          borderDownColor: '#ff4976',
          wickUpColor: '#4fff4f',
          wickDownColor: '#ff4976',
        });

        series.setData(data);

        chartInstanceRef.current.subscribeCrosshairMove((param) => {
          if (!param || !param.time) return;

          const candlestickData = data.find((item:any) => item.time === param.time);
          if (candlestickData) {
            console.log(`Open: ${candlestickData.open}, High: ${candlestickData.high}, Low: ${candlestickData.low}, Close: ${candlestickData.close}`);
          }
        });
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 60000); 

    return () => clearInterval(intervalId); 
  }, [timeFrame]);

  return (
    <div>
      <select value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)}>
        {timeFrames.map((frame) => (
          <option key={frame.value} value={frame.value}>{frame.label}</option>
        ))}
      </select>
      <div ref={chartRef} style={{ position: 'relative', width: '100%', height: '400px' }} />
    </div>
  );
};

export default CandleStickCharts;
