import React from 'react';
import { RobotStatus } from '../types';
import { Activity, Radio, Cpu, Power, Zap } from 'lucide-react';

interface HeaderProps {
  status: RobotStatus;
  onToggleOnline: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, onToggleOnline }) => {
  // Format uptime: e.g. 15155s -> 04:12:35
  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    if (!status.online) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          오프라인
        </span>
      );
    }

    switch (status.status) {
      case 'speaking':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 animate-pulse">
            <Activity className="w-3 h-3 text-cyan-400 animate-spin" />
            대화 중
          </span>
        );
      case 'intervening':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-500/30 animate-bounce">
            <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
            선제 개입 중
          </span>
        );
      case 'idle':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            대기 중
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: Device Name & Online Indicator Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleOnline}
            title={status.online ? '클릭하여 오프라인으로 전환' : '클릭하여 온라인으로 연결'}
            className="flex items-center gap-2 px-2 py-1 -ml-1 rounded-lg hover:bg-zinc-800/70 active:scale-95 transition-all text-left group"
          >
            <span className="relative flex h-2.5 w-2.5">
              {status.online && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  status.online ? 'bg-emerald-500' : 'bg-zinc-600'
                }`}
              ></span>
            </span>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-zinc-100 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                  {status.deviceName}
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 px-1 py-0.2 bg-zinc-800/80 rounded">
                  v2.1
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Right: State & Cumulative Uptime */}
        <div className="flex items-center gap-2">
          {getStatusBadge()}

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950/70 border border-zinc-800 text-xs font-mono text-zinc-300"
            title="오늘 누적 동작 시간"
          >
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse-subtle" />
            <span className="text-zinc-500 text-[11px] hidden sm:inline">오늘 가동</span>
            <span className="font-semibold text-emerald-300">{formatUptime(status.uptimeSeconds)}</span>
          </div>

          {/* Quick Online Switch */}
          <button
            onClick={onToggleOnline}
            title={status.online ? '로봇 전원 끄기' : '로봇 전원 켜기'}
            aria-label="로봇 전원 토글"
            className={`p-1.5 rounded-lg border transition-all ${
              status.online
                ? 'bg-zinc-800/80 border-zinc-700 text-emerald-400 hover:bg-emerald-950/30 hover:border-emerald-500/40'
                : 'bg-zinc-800/30 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
