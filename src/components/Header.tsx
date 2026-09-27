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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EFECE6] text-[#7A7268] border border-[#DDD7CD]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8A196]" />
          오프라인
        </span>
      );
    }

    switch (status.status) {
      case 'speaking':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EEF4FB] text-[#2563EB] border border-[#BCD9FA] animate-pulse">
            <Activity className="w-3 h-3 text-[#2563EB] animate-spin" />
            대화 중
          </span>
        );
      case 'intervening':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF5E7] text-[#B45309] border border-[#FCD9A2] animate-bounce">
            <Zap className="w-3 h-3 text-[#B45309] fill-[#B45309]" />
            선제 개입 중
          </span>
        );
      case 'idle':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF5EF] text-[#236845] border border-[#BCE2CD]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D7D54] animate-ping inline-block" />
            대기 중
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E8E2D8] px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: Device Name & Online Indicator Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleOnline}
            title={status.online ? '클릭하여 오프라인으로 전환' : '클릭하여 온라인으로 연결'}
            className="flex items-center gap-2 px-2 py-1 -ml-1 rounded-lg hover:bg-[#F4F0E8] active:scale-95 transition-all text-left group"
          >
            <span className="relative flex h-2.5 w-2.5">
              {status.online && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D7D54] opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  status.online ? 'bg-[#2D7D54]' : 'bg-[#A8A196]'
                }`}
              ></span>
            </span>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-[#2D2926] flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-[#7A7268] group-hover:text-[#2D7D54] transition-colors" />
                  {status.deviceName}
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[#7A7268] px-1 py-0.2 bg-[#F4F0E8] border border-[#E2DBD0] rounded">
                  v2.1
                </span>
              </div>
              {status.cloudDb?.connected && (
                <span className="text-[10px] text-[#236845] font-semibold flex items-center gap-1 tracking-tight mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D7D54]" />
                  클라우드 DB: {status.cloudDb.userName}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Right: State & Cumulative Uptime */}
        <div className="flex items-center gap-2">
          {getStatusBadge()}

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8F6F0] border border-[#E4DED3] text-xs font-mono text-[#3D3833]"
            title="오늘 누적 동작 시간"
          >
            <Radio className="w-3 h-3 text-[#2D7D54] animate-pulse-subtle" />
            <span className="text-[#827A70] text-[11px] hidden sm:inline">오늘 가동</span>
            <span className="font-semibold text-[#236845]">{formatUptime(status.uptimeSeconds)}</span>
          </div>

          {/* Quick Online Switch */}
          <button
            onClick={onToggleOnline}
            title={status.online ? '로봇 전원 끄기' : '로봇 전원 켜기'}
            aria-label="로봇 전원 토글"
            className={`p-1.5 rounded-lg border transition-all ${
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
