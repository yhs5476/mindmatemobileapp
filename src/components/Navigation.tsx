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
      label: '대화 기록',
      icon: Database,
    },
    {
      id: 'proactive' as TabKey,
      label: '선제 개입',
      icon: BarChart2,
    },
    {
      id: 'settings' as TabKey,
      label: '설정',
      icon: Settings2,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#FFFFFF]/90 backdrop-blur-xl border-t border-[#E8E2D8]/80 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto grid grid-cols-3 h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center relative transition-all duration-200 select-none ${
                isActive
                  ? 'text-[#236845] font-bold'
                  : 'text-[#827A70] hover:text-[#2D2926] active:scale-95'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 w-10 h-0.5 bg-gradient-to-r from-[#2D7D54] to-[#48A375] rounded-full shadow-[0_0_8px_rgba(45,125,84,0.4)]" />
              )}
              <div className="relative mb-0.5">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.4] text-[#2D7D54]' : 'stroke-[1.8]'
                  }`}
                />
              </div>
              <span className="text-[11px] tracking-tight leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
