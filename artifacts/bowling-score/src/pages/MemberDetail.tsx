import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useApp } from "@/context/AppContext";

function calcAvg(scores: (number | null)[]): number | null {
  const nums = scores.filter((s): s is number => s !== null);
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export default function MemberDetail({ id }: { id: string }) {
  const { members, records } = useApp();
  const [, setLocation] = useLocation();

  const member = members.find((m) => m.id === id);
  if (!member) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-muted-foreground">
        회원을 찾을 수 없습니다.
      </div>
    );
  }

  const memberRecords = records
    .filter((r) => r.memberId === id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const chartData = memberRecords.map((r) => {
    const avg = calcAvg(r.scores);
    return {
      date: formatDate(r.date),
      fullDate: r.date,
      avg,
      scores: r.scores,
    };
  });

  const allScores = memberRecords.flatMap((r) =>
    r.scores.filter((s): s is number => s !== null)
  );
  const totalAvg =
    allScores.length > 0
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
      : null;
  const best = allScores.length > 0 ? Math.max(...allScores) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => setLocation("/members")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        회원 목록
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
          {member.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{member.name}</h1>
          <p className="text-sm text-muted-foreground">
            {memberRecords.length}회 참여 · 전체 평균{" "}
            <span className="text-primary font-semibold">{totalAvg ?? "-"}점</span> · 최고{" "}
            <span className="text-blue-600 font-semibold">{best ?? "-"}점</span>
          </p>
        </div>
      </div>

      <div className="border-b border-border mb-6" />

      {chartData.length >= 2 ? (
        <div className="bg-white border border-border rounded-2xl shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">평균 점수 추이</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} width={35} />
              <Tooltip
                formatter={(val: number) => [`${val}점`, "평균"]}
                labelFormatter={(label) => `날짜: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#3b82f6" }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : chartData.length === 1 ? (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 text-sm text-blue-600 text-center">
          게임 기록이 2개 이상일 때 추이 그래프가 표시됩니다.
        </div>
      ) : null}

      {memberRecords.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>아직 참여한 게임 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">날짜</th>
                {[1, 2, 3, 4].map((g) => (
                  <th key={g} className="text-center px-3 py-2.5 font-medium text-muted-foreground">
                    {g}G
                  </th>
                ))}
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">평균</th>
              </tr>
            </thead>
            <tbody>
              {[...memberRecords].reverse().map((record) => {
                const avg = calcAvg(record.scores);
                const d = new Date(record.date + "T00:00:00");
                const dateLabel = `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
                return (
                  <tr
                    key={record.id}
                    className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground text-xs">{dateLabel}</td>
                    {record.scores.map((score, idx) => (
                      <td key={idx} className="px-3 py-3 text-center">
                        {score !== null ? score : <span className="text-muted-foreground">–</span>}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center font-semibold text-blue-500 tabular-nums w-16">
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
