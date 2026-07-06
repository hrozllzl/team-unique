import { useState, useRef, useEffect, useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { useApp } from "@/context/AppContext";

/* ── Ball colours (pastel) ── */
const BALL_DEFS = [
  { color: "#FFE88A", shine: "#FFF7C2", shadow: "#F5C842" },
  { color: "#FFB3CC", shine: "#FFD9E8", shadow: "#F07099" },
  { color: "#A8E6B0", shine: "#D4F5D8", shadow: "#6DC97A" },
  { color: "#A3ECF8", shine: "#D6F7FD", shadow: "#5DD0E8" },
  { color: "#CEBAF9", shine: "#E8DCFF", shadow: "#A980F0" },
  { color: "#FFCAA0", shine: "#FFE4CC", shadow: "#F5A06A" },
  { color: "#FFB3D6", shine: "#FFD9EC", shadow: "#F07EB0" },
  { color: "#B8F5CE", shine: "#DAFAE8", shadow: "#72DDA0" },
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

type Phase = "idle" | "spinning" | "done";

/* 게임 기록 1건의 유효 점수 평균 (null 제외) */
function gameAvg(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s !== null);
  if (valid.length === 0) return null;
  return Math.floor(valid.reduce((a, b) => a + b, 0) / valid.length);
}

export default function LuckyDraw() {
  const { records } = useApp();

  /* 전체 게임 기록의 평균 점수들 → 최솟값/최댓값 계산 */
  const { rangeMin, rangeMax } = useMemo(() => {
    const avgs = records.map((r) => gameAvg(r.scores)).filter((v): v is number => v !== null);
    if (avgs.length === 0) return { rangeMin: 100, rangeMax: 300 };
    return {
      rangeMin: Math.min(...avgs),
      rangeMax: Math.max(...avgs),
    };
  }, [records]);

  const [minScore, setMinScore] = useState(rangeMin);
  const [maxScore, setMaxScore] = useState(rangeMax);
  const [drawnNumber, setDrawnNumber] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [showResult, setShowResult] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* 데이터 바뀌면 슬라이더 범위 자동 갱신 */
  useEffect(() => {
    setMinScore(rangeMin);
    setMaxScore(rangeMax);
  }, [rangeMin, rangeMax]);

  const isSpinning = phase === "spinning";
  const isDone = phase === "done";
  const canDraw = minScore < maxScore && !isSpinning;

  /* 슬라이더 트랙 채우기 퍼센트 */
  const span = rangeMax - rangeMin || 1;
  const minPct = ((minScore - rangeMin) / span) * 100;
  const maxPct = ((maxScore - rangeMin) / span) * 100;

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
                    boxShadow: `0 ${ballPx * 0.1}px ${ballPx * 0.22}px rgba(0,0,0,0.18), inset 0 -${ballPx * 0.06}px ${ballPx * 0.1}px rgba(0,0,0,0.08)`,
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
                    background: "radial-gradient(circle at 34% 28%, #93C5FD, #3B82F6 52%, #1D4ED8)",
                    boxShadow: "0 3px 8px rgba(59,130,246,0.5)",
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
              min={rangeMin} max={rangeMax} value={minScore}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v < maxScore) { setMinScore(v); reset(); }
              }}
              style={{ zIndex: minScore > rangeMax - 10 ? 5 : 4 }}
            />
            {/* Invisible max input — drag interaction only */}
            <input
              type="range" className="ld2-range"
              min={rangeMin} max={rangeMax} value={maxScore}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v > minScore) { setMaxScore(v); reset(); }
              }}
              style={{ zIndex: 4 }}
            />
          </div>

          {/* Min/max labels */}
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">{rangeMin}</span>
            <span className="text-xs text-muted-foreground">{rangeMax}</span>
          </div>
        </div>
      )}

      {/* RESULT MODAL */}
      {isDone && drawnNumber !== null && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          animation: showResult ? "ld2-result 0.28s cubic-bezier(0.22,1,0.36,1) forwards" : "none",
          opacity: showResult ? 1 : 0,
        }}>
          <div style={{
            background: "#fff", borderRadius: 24,
            padding: "32px 36px 28px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
            textAlign: "center", minWidth: 260,
            animation: showResult ? "ld2-drop 0.38s cubic-bezier(0.22,1,0.36,1) forwards" : "none",
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#3B82F6", marginBottom: 20, letterSpacing: "0.04em" }}>🎉 추첨 번호</p>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 110, height: 110, borderRadius: "50%",
              background: "radial-gradient(circle at 34% 28%, #93C5FD, #3B82F6 52%, #1D4ED8)",
              boxShadow: "0 8px 32px rgba(59,130,246,0.5)",
              animation: "ld2-item 0.3s ease-out both",
            }}>
              <span style={{
                fontSize: 40, fontWeight: 900, color: "#fff",
                textShadow: "0 2px 8px rgba(0,0,80,0.3)",
              }}>{drawnNumber}</span>
            </div>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 12 }}>범위: {minScore} ~ {maxScore}</p>
            <button
              onClick={reset}
              style={{
                marginTop: 20, width: "100%", padding: "10px 0",
                borderRadius: 12, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                color: "#fff", fontSize: 14, fontWeight: 700,
                boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <RotateCcw style={{ width: 14, height: 14 }} />
              다시 추첨
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
