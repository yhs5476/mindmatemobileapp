import React from 'react';
import { RobotStatus, CharacterMode } from '../types';
import { Activity, Radio, Power, Zap, BookOpen, Utensils } from 'lucide-react';

interface HeaderProps {
  status: RobotStatus;
  onToggleOnline: () => void;
  character?: CharacterMode;
}

export const Header: React.FC<HeaderProps> = ({ status, onToggleOnline, character = 'study' }) => {
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
        <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-xs font-semibold bg-[#EFECE6] text-[#7A7268] border border-[#DDD7CD] whitespace-nowrap shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8A196] shrink-0" />
          오프라인
        </span>
      );
    }

    switch (status.status) {
      case 'speaking':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-xs font-semibold bg-[#EEF4FB] text-[#2563EB] border border-[#BCD9FA] animate-pulse whitespace-nowrap shrink-0">
            <Activity className="w-3.5 h-3.5 text-[#2563EB] animate-spin shrink-0" />
            대화 중
          </span>
        );
      case 'intervening':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-xs font-semibold bg-[#FEF5E7] text-[#B45309] border border-[#FCD9A2] animate-bounce whitespace-nowrap shrink-0">
            <Zap className="w-3.5 h-3.5 text-[#B45309] fill-[#B45309] shrink-0" />
            선제 개입 중
          </span>
        );
      case 'idle':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-xs font-semibold bg-[#EAF5EF] text-[#236845] border border-[#BCE2CD] whitespace-nowrap shrink-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D7D54] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2D7D54]" />
            </span>
            대기 중
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E8E2D8] px-3.5 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Left: Mascot Avatar & Mode Title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onToggleOnline}
            title={status.online ? '클릭하여 오프라인으로 전환' : '클릭하여 온라인으로 연결'}
            className="flex items-center gap-2 px-1 py-0.5 rounded-xl hover:bg-[#F4F0E8] active:scale-95 transition-all text-left group min-w-0"
          >
            {/* Mascot Avatar Squircle */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EAF5EF] to-[#D5EADF] text-[#236845] border border-[#CDE5D7] flex items-center justify-center shrink-0 shadow-xs relative">
              {character === 'cooking' ? (
                <Utensils className="w-4 h-4 text-[#B45309]" />
              ) : (
                <BookOpen className="w-4 h-4 text-[#2D7D54]" />
              )}
              {/* Online Green Indicator Dot */}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                {status.online && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D7D54] opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 border border-white ${
                    status.online ? 'bg-[#2D7D54]' : 'bg-[#A8A196]'
                  }`}
                />
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight text-[#2D2926] leading-tight truncate">
                {status.deviceName}
              </span>
              <span className="text-[10px] text-[#7A7268] font-medium tracking-tight mt-0.5 whitespace-nowrap truncate">
                {status.online
                  ? character === 'cooking'
                    ? '🍳 요리 코치 모드'
                    : '📚 학습 메이트 모드'
                  : '오프라인 (연결 대기)'}
              </span>
            </div>
          </button>
        </div>

        {/* Right: State & Cumulative Uptime & Power */}
        <div className="flex items-center gap-1.5 shrink-0">
          {getStatusBadge()}

          <div
            className="flex items-center gap-1 px-2 h-7 rounded-lg bg-[#F8F6F0] border border-[#E4DED3] text-xs font-mono text-[#3D3833] whitespace-nowrap shrink-0"
            title="오늘 누적 동작 시간"
          >
            <Radio className="w-3 h-3 text-[#2D7D54] animate-pulse-subtle shrink-0" />
            <span className="font-semibold text-[#236845]">{formatUptime(status.uptimeSeconds)}</span>
          </div>

          {/* Quick Online Switch */}
          <button
            onClick={onToggleOnline}
            title={status.online ? '로봇 전원 끄기' : '로봇 전원 켜기'}
            aria-label="로봇 전원 토글"
            className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all shrink-0 ${
              status.online
                ? 'bg-[#EAF5EF] border-[#BCE2CD] text-[#236845] hover:bg-[#DDF0E4]'
                : 'bg-[#F4F0E8] border-[#E2DBD0] text-[#8C8479] hover:text-[#524B43]'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

