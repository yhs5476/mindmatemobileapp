import React from 'react';
import { Database, BarChart2, Settings2 } from 'lucide-react';

export type TabKey = 'conversations' | 'proactive' | 'settings';

interface NavigationProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  unreadCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    {
      id: 'conversations' as TabKey,
      label: '대화 기억 관리',
      sublabel: '날짜조회·수정삭제',
      icon: Database,
    },
    {
      id: 'proactive' as TabKey,
      label: '선제 개입',
      sublabel: '빈도·액션 분석',
      icon: BarChart2,
    },
    {
      id: 'settings' as TabKey,
      label: '설정',
      sublabel: '캐릭터·음성학습',
      icon: Settings2,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800/90 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-3 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center relative transition-all duration-200 select-none ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 active:scale-95'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 w-12 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              )}
              <div className="relative mb-0.5">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
              </div>
              <span className="text-[12px] tracking-tight leading-tight">{tab.label}</span>
              <span
                className={`text-[9px] leading-none transition-colors ${
                  isActive ? 'text-emerald-400/80' : 'text-zinc-500'
                }`}
              >
                {tab.sublabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
