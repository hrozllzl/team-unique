import { useState } from "react";
import { BarChart2, ArrowUp, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line,
} from "recharts";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { scoreColor, calcAvg } from "@/lib/scoreUtils";

type SortKey = "rank" | "avg" | "best";
type SortDir = "asc" | "desc";

function getMemberStats(memberId: string, records: ReturnType<typeof useApp>["records"]) {
  const memberRecords = records.filter((r) => r.memberId === memberId);
  const allScores = memberRecords.flatMap((r) =>
    r.scores.filter((s): s is number => s !== null)
  );
  const gameCount = allScores.length;
  const avg =
    gameCount > 0
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / gameCount) * 10) / 10
      : null;
  const best = gameCount > 0 ? Math.max(...allScores) : null;
  return { gameCount, avg, best };
}

const BAR_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

function MemberDetailPanel({ memberId }: { memberId: string }) {
  const { members, records } = useApp();
  const member = members.find((m) => m.id === memberId);
  if (!member) return null;

  const memberRecords = records
    .filter((r) => r.memberId === memberId)
    .sort((a, b) => a.date.localeCompare(b.date));

  const chartData = memberRecords.map((r) => ({
    date: formatDateShort(r.date),
    avg: calcAvg(r.scores),
  }));

  const allScores = memberRecords.flatMap((r) =>
    r.scores.filter((s): s is number => s !== null)
  );
  const totalAvg = allScores.length > 0
    ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
    : null;
  const best = allScores.length > 0 ? Math.max(...allScores) : null;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
          {member.name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-foreground">{member.name}님의 상세 기록</p>
          <p className="text-xs text-muted-foreground">
            {memberRecords.length}회 참여 · 평균{" "}
            <span className={`font-semibold ${totalAvg !== null ? (scoreColor(totalAvg) || "text-blue-500") : ""}`}>
              {totalAvg ?? "-"}점
            </span>
            {" "}· 최고{" "}
            <span className={`font-semibold ${best !== null ? (scoreColor(best) || "text-blue-600") : ""}`}>
              {best ?? "-"}점
            </span>
          </p>
        </div>
      </div>

      {chartData.length >= 2 ? (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">평균 점수 추이</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} width={32} />
              <Tooltip
                formatter={(val: number) => [`${val}점`, "평균"]}
                labelFormatter={(label) => `날짜: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: "#3b82f6" }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : chartData.length === 1 ? (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-blue-600 text-center">
          게임 기록이 2개 이상일 때 추이 그래프가 표시됩니다.
        </div>
      ) : null}

      {memberRecords.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">아직 참여한 게임 기록이 없습니다.</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-24" />
              <col /><col /><col /><col /><col />
              <col className="w-12" />
            </colgroup>
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-2 py-2 font-medium text-muted-foreground">날짜</th>
                {[1, 2, 3, 4, 5].map((g) => (
                  <th key={g} className="text-center px-1 py-2 font-medium text-muted-foreground">{g}G</th>
                ))}
                <th className="text-center px-1 py-2 font-medium text-muted-foreground">평균</th>
              </tr>
            </thead>
            <tbody>
              {[...memberRecords].reverse().map((record) => {
                const avg = calcAvg(record.scores);
                return (
                  <tr key={record.id} className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-2.5 text-muted-foreground text-xs whitespace-nowrap">{formatDateFull(record.date)}</td>
                    {record.scores.map((score, idx) => (
                      <td key={idx} className="px-1 py-2.5 text-center">
                        {score !== null ? (
                          <span className={scoreColor(score) || "text-foreground"}>{score}</span>
                        ) : <span className="text-muted-foreground">–</span>}
                      </td>
                    ))}
                    <td className={`px-2 py-2.5 text-center font-semibold tabular-nums ${avg !== null ? (scoreColor(avg) || "text-blue-500") : ""}`}>
                      {avg !== null ? avg : <span className="text-muted-foreground font-normal">–</span>}
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

export default function Stats() {
  const { members, records } = useApp();
  const { userName } = useAuth();
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const myMemberId = members.find((m) => m.name === userName)?.id ?? "";

  const withStats = members.map((m) => ({ ...m, ...getMemberStats(m.id, records) }));

  const sorted = [...withStats].sort((a, b) => {
    let diff = 0;
    if (sortKey === "avg" || sortKey === "rank") {
      if (a.avg === null && b.avg === null) diff = 0;
      else if (a.avg === null) diff = 1;
      else if (b.avg === null) diff = -1;
      else diff = b.avg - a.avg;
    } else if (sortKey === "best") {
      if (a.best === null && b.best === null) diff = 0;
      else if (a.best === null) diff = 1;
      else if (b.best === null) diff = -1;
      else diff = b.best - a.best;
    }
    return sortDir === "asc" ? diff : -diff;
  });

  const chartData = sorted
    .filter((m) => m.avg !== null)
    .map((m, i) => ({ name: m.name, avg: m.avg as number, colorIdx: i }));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const toggleMember = (id: string) => {
    setSelectedMemberId((prev) => (prev === id ? null : id));
  };

  const rankBadge = (rank: number) => {
    if (rank === 1)
      return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-white text-xs font-bold">1</span>;
    if (rank === 2)
      return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-300 text-white text-xs font-bold">2</span>;
    if (rank === 3)
      return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-300 text-white text-xs font-bold">3</span>;
    return <span className="inline-flex items-center justify-center w-7 h-7 text-muted-foreground text-sm">{rank}</span>;
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40 inline" />;
    return (
      <ArrowUp
        className={`w-3.5 h-3.5 ml-1 text-primary inline transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`}
      />
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">전체 통계 점수</h1>
      </div>

      <div className="border-b border-border mb-6" />

      {members.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>등록된 회원이 없습니다.</p>
        </div>
      ) : (
        <>
          {chartData.length > 0 && (
            <div className="bg-white border border-border rounded-2xl shadow-sm p-5 mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4">회원별 평균 점수</h2>
              <div className="overflow-x-auto">
              <div style={{ minWidth: chartData.length * 40 }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 28, right: 10, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={55}
                  />
                  <YAxis
                    domain={[0, 300]}
                    tick={{ fontSize: 12 }}
                    width={35}
                  />
                  <Tooltip
                    formatter={(val: number) => [`${val}점`, "평균"]}
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  />
                  <Bar
                    dataKey="avg"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                    background={(props: { x?: number; y?: number; width?: number; height?: number; name?: string }) => {
                      if (props.name !== userName) return <g />;
                      return (
                        <rect
                          x={(props.x ?? 0) - 6}
                          y={props.y ?? 0}
                          width={(props.width ?? 0) + 12}
                          height={props.height ?? 0}
                          fill="#e0f2fe"
                          rx={6}
                        />
                      );
                    }}
                    label={(props: { x?: number; y?: number; width?: number; value?: number; index?: number }) => {
                      const idx = props.index ?? 0;
                      if (chartData[idx]?.name !== userName) return <g />;
                      const cx = (props.x ?? 0) + (props.width ?? 0) / 2;
                      const cy = (props.y ?? 0) - 7;
                      return (
                        <text x={cx} y={cy} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#0284c7">
                          ▼
                        </text>
                      );
                    }}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.name === userName ? "#3b82f6" : "#d1d5db"}
                        fillOpacity={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
            <p className="text-xs text-muted-foreground px-4 pt-3 pb-1">회원 이름을 클릭하면 상세 기록을 볼 수 있어요</p>
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-14" />
                <col />
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-16" />
              </colgroup>
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    <button onClick={() => handleSort("rank")} className="flex items-center">
                      순위
                      <ArrowUp
                        className={`w-3.5 h-3.5 ml-1 inline transition-transform ${
                          sortKey === "rank" ? "text-primary" : "opacity-40"
                        } ${sortKey === "rank" && sortDir === "desc" ? "rotate-180" : ""}`}
                      />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">이름</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                    <button onClick={() => handleSort("avg")} className="flex items-center mx-auto">
                      평균 <SortIcon k="avg" />
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                    <button onClick={() => handleSort("best")} className="flex items-center mx-auto">
                      최고 <SortIcon k="best" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                    참여
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((member, idx) => (
                  <>
                    <tr
                      key={member.id}
                      data-testid={`stats-row-${member.id}`}
                      className={`border-b border-border transition-colors cursor-pointer ${member.id === myMemberId ? "bg-blue-50" : selectedMemberId === member.id ? "bg-gray-50" : "hover:bg-gray-50"} ${selectedMemberId === member.id ? "" : "last:border-0"}`}
                      onClick={() => toggleMember(member.id)}
                    >
                      <td className="px-4 py-3.5">{rankBadge(idx + 1)}</td>
                      <td className="px-4 py-3.5 font-medium">
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          {member.id === myMemberId && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-xs font-bold leading-none">나</span>
                          )}
                          {member.name}
                          {selectedMemberId === member.id
                            ? <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
                            : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center tabular-nums">
                        {member.avg !== null ? (
                          <span className={`font-semibold tabular-nums ${scoreColor(member.avg) || "text-blue-500"}`}>{member.avg}</span>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center tabular-nums">
                        {member.best !== null ? (
                          <span className={`font-medium tabular-nums ${scoreColor(member.best)}`}>{member.best}</span>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right text-muted-foreground">
                        {member.gameCount}
                      </td>
                    </tr>
                    {selectedMemberId === member.id && (
                      <tr key={`${member.id}-detail`} className="border-b border-border last:border-0 bg-white">
                        <td colSpan={5} className="px-4 pb-5">
                          <MemberDetailPanel memberId={member.id} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
