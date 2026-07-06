import { useState, useRef, useEffect } from "react";
import { RotateCcw } from "lucide-react";

/* ── Ball colours ── */
const BALL_DEFS = [
  { color: "#FFD93D", shine: "#FFF176", shadow: "#F0A500" },
  { color: "#FF6B9D", shine: "#FFB3CC", shadow: "#C4315A" },
  { color: "#6BCB77", shine: "#B8F0BC", shadow: "#3A9944" },
  { color: "#4DD9F0", shine: "#B3EEFA", shadow: "#1BA8C4" },
  { color: "#B088F9", shine: "#D9C3FF", shadow: "#7A44D8" },
  { color: "#FF8C42", shine: "#FFBF94", shadow: "#C4560A" },
  { color: "#F72585", shine: "#FF9FC8", shadow: "#8B0054" },
  { color: "#7BF1A8", shine: "#C6FFE2", shadow: "#2EAF66" },
];

const BALL_R = 14;
const GLOBE_BALLS = [
  { cx: 38, cy: 47 },
  { cx: 62, cy: 47 },
  { cx: 28, cy: 61 },
  { cx: 50, cy: 61 },
  { cx: 72, cy: 61 },
  { cx: 32, cy: 75 },
  { cx: 50, cy: 75 },
  { cx: 68, cy: 75 },
];

const RANGE_MIN = 100;
const RANGE_MAX = 300;
type Phase = "idle" | "spinning" | "done";

