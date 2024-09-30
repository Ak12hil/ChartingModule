'use client'
import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import axios from 'axios';

const Chart = () => {
  const candleChartRef = useRef<HTMLDivElement | null>(null);
  const volumeChartRef = useRef<HTMLDivElement | null>(null);
  const candleChartInstanceRef = useRef<ReturnType<typeof createChart> | null>(null);
  const volumeChartInstanceRef = useRef<ReturnType<typeof createChart> | null>(null);
  const [timeFrame, setTimeFrame] = useState("30");
  const [loading, setLoading] = useState(false);
  const [candleData, setCandleData] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [volumeData, setVolumeData] = useState<any[]>([]);

  // Define time frames
  const timeFrames = [
    { value: "1", label: "1 Day" },
    { value: "7", label: "1 Week" },
    { value: "14", label: "2 Weeks" },
    { value: "30", label: "1 Month" },
    { value: "90", label: "3 Months" },
    { value: "365", label: "1 Year" },
  ];

  const calculateBollingerBands = (data: any, period = 20, stdDevMultiplier = 2) => {
    const bands = [];
    const length = data.length;

    for (let i = period - 1; i < length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const closes = slice.map((item: any) => item.close);

      const avg = closes.reduce((acc: any, val: any) => acc + val, 0) / period;
      const variance = closes.reduce((acc: any, val: any) => acc + Math.pow(val - avg, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      const upperBand = avg + stdDevMultiplier * stdDev;
      const lowerBand = avg - stdDevMultiplier * stdDev;

      bands.push({
        time: data[i].time,
        upper: upperBand,
        middle: avg,
        lower: lowerBand,
      });
    }

    return bands;
  };

  const fetchLivePrice = async () => {
    try {
      const liveResponse = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      const newPrice = liveResponse.data.bitcoin.usd;

      // Update candle data based on live price
      if (candleData.length > 0) {
        const updatedCandleData = [...candleData];
        const lastCandle = updatedCandleData[updatedCandleData.length - 1];
        
        lastCandle.close = newPrice;
        setCandleData(updatedCandleData);
      }

      if (volumeData.length > 0) {
        const updatedVolumeData = [...volumeData];
        const lastVolume = updatedVolumeData[updatedVolumeData.length - 1];

        lastVolume.value += Math.round(newPrice / 10);
        setVolumeData(updatedVolumeData);;
      }
    } catch (error) {
      console.error("Error fetching live price:", error);
    }
  };

  const fetchData = async (retryCount = 0) => {
    setLoading(true);
    try {
      const candleResponse = await axios.get(
        `https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=${timeFrame}`
      );
      const fetchedCandleData = candleResponse.data.map((item: any) => ({
        time: item[0] / 1000,
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
      }));
      setCandleData(fetchedCandleData);

      const bollingerBands = calculateBollingerBands(fetchedCandleData);

      const volumeResponse = await axios.get(
        `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${timeFrame}`
      );
      const newVolumeData = volumeResponse.data.total_volumes.map((item: any) => ({
        time: item[0] / 1000,
        value: item[1],
      }));
      setVolumeData(newVolumeData);

      if (candleChartRef.current) {
        if (!candleChartInstanceRef.current) {
          candleChartInstanceRef.current = createChart(candleChartRef.current, {
            width: candleChartRef.current.clientWidth,
            height: candleChartRef.current.clientHeight,
          });
        }

        const candleSeries = candleChartInstanceRef.current.addCandlestickSeries({
          upColor: '#4fff4f',
          downColor: '#ff4976',
          borderUpColor: '#4fff4f',
          borderDownColor: '#ff4976',
          wickUpColor: '#4fff4f',
          wickDownColor: '#ff4976',
        });
        candleSeries.setData(fetchedCandleData);

        const bollingerSeries = candleChartInstanceRef.current.addLineSeries({
          color: '#FFAA00',
          lineWidth: 2,
        });
        bollingerSeries.setData(bollingerBands.map(band => ({
          time: band.time,
          value: band.middle,
        })));

        const upperBandSeries = candleChartInstanceRef.current.addLineSeries({
          color: '#4CAF50',
          lineWidth: 1,
          crosshairMarkerVisible: false,
        });
        upperBandSeries.setData(bollingerBands.map(band => ({
          time: band.time,
          value: band.upper,
        })));

        const lowerBandSeries = candleChartInstanceRef.current.addLineSeries({
          color: '#F44336',
          lineWidth: 1,
          crosshairMarkerVisible: false,
        });
        lowerBandSeries.setData(bollingerBands.map(band => ({
          time: band.time,
          value: band.lower,
        })));
      }

      if (volumeChartRef.current) {
        if (!volumeChartInstanceRef.current) {
          volumeChartInstanceRef.current = createChart(volumeChartRef.current, {
            width: volumeChartRef.current.clientWidth,
            height: volumeChartRef.current.clientHeight,
          });
        }

        const volumeSeries = volumeChartInstanceRef.current.addHistogramSeries({
          color: '#26a69a',
          priceFormat: { type: 'volume' },
        });
        volumeSeries.setData(newVolumeData);
      }
    } catch (error: any) {
      if (error && error.code === "ERR_NETWORK") {
        const waitTime = Math.pow(2, retryCount) * 1000;
        alert(`Rate limit exceeded. Retrying in ${waitTime / 1000} seconds...`);
        setTimeout(() => fetchData(retryCount + 1), waitTime);
      } else {  
        alert("Error fetching chart data:");
      }
    } finally {
      setLoading(false);
    }
  };

  const drawFibonacciRetracement = (start: number, end: number) => {
    if (!candleChartInstanceRef.current) return;

    const levels = [
      { label: "0%", value: start },
      { label: "23.6%", value: start + (end - start) * 0.236 },
      { label: "38.2%", value: start + (end - start) * 0.382 },
      { label: "50%", value: start + (end - start) * 0.5 },
      { label: "61.8%", value: start + (end - start) * 0.618 },
      { label: "100%", value: end },
    ];

    levels.forEach(level => {
      if (candleChartInstanceRef.current) {
        candleChartInstanceRef.current.addLineSeries({
          color: '#FF0000',
          lineWidth: 1,
        }).setData([
          { time: candleData[0].time, value: level.value },
          { time: candleData[candleData.length - 1].time, value: level.value }
        ]);
      }
    });
  };

  const handleLimitOrder = (price: number) => {
    const newOrder = {
      id: orders.length + 1,
      price: price,
      createdAt: new Date().toLocaleString(),
    };
    setOrders((prevOrders) => [...prevOrders, newOrder]);
  };

  useEffect(() => {
    fetchData();
    fetchLivePrice();

    const intervalId = setInterval(fetchLivePrice, 60000); // Fetch live price every minute

    const handleResize = () => {
      if (candleChartInstanceRef.current && candleChartRef.current) {
        candleChartInstanceRef.current.resize(candleChartRef.current.clientWidth, candleChartRef.current.clientHeight);
      }
      if (volumeChartInstanceRef.current && volumeChartRef.current) {
        volumeChartInstanceRef.current.resize(volumeChartRef.current.clientWidth, volumeChartRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
      if (candleChartInstanceRef.current) {
        candleChartInstanceRef.current.remove();
        candleChartInstanceRef.current = null;
      }
      if (volumeChartInstanceRef.current) {
        volumeChartInstanceRef.current.remove();
        volumeChartInstanceRef.current = null;
      }
    };
  }, [timeFrame]);

  return (
    <div>
      <select value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)}>
        {timeFrames.map((frame) => (
          <option key={frame.value} value={frame.value}>{frame.label}</option>
        ))}
      </select>

      {loading && <p>Loading data, please wait...</p>}

      <div
        ref={candleChartRef}
        style={{ position: 'relative', width: '100%', height: '400px', marginBottom: '20px' }}
        onClick={(event) => {
          const chartBounds = candleChartRef.current?.getBoundingClientRect();
          if (chartBounds) {
            const x = event.clientX - chartBounds.left;
            const candleIndex = Math.floor((x / chartBounds.width) * candleData.length);

            if (candleIndex >= 0 && candleIndex < candleData.length) {
              const clickedCandle = candleData[candleIndex];
              handleLimitOrder(clickedCandle.close);
              const startPrice = Math.max(...candleData.map(data => data.high));
              const endPrice = Math.min(...candleData.map(data => data.low));
              drawFibonacciRetracement(startPrice, endPrice);
            }
          }
        }}
      />

      <div>
        <h3>Limit Orders:</h3>
        <ul>
          {orders.map(order => (
            <li key={order.id}>Order #{order.id}: ${order.price} (Order Placed at {order.createdAt})</li>
          ))}
        </ul>
      </div>

      <div ref={volumeChartRef} style={{ position: 'relative', width: '100%', height: '200px' }} />
    </div>
  );
};

export default Chart;
