const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

function toDate(timestamp) { return new Date(timestamp * 1000).toISOString().slice(0, 10); }
function asNumber(value) { const number = Number(value); return Number.isFinite(number) ? number : null; }

export function normalizeKalshiMarket(market) {
  return {
    ticker: market.ticker,
    title: market.title || market.subtitle || market.ticker,
    subtitle: market.subtitle || '',
    status: market.status || 'unknown',
    openTime: market.open_time || null,
    closeTime: market.close_time || null,
    yesBid: asNumber(market.yes_bid),
    yesAsk: asNumber(market.yes_ask),
    lastPrice: asNumber(market.last_price),
    volume: asNumber(market.volume),
    source: 'Kalshi public API',
  };
}

export function normalizeKalshiCandles(payload, ticker) {
  const candles = payload.candlesticks || payload.candles || [];
  return candles.map((candle) => ({
    ticker,
    date: toDate(candle.end_ts || candle.ts || candle.start_ts),
    startTs: candle.start_ts || null,
    endTs: candle.end_ts || candle.ts || null,
    open: asNumber(candle.open ?? candle.price?.open),
    high: asNumber(candle.high ?? candle.price?.high),
    low: asNumber(candle.low ?? candle.price?.low),
    close: asNumber(candle.close ?? candle.price?.close),
    volume: asNumber(candle.volume),
    source: 'Kalshi public API',
  }));
}

async function getJson(path) {
  const response = await fetch(`${KALSHI_API}${path}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Kalshi returned HTTP ${response.status}.`);
  return response.json();
}

export async function fetchKalshiMarket(ticker) {
  const payload = await getJson(`/markets/${encodeURIComponent(ticker)}`);
  return normalizeKalshiMarket(payload.market || payload);
}

export async function fetchKalshiCandles(ticker, startDate, endDate, periodInterval = 1440) {
  const startTs = Math.floor(new Date(`${startDate}T00:00:00Z`).getTime() / 1000);
  const endTs = Math.floor(new Date(`${endDate}T23:59:59Z`).getTime() / 1000);
  const query = new URLSearchParams({ start_ts: String(startTs), end_ts: String(endTs), period_interval: String(periodInterval) });
  const payload = await getJson(`/markets/${encodeURIComponent(ticker)}/candlesticks?${query}`);
  return normalizeKalshiCandles(payload, ticker);
}
