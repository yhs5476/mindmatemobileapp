import React, { useState } from 'react';
import { ChatMessage, MemoryFact, RobotStatus, CharacterMemoryPack, ServerPreset } from '../../types';
import {
  Calendar,
  Search,
  Trash2,
  Check,
  X,
  Plus,
  AlertTriangle,
  RotateCcw,
  Database,
  Brain,
  ShieldAlert,
  User,
  Bot,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  Loader2,
  Star,
  Globe,
  Lock,
} from 'lucide-react';

interface ConversationTabProps {
  status: RobotStatus;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  messages: ChatMessage[];
  isLoading: boolean;
  onUpdateMessage: (id: string, text: string) => Promise<void>;
  onDeleteMessage: (id: string) => Promise<void>;
  onDeleteAllForDate: (date: string) => Promise<void>;
  onDeleteFact?: (memoryId: number | string) => Promise<void>;
  onUpdateFact?: (memoryId: number | string, content: string, summary?: string) => Promise<void>;
  onAddRecord: (date: string, sender: 'user' | 'robot', text: string) => Promise<void>;
  activeCharacter: 'study' | 'cooking';
  hasQueried: boolean;
  onPerformQuery: (date: string) => void;
  facts: MemoryFact[];
  isFactsLoading?: boolean;
  isExtracting?: boolean;
  onExtractSession: (sessionId?: string) => Promise<void>;
  onExtractAllSessions: () => Promise<void>;
  memoryPack?: CharacterMemoryPack | null;
  isMemoryPackLoading?: boolean;
  onRefreshMemoryPack?: () => void;
  availableDates?: string[];
  serverConfig?: ServerPreset | null;
}

