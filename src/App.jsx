import { useState, useEffect, useRef, useCallback } from "react";

const LEVELS = [
  {
    price: 90200, label: "ETF Avg Cost Basis", status: "broken", severity: "warning", category: "institutional",
    entity: "BlackRock, Fidelity, ARK",
    details: ["Spot ETF holders avg entry ~$90,200", "~27,000 BTC/month outflow from redemptions", "$6.18B net outflows Nov 2025–Jan 2026"],
  },
  {
    price: 84000, label: "IBIT Creation Cost", status: "broken", severity: "warning", category: "institutional",
    entity: "BlackRock IBIT",
    details: ["Largest spot BTC ETF — underwater", "$528.3M single-day outflow (Jan 30)", "Redemptions → forced BTC sales → lower price → more redemptions"],
  },
  {
    price: 76052, label: "MSTR Avg Cost Basis", status: "broken", severity: "danger", category: "institutional",
    entity: "Saylor / MSTR",
    details: ["713,502 BTC at avg $76,052", "Stock trades below NAV — equity issuance destroys value", "$2.25B cash covers ~2.5yr obligations"],
  },
  {
    price: 70000, label: "Institutional Stress", status: "broken", severity: "danger", category: "institutional",
    entity: "Corporate Treasuries",
    details: ["200+ companies 15-20% underwater", "Risk managers forcing position reductions", "Capital markets closed for crypto issuance"],
  },
  {
    price: 68000, label: "Binance Reserve Stress", status: "broken", severity: "binance", category: "binance",
    entity: "BINANCE",
    details: ["618K BTC reserves declining in value", "USDT approaching parity with BTC reserves", "FTX 2.0 FUD trending — users fleeing", "Withdrawal suspension already occurred"],
  },
  {
    price: 61812, label: "USDT Overtakes BTC", severity: "binance", category: "binance",
    entity: "BINANCE",
    details: ["618K BTC value < 38.2B USDT", "Reserve composition flips stablecoin-dominant", "Bank run optics — everyone sees the ratio", "SAFU only $200M of $1B converted"],
  },
  {
    price: 60000, label: "MSTR Existential Crisis", severity: "critical", category: "institutional",
    entity: "MSTR — systemic",
    details: ["MSTR >$11.4B underwater", "Owns 17% of public/gov/ETF BTC", "'Going Concern' warnings likely", "Death spiral: stock → capital → forced selling"],
  },
  {
    price: 58000, label: "200-Week Moving Avg", severity: "critical", category: "technical",
    entity: "Technical",
    details: ["THE bull/bear line — never broken in bull", "Full regime change to bear market", "Algo selling intensifies on break", "⚠ Expect violent bounce attempt here"],
  },
  {
    price: 55000, label: "Realized Price / TP1", severity: "extreme", category: "technical",
    entity: "On-Chain / TP1",
    details: ["Aggregate cost basis all BTC on-chain", "Historically marks cycle bottoms", "Your TP1: close 33% of short here"],
  },
  {
    price: 54000, label: "BNB MVRV Breakdown", severity: "binance", category: "binance",
    entity: "BNB / BINANCE",
    details: ["BNB cost-basis models: $540-560 target", "Bear pennant target: $470-500", "BNB collapse = Binance trust evaporates"],
  },
  {
    price: 50000, label: "Miner Extinction / TP2", severity: "extreme", category: "extreme",
    entity: "Miners + SAFU / TP2",
    details: ["Miners bankrupt — forced reserve liquidation", "SAFU BTC worth ~$650M vs $1B target", "Binance forced buyer at worst time", "Your TP2: close 33% of short here"],
  },
  {
    price: 45000, label: "Exchange Contagion", severity: "extreme", category: "binance",
    entity: "ALL EXCHANGES",
    details: ["BTC reserves = ~$27.8B vs $38.2B USDT", "Mass withdrawal pressure", "Smaller exchanges fail first", "Tether redemption stress spikes"],
  },
  {
    price: 40000, label: "USDT Depeg Risk", severity: "extreme", category: "binance",
    entity: "TETHER / SYSTEMIC",
    details: ["If Tether can't handle redemptions → depeg", "Every USDT-margined position reprices", "DeFi protocols face cascading failures"],
  },
  {
    price: 30000, label: "Full Cycle Reset / TP3", severity: "extreme", category: "extreme",
    entity: "Cycle Bottom / TP3",
    details: ["76% drawdown — matches 2022 bear", "Binance: survives as monopoly or fails", "Your TP3: let final 34% ride here 🎯"],
  },
];

