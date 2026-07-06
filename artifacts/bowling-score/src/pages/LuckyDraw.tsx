import { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Minus } from "lucide-react";
import { useApp } from "@/context/AppContext";

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
  { cx: 38, cy: 47 }, { cx: 62, cy: 47 },
  { cx: 28, cy: 61 }, { cx: 50, cy: 61 }, { cx: 72, cy: 61 },
  { cx: 32, cy: 75 }, { cx: 50, cy: 75 }, { cx: 68, cy: 75 },
];

type Phase = "idle" | "spinning" | "done";

function gameAvg(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s !== null);
  if (valid.length === 0) return null;
  return Math.floor(valid.reduce((a, b) => a + b, 0) / valid.length);
}

function getTier(score: number): number {
  return Math.floor(score / 10) * 10;
}

export default function LuckyDraw() {
  const { records } = useApp();

  const { rangeMin, rangeMax } = useMemo(() => {
    const avgs = records.map((r) => gameAvg(r.scores)).filter((v): v is number => v !== null);
    if (avgs.length === 0) return { rangeMin: 100, rangeMax: 300 };
    return { rangeMin: Math.min(...avgs), rangeMax: Math.max(...avgs) };
  }, [records]);

  const [totalDraws, setTotalDraws] = useState(5);
  const [minScore, setMinScore] = useState(rangeMin);
  const [maxScore, setMaxScore] = useState(rangeMax);
  const [drawnResults, setDrawnResults] = useState<{ score: number; tier: number }[]>([]);
  const [excludedTiers, setExcludedTiers] = useState<number[]>([]);
  const [drawnNumber, setDrawnNumber] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [showResult, setShowResult] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setMinScore(rangeMin);
    setMaxScore(rangeMax);
  }, [rangeMin, rangeMax]);

  const isSpinning = phase === "spinning";
  const isDone = phase === "done";
  const hasStarted = drawnResults.length > 0;
  const remainingDraws = totalDraws - drawnResults.length;
  const allDone = remainingDraws === 0;

  const validPool = useMemo(() => {
    const pool: number[] = [];
    for (let n = minScore; n <= maxScore; n++) {
      if (!excludedTiers.includes(getTier(n))) pool.push(n);
    }
    return pool;
  }, [minScore, maxScore, excludedTiers]);

  const canDraw = validPool.length > 0 && !isSpinning && remainingDraws > 0;

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
      const picked = validPool[Math.floor(Math.random() * validPool.length)];
      setDrawnNumber(picked);
      setPhase("done");
      setTimeout(() => setShowResult(true), 80);
    }, 2600);
    timeoutsRef.current.push(t);
  }

  function confirmResult() {
    if (drawnNumber === null) return;
    const tier = getTier(drawnNumber);
    setDrawnResults((prev) => [...prev, { score: drawnNumber, tier }]);
    setExcludedTiers((prev) => [...prev, tier]);
    setShowResult(false);
    setDrawnNumber(null);
    setPhase("idle");
  }

  function resetAll() {
    timeoutsRef.current.forEach(clearTimeout);
    setDrawnResults([]);
    setExcludedTiers([]);
    setDrawnNumber(null);
    setShowResult(false);
    setPhase("idle");
  }

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
      @keyframes ld2-result { 0% { opacity:0; } 100% { opacity:1; } }
      @keyframes ld2-popup {
        0%   { transform: translateY(20px) scale(0.95); opacity: 0; }
        100% { transform: translateY(0)    scale(1);    opacity: 1; }
      }
      @keyframes ld2-item { 0% { transform:translateX(-8px); opacity:0; } 100% { transform:translateX(0); opacity:1; } }
      @keyframes ld2-shake {
        0%,100% { transform: translateX(0); }
        20%      { transform: translateX(-6px) rotate(-1.5deg); }
        40%      { transform: translateX(6px)  rotate(1.5deg); }
        60%      { transform: translateX(-4px) rotate(-0.8deg); }
        80%      { transform: translateX(4px)  rotate(0.8deg); }
      }
      .ld2-range {
        -webkit-appearance:none; appearance:none;
        position:absolute; top:0; left:0; width:100%; height:100%;
        background:transparent; outline:none; margin:0; padding:0; opacity:0; pointer-events:none;
      }
      .ld2-range::-webkit-slider-runnable-track { background:transparent; }
      .ld2-range::-moz-range-track { background:transparent; border:none; }
      .ld2-range::-webkit-slider-thumb {
        -webkit-appearance:none; appearance:none;
        width:24px; height:24px; border-radius:50%;
        background:transparent; cursor:pointer; pointer-events:all;
      }
      .ld2-range::-moz-range-thumb {
        width:24px; height:24px; border-radius:50%;
        background:transparent; border:none; cursor:pointer; pointer-events:all;
      }
    `;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const GD = 230;

  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col items-center px-4 pt-4 pb-10 bg-background">

      {/* ── 오늘의 추첨 횟수 ── */}
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-4 shadow-sm mb-3 text-center">
        <p className="text-xs font-semibold text-gray-500">오늘의 추첨 횟수</p>
        {hasStarted && (
          <p className="text-xs text-blue-500 font-medium mt-0.5">
            {drawnResults.length}/{totalDraws}회 완료
            {allDone && " 🎉"}
          </p>
        )}
        {/* 진행 바 */}
        {hasStarted && (
          <div style={{ marginTop: 8, height: 5, borderRadius: 3, background: "#e5e7eb", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3,
              background: "linear-gradient(90deg, #3B82F6, #2563EB)",
              width: `${(drawnResults.length / totalDraws) * 100}%`,
              transition: "width 0.4s ease",
            }} />
          </div>
        )}
        {/* 스테퍼 */}
        <div className="flex items-center justify-center gap-3 mt-3">
          <button
            onClick={() => { if (!hasStarted && totalDraws > 1) setTotalDraws(t => t - 1); }}
            disabled={hasStarted || totalDraws <= 1}
            style={{
              width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #e5e7eb",
              background: hasStarted || totalDraws <= 1 ? "#f9fafb" : "#fff",
              color: hasStarted || totalDraws <= 1 ? "#d1d5db" : "#374151",
              cursor: hasStarted || totalDraws <= 1 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)", flexShrink: 0,
            }}
          ><Minus style={{ width: 14, height: 14 }} /></button>
          <span style={{ fontSize: 24, fontWeight: 800, color: "#1d4ed8", minWidth: 32, textAlign: "center" }}>
            {totalDraws}
          </span>
          <button
            onClick={() => { if (!hasStarted && totalDraws < 20) setTotalDraws(t => t + 1); }}
            disabled={hasStarted || totalDraws >= 20}
            style={{
              width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #e5e7eb",
              background: hasStarted || totalDraws >= 20 ? "#f9fafb" : "#fff",
              color: hasStarted || totalDraws >= 20 ? "#d1d5db" : "#374151",
              cursor: hasStarted || totalDraws >= 20 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)", flexShrink: 0,
            }}
          ><Plus style={{ width: 14, height: 14 }} /></button>
        </div>
      </div>

      {/* ── GUMBALL MACHINE ── */}
      <div style={{ position: "relative", userSelect: "none" }}>
        <div style={{
          position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)",
          width: 160, height: 16, borderRadius: "50%",
          background: "rgba(0,0,0,0.13)", filter: "blur(10px)", pointerEvents: "none",
        }} />
        <div style={isSpinning ? { animation: "ld2-shake 0.38s ease-in-out infinite" } : {}}>
          {/* GLOBE */}
          <div style={{
            position: "relative", width: GD, height: GD, borderRadius: "50%",
            background: "linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(248,249,252,0.78) 40%, rgba(236,240,248,0.6) 100%)",
            border: "3px solid rgba(255,255,255,0.98)",
            boxShadow: isSpinning
              ? "0 6px 40px rgba(0,0,0,0.14), inset 0 6px 24px rgba(255,255,255,0.9), inset 0 -8px 24px rgba(0,0,0,0.06), 0 0 24px rgba(100,130,255,0.18)"
              : "0 6px 32px rgba(0,0,0,0.10), inset 0 6px 24px rgba(255,255,255,0.9), inset 0 -8px 24px rgba(0,0,0,0.05)",
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
            margin: "0 auto", marginTop: -44, width: GD + 10, height: 34,
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
            background: "linear-gradient(150deg, #9ca3af 0%, #6b7280 40%, #4b5563 100%)",
            borderRadius: "0 0 36px 36px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22), inset 4px 0 12px rgba(255,255,255,0.18), inset -4px 0 12px rgba(0,0,0,0.12)",
            paddingBottom: 18, position: "relative", zIndex: 9,
          }}>
            <div style={{ height: 10 }} />
            {/* 슬롯 출구 */}
            <div style={{ margin: "0 auto", width: 64, height: 36, position: "relative" }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(160deg, #6b7280, #4b5563)",
                borderRadius: "20px 20px 8px 8px",
                boxShadow: "inset 0 3px 8px rgba(0,0,0,0.2), inset 0 -2px 4px rgba(255,255,255,0.15)",
                border: "1.5px solid rgba(255,255,255,0.25)",
                overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isDone && drawnNumber !== null && (
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "radial-gradient(circle at 34% 28%, #93C5FD, #3B82F6 52%, #1D4ED8)",
                    boxShadow: "0 3px 8px rgba(59,130,246,0.5)",
                    animation: "ld2-drop 0.45s cubic-bezier(0.22,1,0.36,1) forwards",
                  }} />
                )}
              </div>
            </div>
            {/* 텍스트 버튼 */}
            <button
              onClick={allDone ? resetAll : canDraw ? handleDraw : undefined}
              disabled={isSpinning || isDone || (!canDraw && !allDone)}
              style={{
                display: "block", margin: "12px auto 0",
                padding: "9px 28px", borderRadius: 24,
                background: allDone
                  ? "linear-gradient(135deg, #3B82F6, #2563EB)"
                  : canDraw
                    ? "linear-gradient(135deg, #3B82F6, #2563EB)"
                    : "linear-gradient(135deg, #cbd5e1, #94a3b8)",
                color: "#fff", fontSize: 13, fontWeight: 700,
                border: "none",
                cursor: (canDraw || allDone) && !isSpinning && !isDone ? "pointer" : "not-allowed",
                opacity: isSpinning ? 0.6 : 1,
                boxShadow: (canDraw || allDone) && !isSpinning
                  ? "0 4px 14px rgba(0,0,0,0.18)"
                  : "none",
                transition: "all 0.2s",
                letterSpacing: "0.02em",
              }}
            >
              {isSpinning ? "추첨 중..." : allDone ? "초기화하기" : "추첨하기"}
            </button>
          </div>
        </div>
      </div>

      {/* STATUS */}
      <div style={{ minHeight: 24, marginTop: 10, textAlign: "center" }}>
        {!isSpinning && !isDone && validPool.length === 0 && remainingDraws > 0 && (
          <p className="text-xs font-semibold text-orange-500">⚠️ 추첨 가능한 점수대가 없어요</p>
        )}
        {isSpinning && (
          <p className="text-xs font-bold text-blue-500 animate-pulse">{drawnResults.length + 1}차 추첨 중... 🎰</p>
        )}
        {!isSpinning && !isDone && allDone && (
          <p className="text-xs font-bold text-blue-500">🎉 모든 추첨이 완료됐어요!</p>
        )}
      </div>

      {/* ── 완료된 추첨 결과 카드 ── */}
      {drawnResults.length > 0 && (
        <div className="w-full max-w-sm mt-2 mb-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {drawnResults.map((r, i) => (
            <div key={i} className="bg-card border border-border" style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "10px 8px", borderRadius: 16,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF" }}>{i + 1}차</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#1D4ED8", lineHeight: 1.2 }}>{r.score}</span>
              <span style={{ fontSize: 10, color: "#93C5FD", marginTop: 1 }}>{r.tier}점대</span>
            </div>
          ))}
        </div>
      )}

      {/* RANGE SLIDER */}
      <div className="mt-3 w-full max-w-sm rounded-2xl bg-card border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500">추첨 범위</span>
          <span className="text-sm font-bold text-blue-600">{minScore} ~ {maxScore}</span>
        </div>
        <div style={{ position: "relative", height: 24, marginBottom: 8 }}>
          <div style={{
            position: "absolute", top: "50%", transform: "translateY(-50%)",
            left: 10, right: 10, height: 4, borderRadius: 2, background: "#e5e7eb",
          }} />
          <div style={{
            position: "absolute", top: "50%", transform: "translateY(-50%)",
            left: `calc(${minPct}% + ${10 - minPct * 0.2}px)`,
            width: `calc(${maxPct - minPct}% - ${(maxPct - minPct) * 0.2}px)`,
            height: 4, borderRadius: 2, background: "#3b82f6",
          }} />
          <div style={{
            position: "absolute", top: "50%",
            left: `calc(${minPct}% + ${10 - minPct * 0.2}px)`,
            transform: "translate(-50%, -50%)",
            width: 20, height: 20, borderRadius: "50%",
            background: "#3b82f6", border: "2.5px solid #fff",
            boxShadow: "0 2px 6px rgba(59,130,246,0.45)", zIndex: 3, pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", top: "50%",
            left: `calc(${maxPct}% + ${10 - maxPct * 0.2}px)`,
            transform: "translate(-50%, -50%)",
            width: 20, height: 20, borderRadius: "50%",
            background: "#3b82f6", border: "2.5px solid #fff",
            boxShadow: "0 2px 6px rgba(59,130,246,0.45)", zIndex: 3, pointerEvents: "none",
          }} />
          <input type="range" className="ld2-range"
            min={rangeMin} max={rangeMax} value={minScore}
            onChange={(e) => { const v = Number(e.target.value); if (v < maxScore && !hasStarted) setMinScore(v); }}
            style={{ zIndex: minScore > rangeMax - 10 ? 5 : 4 }}
          />
          <input type="range" className="ld2-range"
            min={rangeMin} max={rangeMax} value={maxScore}
            onChange={(e) => { const v = Number(e.target.value); if (v > minScore && !hasStarted) setMaxScore(v); }}
            style={{ zIndex: 4 }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">{rangeMin}</span>
          <span className="text-xs text-muted-foreground">{rangeMax}</span>
        </div>
        {hasStarted && (
          <p className="text-xs text-gray-400 mt-1 text-center">추첨 시작 후 범위 변경 불가</p>
        )}
      </div>


      {/* ── 결과 팝업 모달 ── */}
      {isDone && drawnNumber !== null && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          animation: showResult ? "ld2-result 0.25s ease forwards" : "none",
          opacity: showResult ? 1 : 0,
        }}>
          <div style={{
            background: "#fff", borderRadius: 24,
            padding: "28px 32px 24px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
            textAlign: "center", minWidth: 270,
            animation: showResult ? "ld2-popup 0.35s cubic-bezier(0.22,1,0.36,1) forwards" : "none",
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 4 }}>
              {drawnResults.length + 1}차 / {totalDraws}회 추첨
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#3B82F6", marginBottom: 16, letterSpacing: "0.04em" }}>
              🎉 추첨 번호
            </p>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 110, height: 110, borderRadius: "50%",
              background: "radial-gradient(circle at 34% 28%, #93C5FD, #3B82F6 52%, #1D4ED8)",
              boxShadow: "0 8px 32px rgba(59,130,246,0.5)",
              animation: "ld2-item 0.3s ease-out both",
            }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: "#fff", textShadow: "0 2px 8px rgba(0,0,80,0.3)" }}>
                {drawnNumber}
              </span>
            </div>
            <button
              onClick={confirmResult}
              style={{
                marginTop: 20, width: "100%", padding: "11px 0",
                borderRadius: 12, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                color: "#fff", fontSize: 14, fontWeight: 700,
                boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
              }}
            >
              {remainingDraws === 1 ? "완료" : `다음 추첨 (${remainingDraws - 1}회 남음)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
