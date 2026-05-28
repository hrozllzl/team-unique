import React from 'react';
import { BarChart2, Calendar, Users } from 'lucide-react';

export function VariantC() {
  return (
    <div className="w-full max-w-sm mx-auto bg-zinc-950 min-h-[400px] flex flex-col p-6 rounded-3xl overflow-hidden relative font-sans text-white border border-zinc-800 shadow-2xl">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />
      
      {/* Header */}
      <div className="relative z-10 flex flex-col items-center mt-8 mb-12">
        <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white mb-3" style={{ textShadow: '0 2px 10px rgba(255,255,255,0.3)' }}>
          팀 유니크
        </h1>
        <div 
          className="h-1.5 w-20 bg-white rounded-full"
          style={{
            boxShadow: '0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(255,255,255,0.4)'
          }}
        />
      </div>

      {/* Menu Grid */}
      <div className="relative z-10 grid grid-cols-3 gap-3 mt-auto mb-4">
        
        {/* Item 1: Stats (Purple) */}
        <button 
          className="flex flex-col items-center justify-center gap-4 py-8 px-2 rounded-2xl bg-zinc-900/80 border-2 backdrop-blur-md transition-all active:scale-95 hover:bg-zinc-800"
          style={{
            borderColor: 'rgba(168,85,247,0.6)',
            boxShadow: '0 0 20px rgba(168,85,247,0.25), inset 0 0 15px rgba(168,85,247,0.15)'
          }}
        >
          <BarChart2 className="w-9 h-9" style={{ color: '#d8b4fe', filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.9))' }} />
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-black tracking-tight whitespace-nowrap" style={{ color: '#f3e8ff', textShadow: '0 0 12px rgba(168,85,247,0.6)' }}>
              전체 통계
            </span>
          </div>
        </button>

        {/* Item 2: Games (Orange) */}
        <button 
          className="flex flex-col items-center justify-center gap-4 py-8 px-2 rounded-2xl bg-zinc-900/80 border-2 backdrop-blur-md transition-all active:scale-95 hover:bg-zinc-800"
          style={{
            borderColor: 'rgba(249,115,22,0.6)',
            boxShadow: '0 0 20px rgba(249,115,22,0.25), inset 0 0 15px rgba(249,115,22,0.15)'
          }}
        >
          <Calendar className="w-9 h-9" style={{ color: '#fdba74', filter: 'drop-shadow(0 0 10px rgba(249,115,22,0.9))' }} />
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-black tracking-tight whitespace-nowrap" style={{ color: '#ffedd5', textShadow: '0 0 12px rgba(249,115,22,0.6)' }}>
              게임별
            </span>
          </div>
        </button>

        {/* Item 3: Members (Cyan) */}
        <button 
          className="flex flex-col items-center justify-center gap-4 py-8 px-2 rounded-2xl bg-zinc-900/80 border-2 backdrop-blur-md transition-all active:scale-95 hover:bg-zinc-800"
          style={{
            borderColor: 'rgba(6,182,212,0.6)',
            boxShadow: '0 0 20px rgba(6,182,212,0.25), inset 0 0 15px rgba(6,182,212,0.15)'
          }}
        >
          <Users className="w-9 h-9" style={{ color: '#67e8f9', filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.9))' }} />
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-black tracking-tight whitespace-nowrap" style={{ color: '#cffafe', textShadow: '0 0 12px rgba(6,182,212,0.6)' }}>
              회원 목록
            </span>
          </div>
        </button>

      </div>
    </div>
  );
}
