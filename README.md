# BTC Doom Loop Cascade

Live Bitcoin cascade model showing structural liquidation levels, Binance destruction thresholds, and trade plan tracking — with real-time price via Binance WebSocket.

## Features

- **Live price feed** via Binance WebSocket (`btcusdt@ticker`)
- **Cascade levels** with dynamic broken/approaching status
- **Binance Intel tab** with reserve composition and destruction levels
- **Trade plan tab** with live unrealized PnL
- **Mini price ruler** showing position relative to all levels

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Framework preset: **Vite**
5. Click **Deploy**

No environment variables needed. The Binance WebSocket is public.

## Tech Stack

- Vite + React 18
- Binance WebSocket API (public, no auth)
- Zero external UI dependencies

## Disclaimer

Not financial advice. For educational and informational purposes only.
