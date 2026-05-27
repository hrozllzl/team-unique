import { useState } from "react";
import { BarChart2, ArrowUp, ArrowUpDown } from "lucide-react";
import { useApp } from "@/context/AppContext";

type SortKey = "rank" | "avg" | "best";
type SortDir = "asc" | "desc";

function getMemberStats(memberId: string, records: ReturnType<typeof useApp>["records"]) {
  const memberRecords = records.filter((r) => r.memberId === memberId);
  const allScores = memberRecords.flatMap((r) => r.scores.filter((s): s is number => s !== null));
  const gameCount = allScores.length;
  const avg = gameCount > 0 ? Math.round((allScores.reduce((a, b) => a + b, 0) / gameCount) * 10) / 10 : null;
  const best = gameCount > 0 ? Math.max(...allScores) : null;
  return { gameCount, avg, best };
}

export default function Stats() {
  const { members, records } = useApp();
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const withStats = members.map((m) => ({ ...m, ...getMemberStats(m.id, records) }));

  const sorted = [...withStats].sort((a, b) => {
    let diff = 0;
    if (sortKey === "avg") {
      if (a.avg === null && b.avg === null) diff = 0;
      else if (a.avg === null) diff = 1;
      else if (b.avg === null) diff = -1;
      else diff = b.avg - a.avg;
    } else if (sortKey === "best") {
      if (a.best === null && b.best === null) diff = 0;
      else if (a.best === null) diff = 1;
      else if (b.best === null) diff = -1;
      else diff = b.best - a.best;
    } else {
      if (a.avg === null && b.avg === null) diff = 0;
      else if (a.avg === null) diff = 1;
      else if (b.avg === null) diff = -1;
      else diff = b.avg - a.avg;
    }
    return sortDir === "asc" ? diff : -diff;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const rankBadge = (rank: number) => {
    if (rank === 1) return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-white text-xs font-bold">1</span>
    );
    if (rank === 2) return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-300 text-white text-xs font-bold">2</span>
    );
    if (rank === 3) return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-300 text-white text-xs font-bold">3</span>
    );
    return <span className="inline-flex items-center justify-center w-7 h-7 text-muted-foreground text-sm">{rank}</span>;
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />;
    return <ArrowUp className={`w-3.5 h-3.5 ml-1 text-primary transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`} />;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 className="w-6 h-6 text-purple-500" />
        <h1 className="text-2xl font-bold text-foreground">전체 통계 점수</h1>
      </div>

      <div className="border-b border-border mb-4" />

      {members.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>등록된 회원이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-16">
                  <button onClick={() => handleSort("rank")} className="flex items-center">
                    순위 <ArrowUp className={`w-3.5 h-3.5 ml-1 ${sortKey === "rank" ? "text-primary" : "opacity-40"} transition-transform ${sortKey === "rank" && sortDir === "desc" ? "rotate-180" : ""}`} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">이름</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                  <button onClick={() => handleSort("avg")} className="flex items-center mx-auto">
                    평균 점수 <SortIcon k="avg" />
                  </button>
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                  <button onClick={() => handleSort("best")} className="flex items-center mx-auto">
                    최고 점수 <SortIcon k="best" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  참여 게임 <ArrowUpDown className="w-3.5 h-3.5 ml-1 inline opacity-40" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((member, idx) => (
                <tr
                  key={member.id}
                  data-testid={`stats-row-${member.id}`}
                  className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3.5">{rankBadge(idx + 1)}</td>
                  <td className="px-4 py-3.5 font-medium">{member.name}</td>
                  <td className="px-4 py-3.5 text-center">
                    {member.avg !== null ? (
                      <span className="text-blue-500 font-semibold">{member.avg}</span>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {member.best !== null ? (
                      <span className="font-medium">{member.best}</span>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right text-muted-foreground">
                    {member.gameCount}게임
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
