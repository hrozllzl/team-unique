import { useState } from "react";
import { Calendar, Trash2, Pencil, ArrowUpDown, ArrowUp } from "lucide-react";
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

type SortType = "date-desc" | "date-asc" | "avg-desc" | "avg-asc";

export default function Games() {
  const { members, records, removeRecord, updateRecord } = useApp();
  const { toast } = useToast();
  const [filterDate, setFilterDate] = useState("");
  const [sortType, setSortType] = useState<SortType>("date-desc");
  const [editingRecord, setEditingRecord] = useState<GameRecord | null>(null);
  const [editScores, setEditScores] = useState<string[]>([]);

  const getMemberName = (id: string) =>
    members.find((m) => m.id === id)?.name ?? "알 수 없음";

  const withAvg = records.map((r) => ({ ...r, avg: calcAvg(r.scores) }));

  const filtered = withAvg
    .filter((r) => !filterDate || r.date === filterDate)
    .sort((a, b) => {
      if (sortType === "date-desc") return b.date.localeCompare(a.date);
      if (sortType === "date-asc") return a.date.localeCompare(b.date);
      if (sortType === "avg-desc") {
        if (a.avg === null && b.avg === null) return 0;
        if (a.avg === null) return 1;
        if (b.avg === null) return -1;
        return b.avg - a.avg;
      }
      if (sortType === "avg-asc") {
        if (a.avg === null && b.avg === null) return 0;
        if (a.avg === null) return 1;
        if (b.avg === null) return -1;
        return a.avg - b.avg;
      }
      return 0;
    });

  const grouped: Record<string, typeof filtered> =
    sortType === "date-desc" || sortType === "date-asc"
      ? filtered.reduce(
          (acc, r) => {
            if (!acc[r.date]) acc[r.date] = [];
            acc[r.date].push(r);
            return acc;
          },
          {} as Record<string, typeof filtered>
        )
      : {};

  const isGrouped = sortType === "date-desc" || sortType === "date-asc";

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

  const cycleSortDate = () => {
    setSortType((prev) => (prev === "date-desc" ? "date-asc" : "date-desc"));
  };
  const cycleSortAvg = () => {
    setSortType((prev) => (prev === "avg-desc" ? "avg-asc" : "avg-desc"));
  };

  const SortBtn = ({
    label,
    active,
    dir,
    onClick,
  }: {
    label: string;
    active: boolean;
    dir?: "asc" | "desc";
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
        active
          ? "bg-primary/10 border-primary/30 text-primary font-semibold"
          : "bg-white border-border text-muted-foreground hover:border-primary/30"
      }`}
    >
      {label}
      {active ? (
        <ArrowUp className={`w-3 h-3 ${dir === "desc" ? "rotate-180" : ""} transition-transform`} />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      )}
    </button>
  );

  const renderTable = (rows: typeof filtered, showDate = false) => (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-border">
          <tr>
            {showDate && (
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">날짜</th>
            )}
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
          {rows.map((record) => (
            <tr
              key={record.id}
              data-testid={`game-row-${record.id}`}
              className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors"
            >
              {showDate && (
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(record.date)}
                </td>
              )}
              <td className="px-4 py-3 font-medium">{getMemberName(record.memberId)}</td>
              {record.scores.map((score, idx) => (
                <td key={idx} className="px-3 py-3 text-center tabular-nums">
                  {score !== null ? score : <span className="text-muted-foreground">–</span>}
                </td>
              ))}
              <td className="px-3 py-3 text-center font-semibold text-blue-500 tabular-nums w-16">
                {record.avg !== null ? record.avg : (
                  <span className="text-muted-foreground font-normal">–</span>
                )}
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
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-orange-400" />
          <h1 className="text-2xl font-bold text-foreground">게임별 점수</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="text-sm border border-border rounded-xl px-3 py-1.5 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            data-testid="filter-date"
          />
          <SortBtn
            label="날짜순"
            active={sortType === "date-desc" || sortType === "date-asc"}
            dir={sortType === "date-desc" ? "desc" : "asc"}
            onClick={cycleSortDate}
          />
          <SortBtn
            label="평균순"
            active={sortType === "avg-desc" || sortType === "avg-asc"}
            dir={sortType === "avg-desc" ? "desc" : "asc"}
            onClick={cycleSortAvg}
          />
        </div>
      </div>

      <div className="border-b border-border mb-6" />

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{filterDate ? "해당 날짜의 기록이 없습니다." : "기록된 점수가 없습니다."}</p>
          <p className="text-sm mt-1">점수 입력 메뉴에서 점수를 등록해 보세요.</p>
        </div>
      ) : isGrouped ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayRecords]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                {formatDate(date)}
              </h2>
              {renderTable(dayRecords, false)}
            </div>
          ))}
        </div>
      ) : (
        renderTable(filtered, true)
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
                      setEditScores((prev) =>
                        prev.map((s, idx) => (idx === i ? e.target.value : s))
                      )
                    }
                    className="text-center rounded-xl"
                  />
                </div>
              ))}
            </div>
            {(() => {
              const nums = editScores
                .map((s) => parseInt(s, 10))
                .filter((n) => !isNaN(n) && n >= 0 && n <= 300);
              if (nums.length === 0) return null;
              const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
              const avgStr = avg % 1 === 0 ? String(avg) : avg.toFixed(1);
              return (
                <p className="text-sm text-center text-muted-foreground">
                  평균:{" "}
                  <span className="font-semibold text-blue-500 tabular-nums">{avgStr}점</span>
                </p>
              );
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
