import { useState } from "react";
import { Calendar, Trash2, Pencil, ArrowUp, ArrowUpDown, ChevronDown } from "lucide-react";
import { useApp, GameRecord } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
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
import { scoreColor } from "@/lib/scoreUtils";

const GAME_COUNT = 5;

function calcAvg(scores: (number | null)[]): number | null {
  const nums = scores.filter((s): s is number => s !== null);
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

type ColSort = "avg" | "name";
type SortDir = "asc" | "desc";

export default function Games() {
  const { members, records, removeRecord, updateRecord, updateRecordsDate } = useApp();
  const { role, userName } = useAuth();
  const isAdmin = role === "admin";
  const myMemberId = members.find((m) => m.name === userName)?.id ?? "";
  const { toast } = useToast();

  const [filterDate, setFilterDate] = useState("");
  const [colSort, setColSort] = useState<ColSort>("avg");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Year tabs: default to the year of the most recent record
  const allYears = [...new Set(records.map((r) => r.date.slice(0, 4)))]
    .sort((a, b) => b.localeCompare(a));
  const latestYear = allYears[0] ?? String(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState<string>(latestYear);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setFilterDate("");
    const datesInYear = [...new Set(records.map((r) => r.date))]
      .filter((d) => d.startsWith(year))
      .sort((a, b) => b.localeCompare(a));
    setExpandedDates(datesInYear.length > 0 ? new Set([datesInYear[0]]) : new Set());
  };

  // Accordion: only the most recent date starts expanded
  const [expandedDates, setExpandedDates] = useState<Set<string>>(() => {
    const dates = [...new Set(records.map((r) => r.date))].sort((a, b) =>
      b.localeCompare(a)
    );
    return dates.length > 0 ? new Set([dates[0]]) : new Set();
  });

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  // Score edit state
  const [editingRecord, setEditingRecord] = useState<GameRecord | null>(null);
  const [editScores, setEditScores] = useState<string[]>([]);

  // Date edit state
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [newDateValue, setNewDateValue] = useState("");

  // Date group delete state
  const [deletingDate, setDeletingDate] = useState<string | null>(null);

  const getMemberName = (id: string) =>
    members.find((m) => m.id === id)?.name ?? "알 수 없음";

  const activeMemberIds = new Set(members.map((m) => m.id));
  const withAvg = records
    .filter((r) => activeMemberIds.has(r.memberId))
    .map((r) => ({ ...r, avg: calcAvg(r.scores) }));
  const filtered = withAvg.filter(
    (r) =>
      r.date.startsWith(selectedYear) &&
      (!filterDate || r.date === filterDate)
  );

  const datesSorted = [...new Set(filtered.map((r) => r.date))].sort((a, b) =>
    b.localeCompare(a)
  );

  const sortRows = (rows: typeof filtered) =>
    [...rows].sort((a, b) => {
      let diff = 0;
      if (colSort === "avg") {
        if (a.avg === null && b.avg === null) diff = 0;
        else if (a.avg === null) diff = 1;
        else if (b.avg === null) diff = -1;
        else diff = b.avg - a.avg;
      } else {
        diff = getMemberName(a.memberId).localeCompare(getMemberName(b.memberId), "ko");
      }
      return sortDir === "desc" ? diff : -diff;
    });

  const grouped = datesSorted.reduce(
    (acc, date) => {
      acc[date] = sortRows(filtered.filter((r) => r.date === date));
      return acc;
    },
    {} as Record<string, typeof filtered>
  );

  const visibleCountByDate: Record<string, number> = {};
  for (const date of datesSorted) {
    visibleCountByDate[date] = grouped[date].reduce((max, record) => {
      for (let i = record.scores.length - 1; i >= 0; i--) {
        if (record.scores[i] !== null) return Math.max(max, i + 1);
      }
      return max;
    }, 1);
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  // Score editing
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

  // Date editing
  const openDateEdit = (date: string) => {
    setEditingDate(date);
    setNewDateValue(date);
  };

  const handleDateSave = () => {
    if (!editingDate || !newDateValue) return;
    if (editingDate === newDateValue) { setEditingDate(null); return; }
    updateRecordsDate(editingDate, newDateValue);
    setEditingDate(null);
    toast({ title: "날짜가 수정되었습니다!" });
  };

  const editAvg = (() => {
    const nums = editScores
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n >= 0 && n <= 300);
    if (nums.length === 0) return null;
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return avg % 1 === 0 ? String(avg) : avg.toFixed(1);
  })();

  const handleColSort = (col: ColSort) => {
    if (colSort === col) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setColSort(col); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: ColSort }) => {
    if (colSort !== col) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40 inline" />;
    return (
      <ArrowUp
        className={`w-3.5 h-3.5 ml-1 text-primary inline transition-transform ${sortDir === "asc" ? "rotate-180" : ""}`}
      />
    );
  };

  const rankBadge = (rank: number) => {
    if (rank === 0) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-white text-xs font-bold">1</span>;
    if (rank === 1) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-300 text-white text-xs font-bold">2</span>;
    if (rank === 2) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-300 text-white text-xs font-bold">3</span>;
    return <span className="text-muted-foreground text-xs">{rank + 1}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
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

      {allYears.length > 1 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {allYears.map((year) => (
            <button
              key={year}
              onClick={() => handleYearChange(year)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedYear === year
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              {year}년
            </button>
          ))}
        </div>
      )}

      <div className="border-b border-border mb-6" />

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{filterDate ? "해당 날짜의 기록이 없습니다." : "기록된 점수가 없습니다."}</p>
          <p className="text-sm mt-1">점수 입력 메뉴에서 점수를 등록해 보세요.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {datesSorted.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => toggleDate(date)}
                  className="flex items-center gap-1.5 group"
                >
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      expandedDates.has(date) ? "" : "-rotate-90"
                    }`}
                  />
                  <h2 className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                    {formatDate(date)}
                  </h2>
                </button>
                <span className="text-xs text-muted-foreground">({grouped[date].length}명)</span>
                {isAdmin && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); openDateEdit(date); }}
                      className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                      title="날짜 수정"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingDate(date); }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                      title="날짜 전체 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
              {expandedDates.has(date) && (
              <div className="bg-white border border-border rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-10">
                        <button onClick={() => handleColSort("avg")} className="flex items-center mx-auto">
                          순위 <SortIcon col="avg" />
                        </button>
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                        <button onClick={() => handleColSort("name")} className="flex items-center">
                          이름 <SortIcon col="name" />
                        </button>
                      </th>
                      {Array.from({ length: visibleCountByDate[date] }, (_, i) => (
                        <th key={i} className="text-center px-2 py-2.5 font-medium text-muted-foreground">
                          {i + 1}G
                        </th>
                      ))}
                      <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">
                        <button onClick={() => handleColSort("avg")} className="flex items-center mx-auto">
                          평균 <SortIcon col="avg" />
                        </button>
                      </th>
                      {isAdmin && <th className="w-20 px-2 py-2.5" />}
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[date].map((record, rank) => {
                      const isMe = myMemberId && record.memberId === myMemberId;
                      return (
                      <tr
                        key={record.id}
                        data-testid={`game-row-${record.id}`}
                        className={`border-b border-border last:border-0 transition-colors ${isMe ? "bg-blue-50" : "hover:bg-gray-50"}`}
                      >
                        <td className="px-3 py-3 text-center">
                          {colSort === "avg" ? rankBadge(rank) : (
                            <span className="text-muted-foreground text-xs">–</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <span className="flex items-center gap-1.5 flex-nowrap min-w-0">
                            <span className="truncate">{getMemberName(record.memberId)}</span>
                            {isMe && <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-xs font-bold leading-none">나</span>}
                          </span>
                        </td>
                        {record.scores.slice(0, visibleCountByDate[date]).map((score, idx) => (
                          <td key={idx} className="px-2 py-3 text-center tabular-nums">
                            {score !== null ? (
                              <span className={scoreColor(score) || "text-foreground"}>{score}</span>
                            ) : (
                              <span className="text-muted-foreground">–</span>
                            )}
                          </td>
                        ))}
                        <td className={`px-3 py-3 text-center font-semibold tabular-nums w-16 ${record.avg !== null ? (scoreColor(record.avg) || "text-blue-500") : ""}`}>
                          {record.avg !== null ? record.avg : (
                            <span className="text-muted-foreground font-normal">–</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-2 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                data-testid={`button-edit-record-${record.id}`}
                                onClick={() => openEdit(record)}
                                className="text-muted-foreground hover:text-primary transition-colors p-1"
                                title="점수 수정"
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
                        )}
                      </tr>
                    ); })}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 점수 수정 모달 */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              점수 수정 — {editingRecord ? getMemberName(editingRecord.memberId) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="grid grid-cols-5 gap-1.5">
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
                    className="text-center rounded-xl px-1"
                  />
                </div>
              ))}
            </div>
            {editAvg !== null && (
              <p className="text-sm text-center text-muted-foreground">
                평균:{" "}
                <span className={`font-semibold tabular-nums ${scoreColor(Number(editAvg)) || "text-blue-500"}`}>
                  {editAvg}점
                </span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRecord(null)}>취소</Button>
            <Button data-testid="button-confirm-edit" onClick={handleEditSave} className="bg-primary text-white">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 날짜 수정 모달 */}
      <Dialog open={!!editingDate} onOpenChange={(open) => !open && setEditingDate(null)}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>날짜 수정</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="date"
              value={newDateValue}
              onChange={(e) => setNewDateValue(e.target.value)}
              className="rounded-xl"
              data-testid="input-edit-date"
            />
            <p className="text-xs text-muted-foreground mt-2">
              해당 날짜의 모든 기록이 새 날짜로 이동합니다.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDate(null)}>취소</Button>
            <Button onClick={handleDateSave} className="bg-primary text-white">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 날짜 일괄 삭제 확인 모달 */}
      <Dialog open={!!deletingDate} onOpenChange={(open) => !open && setDeletingDate(null)}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>날짜 기록 전체 삭제</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-foreground">
              <strong>{deletingDate ? formatDate(deletingDate) : ""}</strong>의 기록을 모두 삭제할까요?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {deletingDate ? (grouped[deletingDate]?.length ?? 0) : 0}명의 점수가 삭제되며 되돌릴 수 없습니다.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDate(null)}>취소</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deletingDate) return;
                const ids = grouped[deletingDate]?.map((r) => r.id) ?? [];
                ids.forEach((id) => removeRecord(id));
                setDeletingDate(null);
                toast({ title: `${ids.length}건의 기록이 삭제되었습니다.` });
              }}
            >
              전체 삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
