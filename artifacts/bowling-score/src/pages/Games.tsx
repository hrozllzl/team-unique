import { useState } from "react";
import { Calendar, Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function Games() {
  const { members, records, removeRecord } = useApp();
  const [filterDate, setFilterDate] = useState("");

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
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {dayRecords.map((record) => {
                      const validScores = record.scores.filter((s): s is number => s !== null);
                      const avg =
                        validScores.length > 0
                          ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
                          : null;
                      return (
                        <tr
                          key={record.id}
                          data-testid={`game-row-${record.id}`}
                          className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium">{getMemberName(record.memberId)}</td>
                          {record.scores.map((score, idx) => (
                            <td key={idx} className="px-3 py-3 text-center">
                              {score !== null ? (
                                <span className="text-foreground">{score}</span>
                              ) : (
                                <span className="text-muted-foreground">–</span>
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-3 text-center font-semibold text-blue-500">
                            {avg !== null ? avg : <span className="text-muted-foreground">–</span>}
                          </td>
                          <td className="px-2 py-3 text-right">
                            <button
                              data-testid={`button-remove-record-${record.id}`}
                              onClick={() => removeRecord(record.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
    </div>
  );
}
