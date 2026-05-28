import React from 'react';
import { BarChart2, Calendar, Users, ChevronRight } from 'lucide-react';

export function VariantA() {
  return (
    <div className="mx-auto max-w-sm p-4 min-h-[100dvh] bg-neutral-50 font-sans">
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">팀 유니크</h1>
        <p className="text-neutral-500 mt-1 font-medium">오늘도 즐거운 볼링! 🎳</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Stats Card */}
        <button className="w-full text-left group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-4 shadow-lg shadow-violet-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-300 active:translate-y-0 active:shadow-md">
          <div className="absolute inset-0 bg-white opacity-0 transition-opacity group-hover:opacity-10 pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white shadow-inner">
              <BarChart2 className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">전체 통계 점수</h2>
              <p className="text-violet-100 text-sm font-medium">내 애버리지와 기록 분석</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-transform group-hover:translate-x-1">
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        </button>

        {/* Games Card */}
        <button className="w-full text-left group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 p-4 shadow-lg shadow-orange-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-300 active:translate-y-0 active:shadow-md">
          <div className="absolute inset-0 bg-white opacity-0 transition-opacity group-hover:opacity-10 pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white shadow-inner">
              <Calendar className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">게임별 점수</h2>
              <p className="text-orange-100 text-sm font-medium">날짜별 게임 결과 확인</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-transform group-hover:translate-x-1">
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        </button>

        {/* Member List Card */}
        <button className="w-full text-left group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 p-4 shadow-lg shadow-blue-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-300 active:translate-y-0 active:shadow-md">
          <div className="absolute inset-0 bg-white opacity-0 transition-opacity group-hover:opacity-10 pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white shadow-inner">
              <Users className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">회원 목록</h2>
              <p className="text-blue-50 text-sm font-medium">우리 팀원 정보 보기</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-transform group-hover:translate-x-1">
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
