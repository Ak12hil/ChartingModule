import axios from 'axios';

const COINGECKO_API = "https://api.coingecko.com/api/v3";

export const fetchHistoricalData = async (timeFrame) => {
  const response = await axios.get(`https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=${timeFrame}`);
  return response.data; // This returns an array of [time, open, high, low, close]
};


export const fetchLivePrice = async () => {
    const response = await axios.get(`${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd`);
    return response.data.bitcoin.usd;
};