const TRADE = {
  entry: 63300, stopLoss: 72000, leverage: 5,
  tps: [
    { price: 55000, pct: 33, label: "TP1" },
    { price: 50000, pct: 33, label: "TP2" },
    { price: 30000, pct: 34, label: "TP3" },
  ],
};

const BINANCE_INTEL = [
  { label: "10/10 Crash", detail: "$19B liquidation — largest in crypto history. Binance paid $328M + $400M recovery." },
  { label: "SAFU → BTC", detail: "$1B fund converting stables to BTC over 30 days. $200M done. Tops up if <$800M." },
  { label: "Reserves", detail: "618K BTC + 38.2B USDT + 4.17M ETH. Total $155.6B. Stablecoins = 30.5%." },
  { label: "FTX 2.0 FUD", detail: "Users fleeing on X (Feb 4). Withdrawal suspensions. C&D letters to critics." },
  { label: "USDe Exploit", detail: "10/10: USDe hit $0.65 on Binance ($1 elsewhere). Collateral devalued → forced liqs." },
  { label: "Hyperliquid", detail: "Decentralized perps gaining share. Transparent books. Existential threat to Binance model." },
];

function getPnL(entry, target, lev) {
  return (((entry - target) / entry) * 100 * lev).toFixed(0);
}

const sevColors = {
  warning: { border: "#f59e0b", text: "#fbbf24", bg: "rgba(245,158,11,0.08)", glow: "rgba(245,158,11,0.25)" },
  danger: { border: "#f97316", text: "#fb923c", bg: "rgba(249,115,22,0.08)", glow: "rgba(249,115,22,0.25)" },
  critical: { border: "#ef4444", text: "#f87171", bg: "rgba(239,68,68,0.08)", glow: "rgba(239,68,68,0.25)" },
  extreme: { border: "#dc2626", text: "#ef4444", bg: "rgba(220,38,38,0.1)", glow: "rgba(220,38,38,0.3)" },
  binance: { border: "#eab308", text: "#facc15", bg: "rgba(234,179,8,0.08)", glow: "rgba(234,179,8,0.25)" },
};

const catIcons = { institutional: "🏦", binance: "🟡", technical: "📊", extreme: "💀" };

