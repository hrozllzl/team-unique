import { useLocation } from "wouter";
import { Users, ClipboardEdit, BarChart2, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const adminMenus = [
  {
    path: "/members",
    icon: Users,
    label: "회원 관리",
    desc: "회원 추가 및 가입 승인",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-500",
    labelColor: "text-blue-600",
  },
  {
    path: "/score-entry",
    icon: ClipboardEdit,
    label: "점수 입력",
    desc: "날짜별 회원 점수 기록",
    bg: "bg-teal-50",
    border: "border-teal-200",
    iconColor: "text-teal-500",
    labelColor: "text-teal-600",
  },
  {
    path: "/stats",
    icon: BarChart2,
    label: "전체 통계 점수",
    desc: "회원별 평균 점수 및 순위",
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconColor: "text-purple-500",
    labelColor: "text-purple-600",
  },
  {
    path: "/games",
    icon: Calendar,
    label: "게임별 점수",
    desc: "날짜별 점수 기록 목록",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    iconColor: "text-orange-400",
    labelColor: "text-orange-500",
  },
];

const memberMenus = [
  {
    path: "/stats",
    icon: BarChart2,
    label: "전체 통계 점수",
    desc: "회원별 평균 점수 및 순위",
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconColor: "text-purple-500",
    labelColor: "text-purple-600",
  },
  {
    path: "/games",
    icon: Calendar,
    label: "게임별 점수",
    desc: "날짜별 점수 기록 목록",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    iconColor: "text-orange-400",
    labelColor: "text-orange-500",
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { role } = useAuth();
  const menus = role === "admin" ? adminMenus : memberMenus;

  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-start px-6 pt-16 pb-10">
      <h1 className="text-4xl font-bold text-primary mb-2">팀 유니크</h1>
      <p className="text-muted-foreground mb-10 text-base">메뉴를 선택하세요</p>

      <div className={`grid gap-6 w-full max-w-2xl ${menus.length === 2 ? "grid-cols-2 max-w-md" : "grid-cols-2"}`}>
        {menus.map((menu) => {
          const Icon = menu.icon;
          return (
            <button
              key={menu.path}
              onClick={() => setLocation(menu.path)}
              className={`flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 ${menu.bg} ${menu.border} hover:shadow-md transition-all duration-150 cursor-pointer`}
            >
              <Icon className={`w-12 h-12 ${menu.iconColor}`} strokeWidth={1.5} />
              <div className="text-center">
                <p className={`font-bold text-lg ${menu.labelColor}`}>{menu.label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{menu.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