export default function LuckyDraw() {
  const [minScore, setMinScore] = useState(100);
  const [maxScore, setMaxScore] = useState(300);
  const [drawnNumber, setDrawnNumber] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [showResult, setShowResult] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isSpinning = phase === "spinning";
  const isDone = phase === "done";
  const canDraw = minScore < maxScore && !isSpinning;

  /* 슬라이더 트랙 채우기 퍼센트 */
  const span = RANGE_MAX - RANGE_MIN;
  const minPct = ((minScore - RANGE_MIN) / span) * 100;
  const maxPct = ((maxScore - RANGE_MIN) / span) * 100;

  function handleDraw() {
    if (!canDraw) return;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setDrawnNumber(null);
    setShowResult(false);
    setPhase("spinning");
    const t = setTimeout(() => {
      const num = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
      setDrawnNumber(num);
      setPhase("done");
      setTimeout(() => setShowResult(true), 80);
    }, 2600);
    timeoutsRef.current.push(t);
  }

  function reset() {
    timeoutsRef.current.forEach(clearTimeout);
    setDrawnNumber(null);
    setShowResult(false);
    setPhase("idle");
  }

  /* CSS keyframes + range slider styles */
  useEffect(() => {
    const id = "ld2-styles";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = `
      @keyframes ld2-float {
        0%,100% { transform: translateY(0) rotate(0deg); }
        40%      { transform: translateY(-10px) rotate(5deg); }
        70%      { transform: translateY(-5px) rotate(-3deg); }
      }
      @keyframes ld2-spin {
        0%   { transform: rotate(0deg)   translateX(22px) rotate(0deg); }
        100% { transform: rotate(360deg) translateX(22px) rotate(-360deg); }
      }
      @keyframes ld2-drop {
        0%   { transform: translateY(-30px) scale(0.5); opacity: 0; }
        55%  { transform: translateY(6px)   scale(1.12); opacity: 1; }
        75%  { transform: translateY(-3px)  scale(0.96); }
        100% { transform: translateY(0)     scale(1);    opacity: 1; }
      }
      @keyframes ld2-result {
        0%   { transform: translateY(14px) scale(0.96); opacity: 0; }
        100% { transform: translateY(0)    scale(1);    opacity: 1; }
      }
      @keyframes ld2-item {
        0%   { transform: translateX(-8px); opacity: 0; }
        100% { transform: translateX(0);    opacity: 1; }
      }
      @keyframes ld2-shake {
        0%,100% { transform: translateX(0); }
        20%      { transform: translateX(-6px) rotate(-1.5deg); }
        40%      { transform: translateX(6px)  rotate(1.5deg); }
        60%      { transform: translateX(-4px) rotate(-0.8deg); }
        80%      { transform: translateX(4px)  rotate(0.8deg); }
      }
      /* Range inputs — fully invisible, interaction only */
      .ld2-range {
        -webkit-appearance: none; appearance: none;
        position: absolute; top: 0; left: 0;
        width: 100%; height: 100%;
        background: transparent; outline: none;
        margin: 0; padding: 0; opacity: 0;
        pointer-events: none;
      }
      .ld2-range::-webkit-slider-runnable-track { background: transparent; }
      .ld2-range::-moz-range-track { background: transparent; border: none; }
      .ld2-range::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 24px; height: 24px; border-radius: 50%;
        background: transparent; cursor: pointer;
        pointer-events: all;
      }
      .ld2-range::-moz-range-thumb {
        width: 24px; height: 24px; border-radius: 50%;
        background: transparent; border: none; cursor: pointer;
        pointer-events: all;
      }
    `;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const GD = 230;

  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col items-center px-4 pt-6 pb-10 bg-background">

      {/* ── GUMBALL MACHINE ── */}
      <div
        style={{ position: "relative", userSelect: "none", cursor: canDraw ? "pointer" : "default" }}
        onClick={canDraw ? handleDraw : undefined}
      >
        <div style={{
          position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)",
          width: 160, height: 16, borderRadius: "50%",
          background: "rgba(0,0,0,0.13)", filter: "blur(10px)", pointerEvents: "none",
        }} />

        <div style={isSpinning ? { animation: "ld2-shake 0.38s ease-in-out infinite" } : {}}>

          {/* GLOBE */}
          <div style={{
            position: "relative", width: GD, height: GD, borderRadius: "50%",
            background: "linear-gradient(145deg, rgba(255,255,255,0.72) 0%, rgba(210,238,255,0.55) 40%, rgba(180,220,255,0.38) 100%)",
            border: "3px solid rgba(255,255,255,0.85)",
            boxShadow: isSpinning
              ? "0 6px 40px rgba(100,180,255,0.38), inset 0 6px 24px rgba(255,255,255,0.5), inset 0 -8px 24px rgba(120,180,255,0.2), 0 0 28px rgba(77,217,240,0.45)"
              : "0 6px 32px rgba(100,180,255,0.22), inset 0 6px 24px rgba(255,255,255,0.5), inset 0 -8px 24px rgba(120,180,255,0.2)",
            overflow: "hidden", transition: "box-shadow 0.4s",
          }}>
            <div style={{
              position: "absolute", top: "10%", left: "14%", width: "28%", height: "38%",
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0) 100%)",
              transform: "rotate(-28deg)", pointerEvents: "none", zIndex: 20,
            }} />
            <div style={{
              position: "absolute", top: "18%", right: "12%", width: "10%", height: "18%",
              borderRadius: "50%", background: "rgba(255,255,255,0.45)", pointerEvents: "none", zIndex: 20,
            }} />

            {GLOBE_BALLS.map((b, i) => {
              const def = BALL_DEFS[i % BALL_DEFS.length];
              const ballPx = (BALL_R / 100) * GD * 2;
              const floatDur = 2.4 + (i % 4) * 0.35;
              const floatDelay = (i * 0.28) % 2.2;
              return (
                <div key={i} style={{
                  position: "absolute", left: `${b.cx}%`, top: `${b.cy}%`,
                  transform: "translate(-50%, -50%)", width: ballPx, height: ballPx,
                  zIndex: 10 - (i % 3),
                }}>
                  <div style={{
                    width: "100%", height: "100%", borderRadius: "50%",
                    background: `radial-gradient(circle at 34% 28%, ${def.shine}, ${def.color} 52%, ${def.shadow})`,
                    boxShadow: `0 ${ballPx * 0.1}px ${ballPx * 0.22}px rgba(0,0,0,0.28), inset 0 -${ballPx * 0.06}px ${ballPx * 0.1}px rgba(0,0,0,0.1)`,
                    animation: isSpinning
                      ? `ld2-spin ${0.42 + (i % 5) * 0.08}s linear infinite`
                      : `ld2-float ${floatDur}s ease-in-out ${floatDelay}s infinite`,
                  }} />
                </div>
              );
            })}
          </div>

          {/* CHROME RING */}
          <div style={{
            margin: "0 auto", marginTop: -32, width: GD + 10, height: 34,
            background: "linear-gradient(180deg, #d0d0d0 0%, #b8b8b8 30%, #989898 60%, #c8c8c8 100%)",
            borderRadius: 8,
            boxShadow: "0 6px 16px rgba(0,0,0,0.28), inset 0 2px 5px rgba(255,255,255,0.65), inset 0 -2px 5px rgba(0,0,0,0.18)",
            position: "relative", zIndex: 10,
          }}>
            <div style={{
              position: "absolute", top: "26%", left: "6%", right: "6%", height: "20%",
              background: "rgba(255,255,255,0.6)", borderRadius: 4,
            }} />
          </div>

          {/* BASE */}
          <div style={{
            margin: "0 auto", marginTop: -2, width: GD - 20,
            background: "linear-gradient(150deg, #6bbfff 0%, #4a9fe8 40%, #2d7fd0 100%)",
            borderRadius: "0 0 36px 36px",
            boxShadow: "0 8px 28px rgba(50,120,200,0.35), inset 4px 0 12px rgba(255,255,255,0.18), inset -4px 0 12px rgba(0,0,60,0.1)",
            paddingBottom: 18, position: "relative", zIndex: 9,
          }}>
            <div style={{ height: 8 }} />
            <div style={{
              margin: "12px auto 0", width: 52, height: 52, borderRadius: "50%",
              background: "linear-gradient(145deg, #5ab0f0, #3080c8)",
              boxShadow: "0 3px 10px rgba(0,40,100,0.28), inset 0 2px 6px rgba(255,255,255,0.22), inset 0 -2px 4px rgba(0,0,60,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2.5px solid rgba(255,255,255,0.35)",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ width: 12, height: 2, borderRadius: 2, background: "rgba(255,255,255,0.7)", position: "relative" }}>
                  <div style={{
                    position: "absolute", top: -5, left: "50%", transform: "translateX(-50%)",
                    width: 2, height: 12, borderRadius: 2, background: "rgba(255,255,255,0.7)",
                  }} />
                </div>
              </div>
            </div>
            <div style={{ margin: "12px auto 0", width: 64, height: 40, position: "relative" }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(160deg, #3a90d8, #2060a8)",
                borderRadius: "24px 24px 10px 10px",
                boxShadow: "inset 0 3px 8px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(255,255,255,0.1)",
                border: "2px solid rgba(255,255,255,0.25)",
                overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isDone && drawnNumber !== null && (
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: `radial-gradient(circle at 34% 28%, ${BALL_DEFS[0].shine}, ${BALL_DEFS[0].color} 52%, ${BALL_DEFS[0].shadow})`,
                    boxShadow: "0 3px 8px rgba(0,0,0,0.3)",
                    animation: "ld2-drop 0.45s cubic-bezier(0.22,1,0.36,1) forwards",
                  }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS */}
      <div style={{ minHeight: 26, marginTop: 20, textAlign: "center" }}>
        {!isSpinning && !isDone && (
          <p className="text-sm font-semibold text-gray-500">기계를 터치해서 추첨하세요!</p>
        )}
        {isSpinning && (
          <p className="text-sm font-bold text-blue-500 animate-pulse">추첨 중... 🎰</p>
        )}
      </div>

      {/* RANGE SLIDER */}
      {!isDone && (
        <div className="mt-3 w-full max-w-sm rounded-2xl bg-card border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">추첨 범위</span>
            <span className="text-sm font-bold text-blue-600">{minScore} ~ {maxScore}</span>
          </div>

          {/* Dual range slider — native inputs are invisible (interaction only),
              track + circles are drawn as plain divs.
              Thumb center formula: calc(pct% + (10 - pct×0.2)px)
              accounts for browser's 10px inset on each side for a 20px thumb. */}
          <div style={{ position: "relative", height: 24, marginBottom: 8 }}>
            {/* Grey track */}
            <div style={{
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              left: 10, right: 10, height: 4, borderRadius: 2, background: "#e5e7eb",
            }} />
            {/* Blue active track */}
            <div style={{
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              left:  `calc(${minPct}% + ${10 - minPct  * 0.2}px)`,
              width: `calc(${maxPct - minPct}% - ${(maxPct - minPct) * 0.2}px)`,
              height: 4, borderRadius: 2, background: "#3b82f6",
            }} />
            {/* Custom min circle */}
            <div style={{
              position: "absolute", top: "50%",
              left: `calc(${minPct}% + ${10 - minPct * 0.2}px)`,
              transform: "translate(-50%, -50%)",
              width: 20, height: 20, borderRadius: "50%",
              background: "#3b82f6", border: "2.5px solid #fff",
              boxShadow: "0 2px 6px rgba(59,130,246,0.45)",
              zIndex: 3, pointerEvents: "none",
            }} />
            {/* Custom max circle */}
            <div style={{
              position: "absolute", top: "50%",
              left: `calc(${maxPct}% + ${10 - maxPct * 0.2}px)`,
              transform: "translate(-50%, -50%)",
              width: 20, height: 20, borderRadius: "50%",
              background: "#3b82f6", border: "2.5px solid #fff",
              boxShadow: "0 2px 6px rgba(59,130,246,0.45)",
              zIndex: 3, pointerEvents: "none",
            }} />
            {/* Invisible min input — drag interaction only */}
            <input
              type="range" className="ld2-range"
              min={RANGE_MIN} max={RANGE_MAX} value={minScore}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v < maxScore) { setMinScore(v); reset(); }
              }}
              style={{ zIndex: minScore > RANGE_MAX - 10 ? 5 : 4 }}
            />
            {/* Invisible max input — drag interaction only */}
            <input
              type="range" className="ld2-range"
              min={RANGE_MIN} max={RANGE_MAX} value={maxScore}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v > minScore) { setMaxScore(v); reset(); }
              }}
              style={{ zIndex: 4 }}
            />
          </div>

          {/* Min/max labels */}
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">{RANGE_MIN}</span>
            <span className="text-xs text-muted-foreground">{RANGE_MAX}</span>
          </div>
        </div>
      )}

      {/* RESULT */}
      {isDone && drawnNumber !== null && (
        <div style={{
          marginTop: 16, width: "100%", maxWidth: 340,
          animation: showResult ? "ld2-result 0.32s cubic-bezier(0.22,1,0.36,1) forwards" : "none",
          opacity: showResult ? 1 : 0,
        }}>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm text-center">
            <p className="text-xs font-bold text-blue-500 mb-3 tracking-wide">🎉 추첨 번호</p>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 100, height: 100, borderRadius: "50%",
              background: `radial-gradient(circle at 34% 28%, ${BALL_DEFS[0].shine}, ${BALL_DEFS[0].color} 52%, ${BALL_DEFS[0].shadow})`,
              boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
              animation: "ld2-item 0.3s ease-out both",
            }}>
              <span style={{
                fontSize: 36, fontWeight: 900, color: "#fff",
                textShadow: "0 2px 6px rgba(0,0,0,0.25)",
              }}>{drawnNumber}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">범위: {minScore} ~ {maxScore}</p>
            <button
              onClick={reset}
              className="mt-3 w-full py-2 rounded-xl border border-border text-gray-500 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-muted transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              다시 추첨
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