export default function BTCDoomLoop() {
  const [price, setPrice] = useState(null);
  const [prevPrice, setPrevPrice] = useState(null);
  const [connected, setConnected] = useState(false);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [activeTab, setActiveTab] = useState("cascade");
  const [animate, setAnimate] = useState(false);
  const [high24, setHigh24] = useState(null);
  const [low24, setLow24] = useState(null);
  const [change24, setChange24] = useState(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const priceRef = useRef(null);

  const connectWs = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    try {
      const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@ticker");
      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          const p = parseFloat(d.c);
          if (p > 0) {
            setPrevPrice(priceRef.current);
            setPrice(p);
            priceRef.current = p;
            if (d.h) setHigh24(parseFloat(d.h));
            if (d.l) setLow24(parseFloat(d.l));
            if (d.P) setChange24(parseFloat(d.P));
          }
        } catch {}
      };
      ws.onclose = () => {
        setConnected(false);
        reconnectRef.current = setTimeout(connectWs, 3000);
      };
      ws.onerror = () => ws.close();
      wsRef.current = ws;
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    connectWs();
    setTimeout(() => setAnimate(true), 150);
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connectWs]);

  const currentPrice = price || 63297;
  const priceDir = prevPrice ? (currentPrice > prevPrice ? "up" : currentPrice < prevPrice ? "down" : "flat") : "flat";
  const athPrice = 126000;
  const drawdown = (((athPrice - currentPrice) / athPrice) * 100).toFixed(1);

  // Find where current price sits in levels
  const levelsWithStatus = LEVELS.map(l => ({
    ...l,
    liveStatus: currentPrice <= l.price ? "broken" : "below",
  }));

  // Insert position for the price marker
  let insertIndex = levelsWithStatus.findIndex(l => l.price < currentPrice);
  if (insertIndex === -1) insertIndex = levelsWithStatus.length;

  const topPrice = 95000;
  const botPrice = 25000;
  const getPct = (p) => Math.max(0, Math.min(100, ((topPrice - p) / (topPrice - botPrice)) * 100));

  const btcReserveVal = (618000 * currentPrice / 1e9);
  const usdtVal = 38.2;
  const reserveFlipped = btcReserveVal < usdtVal;

  return (
    <div style={{
      fontFamily: "'JetBrains Mono','Fira Code','SF Mono',monospace",
      background: "#06060b", color: "#e2e8f0",
      minHeight: "100vh", position: "relative",
    }}>
      {/* Scanlines */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100,
        background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)",
      }} />

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #141420", padding: "14px 20px",
        background: "linear-gradient(180deg,#0b0b14,#06060b)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "8px", letterSpacing: "4px", color: "#475569", marginBottom: "3px" }}>
              LIVE BTC/USD CASCADE MODEL
            </div>
            <h1 style={{
              fontSize: "18px", fontWeight: 800, margin: 0,
              background: "linear-gradient(135deg,#ef4444,#f97316 50%,#eab308)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>DOOM LOOP CASCADE</h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
              <div style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: connected ? "#22c55e" : "#ef4444",
                boxShadow: connected ? "0 0 8px #22c55e" : "0 0 8px #ef4444",
                animation: connected ? "pulse 2s infinite" : "none",
              }} />
              <span style={{ fontSize: "8px", color: connected ? "#22c55e" : "#ef4444", letterSpacing: "1px" }}>
                {connected ? "LIVE" : "RECONNECTING"}
              </span>
            </div>
            <div style={{
              fontSize: "28px", fontWeight: 800, lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
              color: priceDir === "up" ? "#22c55e" : priceDir === "down" ? "#ef4444" : "#e2e8f0",
              transition: "color 0.3s",
              textShadow: priceDir === "up" ? "0 0 20px rgba(34,197,94,0.3)" : priceDir === "down" ? "0 0 20px rgba(239,68,68,0.3)" : "none",
            }}>
              ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: "9px", color: "#64748b", marginTop: "1px", fontVariantNumeric: "tabular-nums" }}>
              {change24 !== null && (
                <span style={{ color: change24 >= 0 ? "#22c55e" : "#ef4444", marginRight: "8px" }}>
                  {change24 >= 0 ? "▲" : "▼"} {Math.abs(change24).toFixed(2)}% 24h
                </span>
              )}
              <span>▼ {drawdown}% ATH</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "2px", marginTop: "10px" }}>
          {[
            { id: "cascade", label: "CASCADE" },
            { id: "binance", label: "🟡 BINANCE" },
            { id: "trade", label: "TRADE" },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              background: activeTab === t.id ? "#141420" : "transparent",
              border: `1px solid ${activeTab === t.id ? "#1e1e30" : "transparent"}`,
              color: activeTab === t.id ? "#e2e8f0" : "#475569",
              padding: "5px 12px", borderRadius: "4px", cursor: "pointer",
              fontSize: "9px", letterSpacing: "1.5px", fontFamily: "inherit",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-16px); } to { opacity:1; transform:translateX(0); } }
        @keyframes priceGlow { 0%,100% { box-shadow: 0 0 15px rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 30px rgba(99,102,241,0.6); } }
      `}</style>

      {/* CASCADE TAB */}
      {activeTab === "cascade" && (
        <div style={{ padding: "12px 20px", maxWidth: "800px" }}>
          {/* Mini price ruler */}
          <div style={{
            position: "relative", height: "32px", marginBottom: "14px",
            background: "#0a0a12", borderRadius: "6px", overflow: "hidden",
            border: "1px solid #141420",
          }}>
            {/* Level markers on ruler */}
            {LEVELS.map((l, i) => (
              <div key={i} style={{
                position: "absolute", left: `${getPct(l.price)}%`,
                top: 0, bottom: 0, width: "1px",
                background: (sevColors[l.severity]?.border || "#334") + "40",
              }} />
            ))}
            {/* Current price marker */}
            <div style={{
              position: "absolute", left: `${getPct(currentPrice)}%`,
              top: "2px", bottom: "2px",
              transform: "translateX(-50%)",
              transition: "left 0.5s ease-out",
              zIndex: 5,
            }}>
              <div style={{
                width: "2px", height: "100%", background: "#818cf8",
                boxShadow: "0 0 8px rgba(129,140,248,0.6)",
              }} />
            </div>
            {/* Zone labels */}
            <div style={{ position: "absolute", left: "4px", top: "2px", fontSize: "7px", color: "#475569", letterSpacing: "1px" }}>$95K</div>
            <div style={{ position: "absolute", right: "4px", top: "2px", fontSize: "7px", color: "#475569", letterSpacing: "1px" }}>$25K</div>
            <div style={{
              position: "absolute", left: `${getPct(currentPrice)}%`, bottom: "2px",
              transform: "translateX(-50%)", fontSize: "8px", color: "#818cf8",
              fontWeight: 700, transition: "left 0.5s ease-out",
              textShadow: "0 0 6px rgba(129,140,248,0.5)",
            }}>
              ▼
            </div>
          </div>

          {levelsWithStatus.map((level, i) => {
            const isCurrentZone = i === insertIndex - 1 || (i === insertIndex && insertIndex === 0);
            const showPriceMarker = i === insertIndex;
            const colors = sevColors[level.severity];
            const isHovered = hoveredLevel === i;
            const isBroken = currentPrice < level.price;
            const isBinance = level.category === "binance";
            const distFromPrice = ((currentPrice - level.price) / currentPrice * 100);
            const isNear = Math.abs(distFromPrice) < 5;

            return (
              <div key={i}>
                {/* Insert live price marker */}
                {showPriceMarker && (
                  <div style={{
                    margin: "4px 0",
                    padding: "10px 14px",
                    background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.04))",
                    border: "1px solid rgba(99,102,241,0.4)",
                    borderRadius: "8px",
                    animation: "priceGlow 3s ease-in-out infinite",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        fontSize: "20px", fontWeight: 800,
                        color: priceDir === "up" ? "#22c55e" : priceDir === "down" ? "#ef4444" : "#818cf8",
                        fontVariantNumeric: "tabular-nums",
                        transition: "color 0.3s",
                      }}>
                        ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                      <div style={{
                        fontSize: "9px", fontWeight: 700, letterSpacing: "2px",
                        color: "#818cf8", opacity: 0.8,
                      }}>
                        ⚡ LIVE
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "9px", color: "#94a3b8" }}>
                        Next level: <span style={{ color: colors.text, fontWeight: 700 }}>${level.price.toLocaleString()}</span>
                        {" "}({distFromPrice > 0 ? `${distFromPrice.toFixed(1)}% below` : `${Math.abs(distFromPrice).toFixed(1)}% above`})
                      </div>
                      {reserveFlipped && (
                        <div style={{ fontSize: "9px", color: "#facc15", marginTop: "2px" }}>
                          ⚠ Binance USDT &gt; BTC reserves
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div
                  onMouseEnter={() => setHoveredLevel(i)}
                  onMouseLeave={() => setHoveredLevel(null)}
                  style={{
                    marginBottom: "2px",
                    opacity: animate ? 1 : 0,
                    transform: animate ? "translateX(0)" : "translateX(-16px)",
                    transition: `all 0.35s ease ${i * 0.03}s`,
                  }}>
                  <div style={{
                    display: "flex", alignItems: "stretch",
                    background: isHovered ? colors.bg : isNear ? colors.bg + "60" : "transparent",
                    border: `1px solid ${isHovered || isNear ? colors.border + (isNear ? "60" : "") : isBinance ? "rgba(234,179,8,0.08)" : "transparent"}`,
                    borderLeft: isBinance ? `3px solid ${colors.border}${isBroken ? "" : "40"}` : undefined,
                    borderRadius: "6px",
                    padding: "9px 11px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: isHovered ? `0 0 16px ${colors.glow}` : "none",
                    opacity: isBroken && !isHovered && !isNear ? 0.4 : 1,
                  }}>
                    {/* Price */}
                    <div style={{
                      minWidth: "78px", display: "flex", flexDirection: "column", justifyContent: "center",
                      borderRight: `1px solid ${isNear ? colors.border + "40" : "#141420"}`,
                      paddingRight: "10px", marginRight: "10px",
                    }}>
                      <div style={{
                        fontSize: "14px", fontWeight: 700, fontVariantNumeric: "tabular-nums",
                        color: isBroken ? "#4a5568" : colors.text,
                        textDecoration: isBroken ? "line-through" : "none",
                        textDecorationColor: "#334155",
                      }}>
                        ${level.price.toLocaleString()}
                      </div>
                      <div style={{
                        fontSize: "7px", fontWeight: 700, letterSpacing: "1.5px",
                        color: isBroken ? "#334155" : isNear ? colors.text : colors.border,
                        marginTop: "1px",
                      }}>
                        {isBroken ? "BROKEN ✕" : isNear ? "NEXT ↓" : "BELOW"}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <div style={{
                          fontSize: "11px", fontWeight: 700,
                          color: isBroken && !isNear ? "#64748b" : "#e2e8f0",
                        }}>
                          {catIcons[level.category]} {level.label}
                        </div>
                        <div style={{ fontSize: "8px", color: "#475569", flexShrink: 0, marginLeft: "8px" }}>
                          {level.entity}
                          {!isBroken && (
                            <span style={{ color: colors.text, marginLeft: "6px" }}>
                              {distFromPrice.toFixed(1)}%↓
                            </span>
                          )}
                        </div>
                      </div>

                      {(isHovered || isNear) && (
                        <div style={{ marginTop: "4px" }}>
                          {level.details.map((d, j) => (
                            <div key={j} style={{
                              fontSize: "9.5px", lineHeight: 1.5, paddingLeft: "8px",
                              borderLeft: `2px solid ${colors.border}30`,
                              marginBottom: "1px",
                              color: d.startsWith("⚠") ? colors.text : "#94a3b8",
                              fontWeight: d.startsWith("⚠") || d.startsWith("Your") ? 600 : 400,
                            }}>{d}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: "8px", color: "#334155", textAlign: "center", marginTop: "10px", padding: "8px" }}>
            Hover for details • Yellow border = Binance risk • Price via Binance WebSocket • Not financial advice
          </div>
        </div>
      )}

      {/* BINANCE TAB */}
      {activeTab === "binance" && (
        <div style={{ padding: "16px 20px", maxWidth: "700px" }}>
          {/* Reserve gauge */}
          <div style={{
            background: "#0a0a14", border: "1px solid #141420",
            borderRadius: "8px", padding: "14px", marginBottom: "14px",
          }}>
            <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#64748b", marginBottom: "10px" }}>
              LIVE BTC vs USDT RESERVE VALUE
            </div>
            {(() => {
              const total = btcReserveVal + usdtVal;
              const btcPct = (btcReserveVal / total * 100);
              return (
                <>
                  <div style={{ display: "flex", height: "30px", borderRadius: "4px", overflow: "hidden", marginBottom: "6px" }}>
                    <div style={{
                      width: `${btcPct}%`, transition: "width 0.5s ease-out",
                      background: reserveFlipped ? "linear-gradient(90deg,#dc2626,#ef4444)" : "linear-gradient(90deg,#f97316,#ea580c)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", fontWeight: 700, color: "#fff",
                    }}>BTC ${btcReserveVal.toFixed(1)}B</div>
                    <div style={{
                      width: `${100 - btcPct}%`, transition: "width 0.5s ease-out",
                      background: "linear-gradient(90deg,#22c55e,#16a34a)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", fontWeight: 700, color: "#fff",
                    }}>USDT ${usdtVal.toFixed(1)}B</div>
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: reserveFlipped ? "#ef4444" : "#f59e0b" }}>
                    {reserveFlipped
                      ? `⚠ FLIPPED — USDT exceeds BTC by $${(usdtVal - btcReserveVal).toFixed(1)}B`
                      : `BTC leads by $${(btcReserveVal - usdtVal).toFixed(1)}B — flips at $61,812`}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Reserve grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }}>
            {[
              { label: "BTC", value: `$${btcReserveVal.toFixed(1)}B`, sub: "618K BTC", color: reserveFlipped ? "#ef4444" : "#f97316" },
              { label: "USDT", value: "$38.2B", sub: "Stablecoins total $47.5B", color: "#22c55e" },
              { label: "SAFU Fund", value: "$200M done", sub: "$1B target (30 days)", color: "#eab308" },
            ].map((item, i) => (
              <div key={i} style={{
                background: "#0a0a14", borderRadius: "6px", padding: "10px", border: "1px solid #141420",
              }}>
                <div style={{ fontSize: "8px", color: "#475569", letterSpacing: "1px" }}>{item.label}</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: item.color, fontVariantNumeric: "tabular-nums" }}>{item.value}</div>
                <div style={{ fontSize: "8px", color: "#64748b", marginTop: "1px" }}>{item.sub}</div>
              </div>
            ))}
          </div>

          {/* Intel cards */}
          <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#64748b", marginBottom: "8px" }}>CONTEXT</div>
          {BINANCE_INTEL.map((item, i) => (
            <div key={i} style={{
              background: "rgba(234,179,8,0.03)", border: "1px solid rgba(234,179,8,0.1)",
              borderRadius: "6px", padding: "10px", marginBottom: "4px",
            }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#facc15" }}>{item.label}: </span>
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>{item.detail}</span>
            </div>
          ))}

          {/* Destruction levels */}
          <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#ef4444", marginTop: "14px", marginBottom: "8px" }}>
            BINANCE DESTRUCTION LEVELS
          </div>
          {[
            { price: 61812, label: "USDT > BTC value", detail: "Reserve flip. Stablecoin-dominant = slow-motion bank run optics.", hit: currentPrice <= 61812 },
            { price: 50000, label: "SAFU underwater", detail: "SAFU BTC worth ~$650M vs $1B. Forced to buy into crash or admit impairment.", hit: currentPrice <= 50000 },
            { price: 45000, label: "Mass withdrawals", detail: "BTC = $27.8B vs USDT $38.2B. Everyone wants stables OUT. Smaller exchanges fail.", hit: currentPrice <= 45000 },
            { price: 40000, label: "USDT depeg risk", detail: "Tether redemptions spike. Every USDT-margined position reprices. Systemic failure.", hit: currentPrice <= 40000 },
            { price: 30000, label: "Survive or die", detail: "Binance becomes monopoly (last standing) or collapses entirely. No middle ground.", hit: currentPrice <= 30000 },
          ].map((item, i) => {
            const dist = ((currentPrice - item.price) / currentPrice * 100);
            return (
              <div key={i} style={{
                background: item.hit ? "rgba(220,38,38,0.1)" : "rgba(220,38,38,0.03)",
                border: `1px solid ${item.hit ? "rgba(220,38,38,0.4)" : "rgba(220,38,38,0.12)"}`,
                borderLeft: "3px solid #eab308",
                borderRadius: "6px", padding: "10px", marginBottom: "4px",
                opacity: item.hit ? 1 : 0.8,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: item.hit ? "#ef4444" : "#f87171", fontVariantNumeric: "tabular-nums" }}>
                    ${item.price.toLocaleString()} {item.hit && "✕"}
                  </span>
                  <span style={{ fontSize: "9px", color: item.hit ? "#ef4444" : "#facc15" }}>
                    {item.hit ? "BROKEN" : `${dist.toFixed(1)}% below`} — {item.label}
                  </span>
                </div>
                <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px" }}>{item.detail}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* TRADE TAB */}
      {activeTab === "trade" && (
        <div style={{ padding: "16px 20px", maxWidth: "460px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#64748b", marginBottom: "14px" }}>
            5× SHORT — HYPERLIQUID — DCA ENTRY
          </div>

          {/* Live PnL */}
          {(() => {
            const unrealPnl = ((TRADE.entry - currentPrice) / TRADE.entry) * 100 * TRADE.leverage;
            const inProfit = unrealPnl > 0;
            return (
              <div style={{
                background: inProfit ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${inProfit ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                borderRadius: "8px", padding: "14px", marginBottom: "12px",
                boxShadow: `0 0 20px ${inProfit ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "9px", color: "#64748b", letterSpacing: "1px" }}>UNREALIZED PnL (from $63,300 entry)</span>
                  <span style={{
                    fontSize: "20px", fontWeight: 800, fontVariantNumeric: "tabular-nums",
                    color: inProfit ? "#22c55e" : "#ef4444",
                    transition: "color 0.3s",
                  }}>
                    {inProfit ? "+" : ""}{unrealPnl.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })()}

          <div style={{
            background: "#0a0a14", border: "1px solid #141420",
            borderRadius: "8px", padding: "14px", marginBottom: "10px",
          }}>
            {[
              { label: "ENTRY", value: `~$${TRADE.entry.toLocaleString()}`, color: "#e2e8f0" },
              { label: "LEVERAGE", value: `${TRADE.leverage}×`, color: "#f59e0b" },
              { label: "SPOT", value: `$${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: priceDir === "up" ? "#22c55e" : "#ef4444" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: i < 2 ? "8px" : 0 }}>
                <span style={{ fontSize: "10px", color: "#64748b", letterSpacing: "1px" }}>{r.label}</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: r.color, fontVariantNumeric: "tabular-nums" }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Stop */}
          <div style={{
            background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "8px", padding: "12px", marginBottom: "10px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "10px", color: "#ef4444", letterSpacing: "1px" }}>STOP LOSS</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#ef4444" }}>${TRADE.stopLoss.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
              Max loss: <span style={{ color: "#ef4444", fontWeight: 600 }}>{getPnL(TRADE.entry, TRADE.stopLoss, TRADE.leverage)}%</span>
              {" "}• {(((TRADE.stopLoss - currentPrice) / currentPrice) * 100).toFixed(1)}% from spot
            </div>
          </div>

          {/* TPs */}
          <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#64748b", margin: "14px 0 8px" }}>TAKE PROFIT</div>
          {TRADE.tps.map((tp, i) => {
            const hit = currentPrice <= tp.price;
            const distPct = ((currentPrice - tp.price) / currentPrice * 100).toFixed(1);
            return (
              <div key={i} style={{
                background: hit ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.04)",
                border: `1px solid rgba(34,197,94,${hit ? 0.4 : 0.12 + i * 0.06})`,
                borderRadius: "8px", padding: "12px", marginBottom: "6px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "10px", color: "#22c55e" }}>{tp.label} — close {tp.pct}%</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#22c55e", fontVariantNumeric: "tabular-nums" }}>
                    ${tp.price.toLocaleString()} {hit && "✓"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10px" }}>
                  <span style={{ color: "#64748b" }}>{hit ? "HIT" : `${distPct}% below spot`}</span>
                  <span style={{ color: "#4ade80", fontWeight: 700 }}>+{getPnL(TRADE.entry, tp.price, TRADE.leverage)}%</span>
                </div>
              </div>
            );
          })}

          {/* Checklist */}
          <div style={{
            marginTop: "14px", padding: "10px",
            background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)",
            borderRadius: "8px",
          }}>
            <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#f59e0b", marginBottom: "6px" }}>⚠ DAILY</div>
            <div style={{ fontSize: "9px", color: "#64748b", lineHeight: 1.7 }}>
              Trail stop • Funding rate • USDT peg (&lt;$0.995 = alarm) • Hyperliquid insurance • MSTR stock • ETF flows • Binance reserves • BNB price • CZ tweets
            </div>
          </div>

          <div style={{ fontSize: "8px", color: "#334155", textAlign: "center", marginTop: "10px" }}>
            Not financial advice. Live price via Binance WS.
          </div>
        </div>
      )}
    </div>
  );
}
