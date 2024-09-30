'use client'
import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import axios from 'axios';

const VolumeChart = () => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<ReturnType<typeof createChart> | null>(null);
  const [timeFrame, setTimeFrame] = useState("30");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${timeFrame}`);
        console.log(response);

        const volumeData = response.data.total_volumes.map((item: any) => ({
          time: item[0] / 1000, 
          value: item[1],  
        }));

        
        if (chartRef.current) {
          if (chartInstanceRef.current) {
            chartInstanceRef.current.remove();
          }

          chartInstanceRef.current = createChart(chartRef.current, {
            width: chartRef.current.clientWidth,
            height: chartRef.current.clientHeight,
          });

          const volumeSeries = chartInstanceRef.current.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
              type: 'volume',
            },
          });

          volumeSeries.setData(volumeData);
        }
      } catch (error) {
        console.error("Error fetching historical data:", error);
      }
    };

    fetchData();

    const handleResize = () => {
      if (chartInstanceRef.current && chartRef.current) {
        chartInstanceRef.current.resize(chartRef.current.clientWidth, chartRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [timeFrame]);

  return (
    <div>
      <select value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)}>
        <option value="1">1 Day</option>
        <option value="7">7 Days</option>
        <option value="30">30 Days</option>
        <option value="90">90 Days</option>
        <option value="365">1 Year</option>
      </select>

      <div ref={chartRef} style={{ position: 'relative', width: '100%', height: '200px' }} />
    </div>
  );
};

export default VolumeChart;
