import React from 'react';
import { BarChart2, Calendar, Users } from 'lucide-react';

export function VariantA() {
  const menus = [
    {
      icon: BarChart2,
      label: '전체 통계 점수',
      from: 'from-violet-500',
      to: 'to-fuchsia-600',
      shadow: 'shadow-violet-200',
      hoverShadow: 'hover:shadow-violet-300',
    },
    {
      icon: Calendar,
      label: '게임별 점수',
      from: 'from-orange-400',
      to: 'to-rose-500',
      shadow: 'shadow-orange-200',
      hoverShadow: 'hover:shadow-orange-300',
    },
    {
      icon: Users,
      label: '회원 목록',
      from: 'from-blue-500',
      to: 'to-cyan-400',
      shadow: 'shadow-blue-200',
      hoverShadow: 'hover:shadow-blue-300',
    },
  ];

  return (
    <div className="mx-auto max-w-sm p-4 min-h-[100dvh] bg-neutral-50 font-sans">
      <div className="mb-6 mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">팀 유니크</h1>
        <p className="text-neutral-500 mt-1 font-medium">오늘도 즐거운 볼링! 🎳</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {menus.map((menu) => {
          const Icon = menu.icon;
          return (
            <button
              key={menu.label}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${menu.from} ${menu.to} shadow-lg ${menu.shadow} transition-all hover:-translate-y-1 hover:shadow-xl ${menu.hoverShadow} active:translate-y-0 active:shadow-md flex flex-col items-center justify-center gap-3 py-5 px-2`}
            >
              <div className="absolute inset-0 bg-white opacity-0 transition-opacity group-hover:opacity-10 pointer-events-none" />
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white shadow-inner relative z-10">
                <Icon className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <p className="text-white font-bold text-xs text-center leading-tight relative z-10 px-1">
                {menu.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
