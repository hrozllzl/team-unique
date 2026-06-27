import { useState, useEffect } from "react";
import { ClipboardEdit, Save } from "lucide-react";
import { useApp } from "@/context/AppContext";
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
    const numeric = val.replace(/\D/g, "");
    setRows((prev) => ({
      ...prev,
      [memberId]: {
        scores: prev[memberId].scores.map((s, i) => (i === idx ? numeric : s)),
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
      toast({ title: "입력된 점수가 없습니다.", variant: "destructive" });
      return;
    }

    addRecords(toSave);
    setRows(
      Object.fromEntries(
        members.map((m) => [m.id, { scores: Array(GAME_COUNT).fill("") }])
      )
    );

    toast({ title: `${toSave.length}명의 점수가 저장되었습니다!` });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
          <ClipboardEdit className="w-5 h-5 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">점수 입력</h1>
      </div>

      <div className="border-b border-border mb-6" />

      <div className="flex items-center mb-4 gap-4">
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
      </div>


      {members.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardEdit className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>등록된 회원이 없습니다.</p>
          <p className="text-sm mt-1">회원 관리 메뉴에서 회원을 먼저 추가해 주세요.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="bg-white border border-border rounded-2xl shadow-sm overflow-x-auto pb-20">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-44">이름</th>
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
                      <td className="px-4 py-2.5 w-44">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs shrink-0">
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
                            type="text"
                            placeholder="-"
                            value={score}
                            disabled={isDuplicate}
                            onChange={(e) => handleScore(member.id, idx, e.target.value)}
                            onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="text-center rounded-lg h-8 px-1 w-14 mx-auto"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-center w-20">
                        <span
                          className={`tabular-nums font-semibold inline-block w-16 text-center ${
                            avg === "–" ? "text-muted-foreground font-normal" : "text-blue-600"
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

          <button
            data-testid="button-save-all"
            onClick={handleSave}
            disabled={members.length === 0}
            className="absolute right-4 bottom-4 z-10 w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-xl flex items-center justify-center disabled:opacity-40 transition-colors"
            aria-label="저장"
          >
            <Save className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
