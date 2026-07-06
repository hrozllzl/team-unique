import { useState, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Sparkles, RotateCcw, Check } from "lucide-react";

export default function LuckyDraw() {
  const [, setLocation] = useLocation();
  const { members } = useApp();

  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [winnerCount, setWinnerCount] = useState(1);
  const [winners, setWinners] = useState<string[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [revealIdx, setRevealIdx] = useState(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const participants = useMemo(
    () => members.filter((m) => !excludedIds.has(m.id)),
    [members, excludedIds]
  );

  function toggleExcluded(id: string) {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function draw() {
    if (participants.length === 0 || drawing) return;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const n = Math.min(winnerCount, participants.length);
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, n).map((m) => m.id);

    setWinners([]);
    setRevealIdx(0);
    setDrawing(true);

    picked.forEach((id, i) => {
      const t = setTimeout(() => {
        setWinners((prev) => [...prev, id]);
        setRevealIdx(i + 1);
        if (i === picked.length - 1) setDrawing(false);
      }, (i + 1) * 500);
      timeoutsRef.current.push(t);
    });
  }

  function reset() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setWinners([]);
    setRevealIdx(0);
    setDrawing(false);
  }

  const winnerMembers = winners
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => !!m);

  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col items-center px-6 pt-6 pb-10">
      <div className="w-full max-w-2xl flex items-center gap-2 mb-5">
        <button
          onClick={() => setLocation("/")}
          className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">행운 번호 추첨</h1>
      </div>

      <Card className="w-full max-w-2xl mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            추첨 결과
          </CardTitle>
        </CardHeader>
        <CardContent>
          {winnerMembers.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              참여 인원을 선택하고 추첨 버튼을 눌러주세요
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
              {winnerMembers.map((m, i) => (
                <div
                  key={m.id}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-amber-200 bg-amber-50 py-4 px-2 animate-in fade-in zoom-in-95 duration-300"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <p className="font-semibold text-gray-900 text-center truncate w-full">{m.name}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={draw}
              disabled={participants.length === 0 || drawing}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              {drawing ? `추첨 중... (${revealIdx}/${Math.min(winnerCount, participants.length)})` : "추첨하기"}
            </button>
            {winnerMembers.length > 0 && !drawing && (
              <button
                onClick={reset}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-muted transition-colors flex items-center justify-center gap-1.5 text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                초기화
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">추첨 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">당첨 인원 수</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWinnerCount((n) => Math.max(1, n - 1))}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600 hover:bg-muted transition-colors"
              >
                −
              </button>
              <span className="w-12 text-center font-bold text-gray-900">{winnerCount}</span>
              <button
                onClick={() => setWinnerCount((n) => Math.min(participants.length || 1, n + 1))}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600 hover:bg-muted transition-colors"
              >
                +
              </button>
              <span className="text-xs text-muted-foreground ml-1">명 (총 참여 {participants.length}명)</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">참여 인원 선택</label>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">등록된 회원이 없습니다</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {members.map((m) => {
                  const included = !excludedIds.has(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleExcluded(m.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                        included
                          ? "border-primary/40 bg-primary/5 text-gray-900"
                          : "border-gray-200 bg-gray-50 text-gray-400"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          included ? "bg-primary text-white" : "bg-gray-200"
                        }`}
                      >
                        {included && <Check className="w-3 h-3" />}
                      </span>
                      <span className="truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
