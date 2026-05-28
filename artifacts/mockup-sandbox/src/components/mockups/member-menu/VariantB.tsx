import React from "react";
import { BarChart2, Calendar, Users } from "lucide-react";

export function VariantB() {
  const menuItems = [
    {
      icon: <BarChart2 className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />,
      label: "전체 통계 점수",
    },
    {
      icon: <Calendar className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />,
      label: "게임별 점수",
    },
    {
      icon: <Users className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />,
      label: "회원 목록",
    },
  ];

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-neutral-900 p-4">
      <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-blue-500 to-teal-400 shadow-2xl min-h-[600px] flex flex-col">
        {/* Bokeh effects */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-fuchsia-500 rounded-full mix-blend-screen filter blur-[60px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-cyan-400 rounded-full mix-blend-screen filter blur-[60px] opacity-60"></div>
        <div className="absolute top-[40%] left-[20%] w-48 h-48 bg-blue-400 rounded-full mix-blend-screen filter blur-[50px] opacity-40"></div>

        <div className="relative z-10 flex flex-col flex-1 p-8">
          <header className="mb-12 mt-8 text-center">
            <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-md">
              팀 유니크
            </h1>
            <p className="text-white/80 mt-2 font-medium">볼링 클럽</p>
          </header>

          <div className="grid grid-cols-3 gap-4 mt-auto mb-12">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className="flex flex-col items-center justify-center p-4 aspect-[3/4] rounded-2xl bg-white/10 border border-white/20 transition-transform active:scale-95 group hover:bg-white/15"
                style={{
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                }}
              >
                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <span className="text-xs font-semibold text-white text-center leading-tight break-keep">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
