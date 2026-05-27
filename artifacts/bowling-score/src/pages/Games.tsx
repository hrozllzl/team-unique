import { useState } from "react";
import { Calendar, Trash2, Pencil } from "lucide-react";
import { useApp, GameRecord } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const GAME_COUNT = 4;

function calcAvg(scores: (number | null)[]): number | null {
  const nums = scores.filter((s): s is number => s !== null);
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export default function Games() {
  const { members, records, removeRecord, updateRecord } = useApp();
  const { toast } = useToast();
  const [filterDate, setFilterDate] = useState("");
  const [editingRecord, setEditingRecord] = useState<GameRecord | null>(null);
  const [editScores, setEditScores] = useState<string[]>([]);

  const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? "알 수 없음";

  const filtered = records
    .filter((r) => !filterDate || r.date === filterDate)
    .sort((a, b) => b.date.localeCompare(a.date));

  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach((r) => {
    if (!grouped[r.date]) grouped[r.date] = [];
    grouped[r.date].push(r);
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  const openEdit = (record: GameRecord) => {
    setEditingRecord(record);
    setEditScores(record.scores.map((s) => (s === null ? "" : String(s))));
  };

  const handleEditSave = () => {
    if (!editingRecord) return;
    const parsed = editScores.map((s) => {
      const n = parseInt(s, 10);
      return s === "" || isNaN(n) || n < 0 || n > 300 ? null : n;
    });
    updateRecord(editingRecord.id, parsed);
    setEditingRecord(null);
    toast({ title: "점수가 수정되었습니다!" });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-orange-400" />
          <h1 className="text-2xl font-bold text-foreground">게임별 점수</h1>
        </div>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="text-sm border border-border rounded-xl px-3 py-1.5 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          data-testid="filter-date"
        />
      </div>

      <div className="border-b border-border mb-6" />

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{filterDate ? "해당 날짜의 기록이 없습니다." : "기록된 점수가 없습니다."}</p>
          <p className="text-sm mt-1">점수 입력 메뉴에서 점수를 등록해 보세요.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayRecords]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                {formatDate(date)}
              </h2>
              <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">이름</th>
                      {[1, 2, 3, 4].map((g) => (
                        <th key={g} className="text-center px-3 py-2.5 font-medium text-muted-foreground">
                          {g}G
                        </th>
                      ))}
                      <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">평균</th>
                      <th className="w-20 px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {dayRecords.map((record) => {
                      const avg = calcAvg(record.scores);
                      return (
                        <tr
                          key={record.id}
                          data-testid={`game-row-${record.id}`}
                          className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium">{getMemberName(record.memberId)}</td>
                          {record.scores.map((score, idx) => (
                            <td key={idx} className="px-3 py-3 text-center">
                              {score !== null ? score : <span className="text-muted-foreground">–</span>}
                            </td>
                          ))}
                          <td className="px-3 py-3 text-center font-semibold text-blue-500">
                            {avg !== null ? avg : <span className="text-muted-foreground">–</span>}
                          </td>
                          <td className="px-2 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                data-testid={`button-edit-record-${record.id}`}
                                onClick={() => openEdit(record)}
                                className="text-muted-foreground hover:text-primary transition-colors p-1"
                                title="수정"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                data-testid={`button-remove-record-${record.id}`}
                                onClick={() => removeRecord(record.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              점수 수정 — {editingRecord ? getMemberName(editingRecord.memberId) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: GAME_COUNT }, (_, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs text-center text-muted-foreground font-medium">{i + 1}G</p>
                  <Input
                    data-testid={`edit-score-game${i + 1}`}
                    type="number"
                    min={0}
                    max={300}
                    placeholder="-"
                    value={editScores[i] ?? ""}
                    onChange={(e) =>
                      setEditScores((prev) => prev.map((s, idx) => (idx === i ? e.target.value : s)))
                    }
                    className="text-center rounded-xl"
                  />
                </div>
              ))}
            </div>
            {editScores.length > 0 && (() => {
              const avg = calcAvg(editScores.map((s) => {
                const n = parseInt(s, 10);
                return s === "" || isNaN(n) ? null : n;
              }));
              return avg !== null ? (
                <p className="text-sm text-center text-muted-foreground">
                  평균: <span className="font-semibold text-blue-500">{avg}점</span>
                </p>
              ) : null;
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRecord(null)}>
              취소
            </Button>
            <Button
              data-testid="button-confirm-edit"
              onClick={handleEditSave}
              className="bg-primary text-white"
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
