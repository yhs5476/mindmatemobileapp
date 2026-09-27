import React, { useState } from 'react';
import { ProactiveSummary, CharacterMode } from '../../types';
import {
  Zap,
  TrendingUp,
  Clock,
  Sparkles,
  BookOpen,
  Utensils,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';

interface ProactiveTabProps {
  summary: ProactiveSummary | null;
  isLoading: boolean;
  onTriggerIntervention: (mode?: CharacterMode) => Promise<void>;
  activeCharacter: CharacterMode;
}

export const ProactiveTab: React.FC<ProactiveTabProps> = ({
  summary,
  isLoading,
  onTriggerIntervention,
  activeCharacter,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'study' | 'cooking'>('all');
  const [isTriggering, setIsTriggering] = useState(false);

  const handleTrigger = async () => {
    setIsTriggering(true);
    try {
      await onTriggerIntervention(activeCharacter);
    } finally {
      setIsTriggering(false);
    }
  };

  const filteredLogs = summary?.recentLogs.filter((log) => {
    if (filterMode === 'all') return true;
    return log.mode === filterMode;
  }) || [];

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] pb-24 max-w-md mx-auto px-4 py-4 space-y-4">
      {/* 1. Key Metric Hero Card */}
      <section className="bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl p-4 shadow-[0_2px_10px_rgba(180,170,155,0.08)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FEF3C7]/40 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7A7268]">
            <Zap className="w-4 h-4 text-[#B45309] fill-[#B45309]" />
            <span className="text-[#38332E]">오늘의 선제 개입 분석</span>
          </div>
          <span className="text-[11px] font-mono text-[#7A7268] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E2DBD0]">
            실시간 집계
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Total Interventions Card */}
          <div className="bg-[#FAF8F5] border border-[#E6E0D4] rounded-xl p-3">
            <span className="text-[11px] text-[#7A7268] block mb-1">총 개입 횟수</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-[#2D2926]">
                {summary?.todayCount ?? 0}
              </span>
              <span className="text-xs text-[#7A7268] font-medium">회</span>
            </div>

            {/* Day over Day delta */}
            <div className="flex items-center gap-1 mt-1 text-[11px]">
              <TrendingUp className="w-3 h-3 text-[#2D7D54]" />
              <span className="text-[#236845] font-semibold">
                {summary?.diffCount && summary.diffCount >= 0 ? `+${summary.diffCount}` : summary?.diffCount ?? 0}회
              </span>
              <span className="text-[#8C8479] text-[10px]">(전일 대비)</span>
            </div>
          </div>

          {/* User Response Rate Card */}
          <div className="bg-[#FAF8F5] border border-[#E6E0D4] rounded-xl p-3">
            <span className="text-[11px] text-[#7A7268] block mb-1">사용자 반응률</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-[#B45309]">
                {summary?.responseRate ?? 0}%
              </span>
            </div>
            <div className="w-full bg-[#E5DFD4] rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-[#D97706] h-full rounded-full transition-all duration-500"
                style={{ width: `${summary?.responseRate ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Trigger Simulated Intervention Button */}
        <button
          onClick={handleTrigger}
          disabled={isTriggering}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-[#FFFFFF] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>선제 개입 테스트 발생 (시뮬레이터)</span>
        </button>
      </section>

      {/* 2. Intervention Category Breakdown */}
      <section className="bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl p-4 shadow-[0_2px_8px_rgba(180,170,155,0.06)]">
        <h3 className="text-xs font-semibold text-[#38332E] mb-3 flex items-center justify-between">
          <span>개입 목적 및 유형 분류</span>
          <span className="text-[10px] text-[#8C8479] font-normal">오늘 기준</span>
        </h3>

        <div className="space-y-2.5">
          {summary?.typeBreakdown && summary.typeBreakdown.length > 0 ? (
            summary.typeBreakdown.map((item, idx) => {
              const isStudy = item.mode === 'study';
              const maxCount = Math.max(...summary.typeBreakdown.map((t) => t.count), 1);
              const percent = Math.round((item.count / maxCount) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-[#2D2926]">
                      {isStudy ? (
                        <span className="p-0.5 rounded bg-[#EEF4FB] text-[#2563EB]">
                          <BookOpen className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="p-0.5 rounded bg-[#FFF0E6] text-[#EA580C]">
                          <Utensils className="w-3 h-3" />
                        </span>
                      )}
                      <span className="font-semibold">{item.label}</span>
                      <span className="text-[10px] text-[#8C8479]">
                        ({isStudy ? '공부' : '요리'})
                      </span>
                    </span>
                    <span className="font-mono text-[#4A443D] text-xs font-bold">
                      {item.count}회
                    </span>
                  </div>

                  <div className="w-full bg-[#EFEAE0] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isStudy ? 'bg-[#3B82F6]' : 'bg-[#EA580C]'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-[#8C8479] py-2">개입 통계 데이터가 없습니다.</p>
          )}
        </div>
      </section>

      {/* 3. Recent Intervention Timeline Log */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-[#38332E] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#8C8479]" />
            <span>최근 선제 개입 기록</span>
            <span className="text-[#8C8479] text-[11px]">({filteredLogs.length}건)</span>
          </h3>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#DDD7CD] rounded-xl p-0.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2 py-0.5 rounded-lg text-[10px] transition-colors ${
                filterMode === 'all'
                  ? 'bg-[#FFFFFF] text-[#2D2926] font-bold shadow-xs'
                  : 'text-[#7A7268] hover:text-[#2D2926]'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilterMode('study')}
              className={`px-2 py-0.5 rounded-lg text-[10px] transition-colors ${
                filterMode === 'study'
                  ? 'bg-[#EEF4FB] text-[#2563EB] font-bold shadow-xs'
                  : 'text-[#7A7268] hover:text-[#2D2926]'
              }`}
            >
              공부
            </button>
            <button
              onClick={() => setFilterMode('cooking')}
              className={`px-2 py-0.5 rounded-lg text-[10px] transition-colors ${
                filterMode === 'cooking'
                  ? 'bg-[#FFF0E6] text-[#EA580C] font-bold shadow-xs'
                  : 'text-[#7A7268] hover:text-[#2D2926]'
              }`}
            >
              요리
            </button>
          </div>
        </div>

        {/* Timeline Log List */}
        <div className="space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl p-6 text-center text-xs text-[#8C8479]">
              해당 필터에 일치하는 선제 개입 기록이 없습니다.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isStudy = log.mode === 'study';

              return (
                <div
                  key={log.id}
                  className="bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-3.5 transition-all space-y-2 shadow-[0_2px_6px_rgba(180,170,155,0.06)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#524B43] bg-[#FAF8F5] border border-[#E2DBD0] px-2 py-0.5 rounded-md">
                        {log.time}
                      </span>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isStudy
                            ? 'bg-[#EEF4FB] text-[#2563EB] border-[#BCD9FA]'
                            : 'bg-[#FFF0E6] text-[#EA580C] border-[#FCD2B5]'
                        }`}
                      >
                        {isStudy ? '📚 공부' : '🍳 요리'} · {log.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                      {log.userResponded ? (
                        <span className="flex items-center gap-1 text-[#236845] font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          반응 완료
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#8C8479]">
                          <AlertCircle className="w-3 h-3" />
                          미반응
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="text-xs text-[#7A7268] flex items-baseline gap-1.5 pl-1">
                    <span className="text-[#8C8479] text-[10px] shrink-0 font-medium">사유:</span>
                    <span className="text-[#38332E] font-normal">{log.reason}</span>
                  </div>

                  {/* Robot Utterance Bubble */}
                  <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg p-2.5 text-xs text-[#2D2926] leading-relaxed font-sans italic">
                    "{log.utterance}"
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
