import { useState, useEffect } from "react";
import { ClipboardEdit, Save, AlertCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const GAME_COUNT = 5;

type ScoreRow = { scores: string[] };

function calcAvg(scores: string[]): string {
  const nums = scores
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n) && n >= 0 && n <= 300);
  if (nums.length === 0) return "–";
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return avg % 1 === 0 ? String(avg) : avg.toFixed(1);
}

export default function ScoreEntry() {
  const { members, records, addRecords } = useApp();
  const { toast } = useToast();

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [rows, setRows] = useState<Record<string, ScoreRow>>({});

  useEffect(() => {
    setRows((prev) => {
      const next = { ...prev };
      members.forEach((m) => {
        if (!next[m.id]) {
          next[m.id] = { scores: Array(GAME_COUNT).fill("") };
        }
      });
      Object.keys(next).forEach((id) => {
        if (!members.find((m) => m.id === id)) delete next[id];
      });
      return next;
    });
  }, [members]);

  const handleScore = (memberId: string, idx: number, val: string) => {
    setRows((prev) => ({
      ...prev,
      [memberId]: {
        scores: prev[memberId].scores.map((s, i) => (i === idx ? val : s)),
      },
    }));
  };

  const activeMemberIds = new Set(members.map((m) => m.id));
  const duplicateIds = new Set(
    records
      .filter((r) => r.date === date && activeMemberIds.has(r.memberId))
      .map((r) => r.memberId)
  );

  const handleSave = () => {
    const toSave = members
      .map((m) => {
        if (duplicateIds.has(m.id)) return null;
        const row = rows[m.id];
        if (!row) return null;
        const parsed = row.scores.map((s) => {
          const n = parseInt(s, 10);
          return s === "" || isNaN(n) || n < 0 || n > 300 ? null : n;
        });
        if (parsed.every((v) => v === null)) return null;
        return { date, memberId: m.id, scores: parsed };
      })
      .filter(
        (r): r is { date: string; memberId: string; scores: (number | null)[] } =>
          r !== null
      );

    const skipped = members.filter((m) => duplicateIds.has(m.id));

    if (toSave.length === 0) {
      if (skipped.length > 0) {
        toast({
          title: "저장할 점수가 없습니다.",
          description: `${skipped.map((m) => m.name).join(", ")}님은 해당 날짜에 이미 기록이 있습니다.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "입력된 점수가 없습니다.", variant: "destructive" });
      }
      return;
    }

    addRecords(toSave);
    setRows(
      Object.fromEntries(
        members.map((m) => [m.id, { scores: Array(GAME_COUNT).fill("") }])
      )
    );

    const savedNames = toSave.map((r) => members.find((m) => m.id === r.memberId)?.name).filter(Boolean);
    const msg = skipped.length > 0
      ? `${savedNames.join(", ")}님 저장 완료. ${skipped.map((m) => m.name).join(", ")}님은 중복으로 건너뜀.`
      : `${toSave.length}명의 점수가 저장되었습니다!`;
    toast({ title: msg });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
          <ClipboardEdit className="w-5 h-5 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">점수 입력</h1>
      </div>

      <div className="border-b border-border mb-6" />

      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-foreground whitespace-nowrap">날짜</label>
          <input
            data-testid="input-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm border border-border rounded-xl px-3 py-1.5 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-44"
          />
        </div>
        <Button
          data-testid="button-save-all"
          onClick={handleSave}
          disabled={members.length === 0}
          className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl gap-1.5"
        >
          <Save className="w-4 h-4" />
          전체 저장
        </Button>
      </div>

      {duplicateIds.size > 0 && (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <strong>{[...duplicateIds].map((id) => members.find((m) => m.id === id)?.name).filter(Boolean).join(", ")}</strong>님은 해당 날짜에 이미 입력 완료된 기록이 있습니다.
          </span>
        </div>
      )}

      {members.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardEdit className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>등록된 회원이 없습니다.</p>
          <p className="text-sm mt-1">회원 관리 메뉴에서 회원을 먼저 추가해 주세요.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-28">이름</th>
                {Array.from({ length: GAME_COUNT }, (_, i) => (
                  <th key={i} className="text-center px-2 py-3 font-medium text-muted-foreground w-[72px]">
                    {i + 1}G
                  </th>
                ))}
                <th className="text-center px-3 py-3 font-medium text-muted-foreground w-20">평균</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isDuplicate = duplicateIds.has(member.id);
                const row = rows[member.id] ?? { scores: Array(GAME_COUNT).fill("") };
                const avg = calcAvg(row.scores);
                return (
                  <tr
                    key={member.id}
                    data-testid={`entry-row-${member.id}`}
                    className={`border-b border-border last:border-0 transition-colors ${isDuplicate ? "bg-gray-50 opacity-50" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold text-xs shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <span className="font-medium">{member.name}</span>
                        {isDuplicate && (
                          <span className="text-xs text-blue-500 font-medium">입력완료</span>
                        )}
                      </div>
                    </td>
                    {row.scores.map((score, idx) => (
                      <td key={idx} className="px-1.5 py-2 text-center w-[72px]">
                        <Input
                          data-testid={`input-${member.id}-game${idx + 1}`}
                          type="number"
                          min={0}
                          max={300}
                          placeholder="-"
                          value={score}
                          disabled={isDuplicate}
                          onChange={(e) => handleScore(member.id, idx, e.target.value)}
                          className="text-center rounded-lg h-8 px-1 w-14 mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-center w-20">
                      <span
                        className={`tabular-nums font-semibold inline-block w-16 text-center ${
                          avg === "–" ? "text-muted-foreground font-normal" : "text-teal-600"
                        }`}
                      >
                        {avg}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
