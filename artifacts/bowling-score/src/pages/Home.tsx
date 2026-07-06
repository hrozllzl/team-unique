import { useLocation } from "wouter";

import { Users, ClipboardEdit, BarChart2, Calendar, Shuffle, TrendingUp } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { scoreColor, calcAvg } from "@/lib/scoreUtils";

const adminMenuGroups = [
  {
    title: "관리자 메뉴",
    items: [
      { path: "/members", icon: Users, label: "회원 관리" },
      { path: "/score-entry", icon: ClipboardEdit, label: "점수 입력" },
    ],
  },
  {
    title: "점수 관리",
    items: [
      { path: "/stats", icon: BarChart2, label: "전체 통계 점수" },
      { path: "/games", icon: Calendar, label: "게임별 점수" },
      { path: "/score-comparison", icon: TrendingUp, label: "점수 비교" },
    ],
  },
  {
    title: "부가 기능",
    items: [
      { path: "/team-builder", icon: Shuffle, label: "팀 짜기" },
    ],
  },
];

const memberMenus = [
  {
    path: "/stats",
    icon: BarChart2,
    label: "전체통계점수",
  },
  {
    path: "/games",
    icon: Calendar,
    label: "게임 기록",
  },
  {
    path: "/member-list",
    icon: Users,
    label: "회원 목록",
  },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

function MemberPersonalStats({ userName }: { userName: string }) {
  const { members, records } = useApp();
  const member = members.find((m) => m.name === userName);

  if (!member) {
    return (
      <div className="w-full max-w-2xl bg-white border border-border rounded-2xl shadow-sm px-5 py-6 mb-8 text-center text-muted-foreground text-sm">
        회원 정보를 찾을 수 없습니다. 관리자에게 문의하세요.
      </div>
    );
  }

  const memberRecords = records
    .filter((r) => r.memberId === member.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const visibleCount = memberRecords.reduce((max, record) => {
    for (let i = record.scores.length - 1; i >= 0; i--) {
      if (record.scores[i] !== null) return Math.max(max, i + 1);
    }
    return max;
  }, 1);

  const chartData = memberRecords.map((r) => ({
    date: formatDate(r.date),
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
    <div className="w-full max-w-2xl mb-8">
      <div className="bg-white border border-border rounded-2xl shadow-sm px-5 py-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
            {member.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{member.name}님의 평균 점수</h2>
            <p className="text-sm text-muted-foreground">
              {memberRecords.length}회 참여 ·{" "}
              평균{" "}
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
          <>
            <p className="text-xs font-semibold text-muted-foreground mb-3">평균 점수 추이</p>
            <ResponsiveContainer width="100%" height={180}>
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
                  dot={{ r: 4, fill: "#3b82f6" }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : chartData.length === 1 ? (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-600 text-center">
            게임 기록이 2개 이상일 때 추이 그래프가 표시됩니다.
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">아직 참여한 게임 기록이 없습니다.</div>
        )}
      </div>

      {memberRecords.length > 0 && (
        <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-gray-50">
            <p className="text-xs font-semibold text-muted-foreground">점수 기록</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">날짜</th>
                {Array.from({ length: visibleCount }, (_, i) => (
                  <th key={i} className="text-center px-2 py-2.5 font-medium text-muted-foreground">{i + 1}G</th>
                ))}
                <th className="text-center px-2 py-2.5 font-medium text-muted-foreground">평균</th>
              </tr>
            </thead>
            <tbody>
              {[...memberRecords].reverse().map((record) => {
                const avg = calcAvg(record.scores);
                return (
                  <tr key={record.id} className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateFull(record.date)}</td>
                    {record.scores.slice(0, visibleCount).map((score, idx) => (
                      <td key={idx} className="px-2 py-3 text-center">
                        {score !== null ? (
                          <span className={scoreColor(score) || "text-foreground"}>{score}</span>
                        ) : <span className="text-muted-foreground">–</span>}
                      </td>
                    ))}
                    <td className={`px-2 py-3 text-center font-semibold tabular-nums ${avg !== null ? (scoreColor(avg) || "text-blue-500") : ""}`}>
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

export default function Home() {
  const [, setLocation] = useLocation();
  const { role, userName } = useAuth();
  const { userAccounts } = useApp();
  const menus = memberMenus;
  const isMember = role === "member";
  const pendingCount = userAccounts.filter((u) => u.status === "pending").length;

  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-start px-6 pt-10 pb-10">
      {!isMember && (
        <div className="w-full max-w-2xl mb-8 rounded-2xl bg-white border border-gray-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
          <span className="text-gray-800 font-medium">관리자님 안녕하세요</span>
          {pendingCount > 0 ? (
            <button
              onClick={() => setLocation("/members")}
              className="text-sm text-blue-500 font-semibold hover:underline text-left sm:text-right"
            >
              새로운 가입 요청이 {pendingCount}건 있습니다
            </button>
          ) : (
            <span className="text-sm text-gray-400">새로운 가입 요청이 없습니다</span>
          )}
        </div>
      )}

      {isMember ? (
        <>
          {/* 회원: 컴팩트 메뉴 3개 가로 배치 */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-2xl mb-8">
            {menus.map((menu) => {
              const Icon = menu.icon;
              return (
                <button
                  key={menu.path}
                  onClick={() => setLocation(menu.path)}
                  className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-white border border-gray-200 active:scale-95 transition-all duration-100 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-blue-500" strokeWidth={1.8} />
                  </div>
                  <p className="text-xs font-semibold text-center leading-tight text-gray-900">{menu.label}</p>
                </button>
              );
            })}
          </div>
          <MemberPersonalStats userName={userName} />
        </>
      ) : (
        <div className="w-full max-w-2xl flex flex-col gap-8">
          {adminMenuGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-base font-bold text-gray-900 mb-3">{group.title}</h3>
              <div className="flex flex-wrap gap-4">
                {group.items.map((menu) => {
                  const Icon = menu.icon;
                  return (
                    <button
                      key={menu.path}
                      onClick={() => setLocation(menu.path)}
                      className="w-[10.5rem] h-[10.5rem] flex flex-col items-center justify-center gap-3 rounded-2xl bg-white border border-gray-200 active:scale-95 transition-all duration-100 cursor-pointer"
                    >
                      <div className="w-[5.25rem] h-[5.25rem] rounded-xl bg-sky-100 flex items-center justify-center">
                        <Icon className="w-[1.125rem] h-[1.125rem] text-blue-500" strokeWidth={1.8} />
                      </div>
                      <p className="text-base font-semibold text-center leading-tight text-gray-900">{menu.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