export const ConversationTab: React.FC<ConversationTabProps> = ({
  status,
  selectedDate,
  onSelectDate,
  messages,
  isLoading,
  onUpdateMessage,
  onDeleteMessage,
  onDeleteAllForDate,
  onDeleteFact,
  onUpdateFact,
  onAddRecord,
  activeCharacter,
  hasQueried,
  onPerformQuery,
  facts = [],
  isFactsLoading = false,
  isExtracting = false,
  onExtractSession,
  onExtractAllSessions,
  memoryPack,
  isMemoryPackLoading = false,
  onRefreshMemoryPack,
  availableDates = [],
  serverConfig,
}) => {
  // Local state for querying & editing
  const [inputDate, setInputDate] = useState<string>(selectedDate);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchGuide, setShowArchGuide] = useState(false);

  // Confirmation modals
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteFactTargetId, setDeleteFactTargetId] = useState<number | string | null>(null);

  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  // New record modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSender, setNewSender] = useState<'user' | 'robot'>('user');
  const [newText, setNewText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Extracted memory facts for the selected date or session
  const currentSessionIds = Array.from(
    new Set(messages.map((m) => m.sessionId).filter(Boolean))
  ) as string[];

  const dateFacts = facts.filter((f) => {
    if (f.source_session_id && currentSessionIds.includes(f.source_session_id)) return true;
    if (f.event_time === selectedDate) return true;
    if (f.created_at && f.created_at.startsWith(selectedDate)) return true;
    return false;
  });

  const weekDates = [
    { date: '2026-09-21', dayName: '월', dayNum: '21', hasData: false, isToday: false },
    { date: '2026-09-22', dayName: '화', dayNum: '22', hasData: false, isToday: false },
    { date: '2026-09-23', dayName: '수', dayNum: '23', hasData: false, isToday: false },
    { date: '2026-09-24', dayName: '목', dayNum: '24', hasData: true, isToday: false },
    { date: '2026-09-25', dayName: '금', dayNum: '25', hasData: true, isToday: false },
    { date: '2026-09-26', dayName: '토', dayNum: '26', hasData: true, isToday: false },
    { date: '2026-09-27', dayName: '일', dayNum: '27', hasData: true, isToday: true },
    { date: '2026-09-28', dayName: '월', dayNum: '28', hasData: false, isToday: false },
  ];

  const handleQuery = (dateToQuery: string) => {
    setInputDate(dateToQuery);
    onSelectDate(dateToQuery);
    onPerformQuery(dateToQuery);
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || isAdding) return;
    setIsAdding(true);
    try {
      await onAddRecord(selectedDate, newSender, newText.trim());
      setNewText('');
      setShowAddModal(false);
    } finally {
      setIsAdding(false);
    }
  };

  // Filtered messages (ONLY pure memory_facts: strictly exclude raw session speech turns like cloud-*)
  const filteredMessages = messages.filter((m) => {
    if (m.id.startsWith('cloud-') || (!m.isFact && !m.id.startsWith('fact-'))) return false;
    if (searchTerm.trim() && !m.text.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] pb-24 max-w-md mx-auto px-4 py-4 space-y-4">
      {/* 1. Daily Memory Highlight Bento Card (Step 2 Trendy Redesign) */}
      <section className="bg-gradient-to-r from-[#FFFFFF] via-[#FAF8F5] to-[#FFFFFF] border border-[#E8E2D8] rounded-2xl p-3.5 shadow-[0_2px_12px_rgba(45,125,84,0.04)] relative overflow-hidden transition-all">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EAF5EF] to-[#D5EADF] text-[#2D7D54] flex items-center justify-center shrink-0 border border-[#CDE5D7] shadow-xs">
              <Brain className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-bold text-[#2D2926] truncate">
                  {selectedDate === '2026-09-27'
                    ? '오늘의 AI 기억 하이라이트'
                    : `${selectedDate.slice(5).replace('-', '월 ')}일 기억 하이라이트`}
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF5EF] text-[#236845] border border-[#CDE5D7] shrink-0 whitespace-nowrap">
                  {dateFacts.length > 0 ? `${dateFacts.length}건 기억됨` : '새로운 기억 수집 중'}
                </span>
              </div>
              <p className="text-[11px] text-[#7A7268] mt-0.5 truncate">
                {dateFacts.length > 0
                  ? `로봇이 대화에서 학습한 핵심 기억이 LLM 프롬프트에 자동 주입됩니다.`
                  : `대화를 나누면 로봇이 중요한 학습 습관과 취향을 자동으로 기억합니다.`}
              </p>
            </div>
          </div>

          {/* Toggle Architectural Guide */}
          <button
            onClick={() => setShowArchGuide(!showArchGuide)}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
              showArchGuide
                ? 'bg-[#EAF5EF] border-[#2D7D54] text-[#236845]'
                : 'bg-[#FAF8F5] hover:bg-[#EFECE6] border-[#DDD7CD] text-[#7A7268]'
            }`}
            title="장기기억 원리 안내 보기"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Collapsible Architecture Guide */}
        {showArchGuide && (
          <div className="mt-3 pt-2.5 border-t border-[#EAE4D9] text-[11px] text-[#6B645C] leading-relaxed animate-in fade-in slide-in-from-top-1 space-y-1 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D9CD]">
            <div className="font-semibold text-[#236845] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#2D7D54]" />
              <span>MindMate 장기 기억(Memory DB) 작동 원리</span>
            </div>
            <p>
              이곳의 대화 데이터는 단순 로그가 아니라 <strong>LLM의 행동 방식에 직접 주입되는 장기 기억</strong>입니다.
              STT 오탈자나 왜곡된 기억을 수정·삭제하여 로봇의 반응을 교정할 수 있습니다.
            </p>
          </div>
        )}
      </section>

      {/* 2. Horizontal Date Strip & Instant Selector (Step 1 Trendy Redesign) */}
      <section className="bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl p-3.5 space-y-3 shadow-[0_2px_12px_rgba(45,125,84,0.04)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#EAF5EF] text-[#2D7D54] flex items-center justify-center shrink-0 border border-[#CDE5D7]">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-[#2D2926] whitespace-nowrap truncate">
                {selectedDate === '2026-09-27'
                  ? '오늘의 대화'
                  : `${Number(selectedDate.slice(5, 7))}월 ${Number(selectedDate.slice(8, 10))}일 대화`}
              </span>
              {selectedDate === '2026-09-27' ? (
                <span className="text-[10px] bg-[#EAF5EF] text-[#236845] font-semibold px-1.5 py-0.5 rounded-full border border-[#CDE5D7] whitespace-nowrap shrink-0">
                  Today
                </span>
              ) : (
                <span className="text-[10px] text-[#8C8479] font-mono whitespace-nowrap shrink-0">
                  ({selectedDate.slice(5)})
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions: Return to Today & Date Picker */}
          <div className="flex items-center gap-1.5 shrink-0">
            {selectedDate !== '2026-09-27' && (
              <button
                onClick={() => handleQuery('2026-09-27')}
                className="h-7 px-2.5 text-[11px] font-semibold rounded-lg bg-[#EAF5EF] hover:bg-[#DDF0E4] border border-[#BCE2CD] text-[#236845] flex items-center gap-1 whitespace-nowrap shrink-0 transition-all active:scale-95 shadow-2xs"
                title="오늘 날짜로 즉시 이동"
              >
                <RotateCcw className="w-3 h-3 shrink-0" />
                <span className="whitespace-nowrap">오늘</span>
              </button>
            )}

            {/* Custom Date Input Overlay */}
            <div className="relative shrink-0">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) handleQuery(e.target.value);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                title="다른 날짜 달력에서 직접 선택"
              />
              <button
                type="button"
                className="h-7 px-2.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EFE8] border border-[#DDD7CD] hover:border-[#2D7D54] text-[#6E675E] text-[11px] font-medium flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
                title="다른 날짜 캘린더 열기"
              >
                <Calendar className="w-3 h-3 text-[#2D7D54] shrink-0" />
                <span className="whitespace-nowrap">달력</span>
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Date Strip (Dynamic from live DB availableDates: 32+ dates) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-0.5 px-0.5">
          {(availableDates && availableDates.length > 0
            ? availableDates
            : ['2026-10-29', '2026-10-28', '2026-10-18', '2026-10-05', '2026-09-27', '2026-09-26']
          ).map((dateStr) => {
            const isSelected = selectedDate === dateStr;
            const hasMemoryDot = facts.some(
              (f) => f.event_time === dateStr || f.created_at?.startsWith(dateStr)
            );
            const monthStr = dateStr.slice(5, 7);
            const dayStr = dateStr.slice(8, 10);

            return (
              <button
                key={dateStr}
                onClick={() => handleQuery(dateStr)}
                className={`flex flex-col items-center justify-center min-w-[50px] h-[54px] rounded-xl px-2 transition-all duration-150 select-none shrink-0 relative ${
                  isSelected
                    ? 'bg-[#2D7D54] text-[#FFFFFF] shadow-md shadow-[#2D7D54]/25 ring-2 ring-[#2D7D54]/20 scale-[1.03]'
                    : 'bg-[#FAF8F5] border border-[#E8E2D8] text-[#7A7268] hover:bg-[#F2EFE8] hover:border-[#DDD7CD]'
                }`}
                title={`${dateStr} 일자 대화 및 장기기억 조회`}
              >
                <span
                  className={`text-[9px] font-medium tracking-tight ${
                    isSelected ? 'text-[#D5F0E1]' : 'text-[#8C8479]'
                  }`}
                >
                  {Number(monthStr)}월
                </span>
                <span
                  className={`text-xs font-bold font-mono tracking-tight my-0.5 ${
                    isSelected ? 'text-[#FFFFFF]' : 'text-[#2D2926]'
                  }`}
                >
                  {dayStr}일
                </span>

                {/* Dot Indicator for Stored Memories in DB */}
                <span className="h-1.5 flex items-center justify-center">
                  {hasMemoryDot ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-[#FFFFFF]' : 'bg-[#2D7D54]'
                      }`}
                    />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full opacity-0" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Queried Memory Records Display Area: ONLY memory_facts Table Context */}
      {!hasQueried ? (
        <div className="bg-[#FAF8F5] border border-dashed border-[#DDD7CD] rounded-2xl p-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#EFECE6] text-[#8C8479] flex items-center justify-center mx-auto">
            <Brain className="w-6 h-6 text-[#2D7D54]" />
          </div>
          <h3 className="text-sm font-semibold text-[#38332E]">날짜를 선택해주세요</h3>
          <p className="text-xs text-[#7A7268] max-w-xs mx-auto">
            상단 날짜를 선택하면 해당 일자의 <span className="text-[#236845] font-semibold">memory_facts</span> 장기기억 목록을 조회하고 삭제할 수 있습니다.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#7A7268] gap-2">
          <RotateCcw className="w-5 h-5 animate-spin text-[#2D7D54]" />
          <span className="text-xs">memory_facts 테이블에서 장기기억 조회 중...</span>
        </div>
      ) : (
        <section className="space-y-3">
          {/* Controls Bar: Date Title, Total Count, Search Bar, Delete All */}
          <div className="bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl p-3.5 space-y-2.5 shadow-[0_2px_10px_rgba(45,125,84,0.03)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#EAF5EF] text-[#2D7D54] flex items-center justify-center shrink-0 border border-[#CDE5D7]">
                  <Brain className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#2D2926]">
                    {Number(selectedDate.slice(5, 7))}월 {Number(selectedDate.slice(8, 10))}일 memory_facts
                  </h3>
                  <span className="text-[10px] text-[#7A7268] font-mono">
                    PostgreSQL 원격 장기기억 데이터
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#236845] bg-[#EAF5EF] border border-[#CDE5D7] px-2 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0 ml-1">
                  총 {filteredMessages.length}건
                </span>
              </div>

              {/* Action Buttons: Delete All only */}
              {filteredMessages.length > 0 && (
                <button
                  onClick={() => setConfirmDeleteAll(true)}
                  className="px-2 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#FEE2E2] border border-[#DDD7CD] hover:border-[#FCA5A5] text-[#8C8479] hover:text-[#DC2626] text-[10px] font-medium flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                  title="이 날짜의 모든 memory_facts 삭제"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>전체 삭제</span>
                </button>
              )}
            </div>

            {/* Keyword Search Input */}
            <div className="relative pt-1 border-t border-[#EFEAE0]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3.5 text-[#8C8479]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="기억 내용(content) 키워드 검색..."
                className="w-full bg-[#FAF8F5] border border-[#DDD7CD] focus:border-[#2D7D54] focus:bg-[#FFFFFF] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#2D2926] focus:outline-none placeholder:text-[#A8A196]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-3.5 text-[#8C8479] hover:text-[#2D2926]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* memory_facts Records List (NO chat bubbles, ONLY memory_facts content with DELETE button) */}
          {filteredMessages.length === 0 ? (
            <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#EFECE6] text-[#8C8479] flex items-center justify-center mx-auto">
                <Brain className="w-5 h-5 text-[#8C8479]" />
              </div>
              <p className="text-xs text-[#7A7268]">
                {searchTerm
                  ? '검색어와 일치하는 memory_facts가 없습니다.'
                  : '이 날짜에 저장된 memory_facts가 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-2xl p-3.5 transition-all space-y-2 shadow-[0_2px_10px_rgba(45,125,84,0.03)] bg-gradient-to-br from-[#FFFFFF] via-[#FAFDFB] to-[#F3F9F5] border-2 border-[#CDE5D7] hover:border-[#2D7D54]/60"
                >
                  {/* Card Header: Fact ID, Tags, Scope, Importance, DELETE ONLY Button */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#EFEAE0]/80">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#EAF5EF] text-[#236845] border border-[#BCE2CD] whitespace-nowrap shrink-0">
                        <Brain className="w-3 h-3 text-[#2D7D54] shrink-0" />
                        Fact #{msg.factId || msg.id.replace('fact-', '')}
                      </span>

                      {/* Domain tags */}
                      {msg.domainTags && msg.domainTags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {msg.domainTags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-1.5 py-0.2 rounded-md bg-[#FFFFFF] border border-[#DDD7CD] text-[10px] font-medium text-[#236845]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Scope */}
                      <span
                        className={`px-1.5 py-0.2 rounded-md border text-[10px] font-medium ${
                          msg.scope === 'character_private'
                            ? 'bg-[#EEF4FB] text-[#2563EB] border-[#BCD9FA]'
                            : 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]'
                        }`}
                      >
                        {msg.scope === 'character_private'
                          ? msg.ownerCharacterId === 'study'
                            ? '📚 공부 전용'
                            : '🍳 요리 전용'
                          : '🌐 전체 공유'}
                      </span>

                      {/* Importance Rating */}
                      {msg.importance && (
                        <span className="text-[10px] text-[#8C8479] font-mono">
                          {'★'.repeat(Math.min(5, Math.max(1, Math.round(msg.importance / 2))))}
                        </span>
                      )}
                    </div>

                    {/* DELETE ONLY Button (NO edit button!) */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setDeleteTargetId(msg.id);
                        }}
                        className="h-6 px-2 rounded-md bg-[#FAF8F5] hover:bg-[#FEE2E2] border border-[#DDD7CD] hover:border-[#FCA5A5] text-[#8C8479] hover:text-[#DC2626] flex items-center gap-1 text-[10px] font-medium transition-colors shadow-2xs"
                        title="장기기억(memory_facts) 삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>삭제</span>
                      </button>
                    </div>
                  </div>

                  {/* Fact Content (The main context from memory_facts table) */}
                  <div className="text-[13px] text-[#2D2926] leading-relaxed font-sans font-medium whitespace-pre-wrap break-words select-text">
                    {msg.text}
                  </div>

                  {/* Prompt summary if available */}
                  {msg.summaryForPrompt && (
                    <p className="text-[10px] text-[#7A7268] bg-[#FFFFFF] rounded-md px-2.5 py-1 border border-[#E8E2D8] flex items-center gap-1">
                      <span className="font-semibold text-[#8C8479]">프롬프트 요약:</span>
                      <span>{msg.summaryForPrompt}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Delete Fact Modal Confirmation (memory_facts) */}
      {deleteFactTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2926]/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2D2926]">장기 기억(Fact) 삭제</h3>
              <p className="text-xs text-[#7A7268] mt-1 leading-relaxed">
                선택한 장기 기억(memory_facts ID: {deleteFactTargetId})을 삭제하시겠습니까? 로봇의 인지 및 프롬프트 주입에서 즉시 제외됩니다.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteFactTargetId(null)}
                className="flex-1 py-2 rounded-xl bg-[#F4F0E8] text-xs text-[#524B43] hover:bg-[#EAE4D7]"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (onDeleteFact && deleteFactTargetId !== null) {
                    await onDeleteFact(deleteFactTargetId);
                  }
                  setDeleteFactTargetId(null);
                }}
                className="flex-1 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-xs font-bold text-white transition-colors"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Modal Confirmation */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2926]/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#2D2926] text-sm">장기 기억(memory_facts) 삭제</h3>
              <p className="text-xs text-[#6B645C] mt-1 leading-relaxed">
                선택한 장기 기억을 memory_facts DB에서 영구 삭제하시겠습니까? <span className="text-[#2D2926] font-semibold">LLM의 향후 문맥 참조 및 대화 추론에서 제외</span>됩니다.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2 rounded-xl bg-[#F4F0E8] text-xs text-[#524B43] hover:bg-[#EAE4D7]"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  await onDeleteMessage(deleteTargetId);
                  setDeleteTargetId(null);
                }}
                className="flex-1 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-xs font-bold text-white transition-colors"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Modal Confirmation */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2926]/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#2D2926] text-sm">일자 전체 기억 데이터 삭제</h3>
              <p className="text-xs text-[#6B645C] mt-1 leading-relaxed">
                <span className="text-[#2D2926] font-semibold">{selectedDate}</span> 일자의 모든 대화 데이터 ({messages.length}건)를 삭제하시겠습니까? 로봇의 해당 일자 기억이 완전히 초기화됩니다.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmDeleteAll(false)}
                className="flex-1 py-2 rounded-xl bg-[#F4F0E8] text-xs text-[#524B43] hover:bg-[#EAE4D7]"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  await onDeleteAllForDate(selectedDate);
                  setConfirmDeleteAll(false);
                }}
                className="flex-1 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-xs font-bold text-white transition-colors"
              >
                전체 초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
