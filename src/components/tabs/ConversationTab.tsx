import React, { useState } from 'react';
import { ChatMessage, MemoryFact, RobotStatus } from '../../types';
import {
  Calendar,
  Search,
  Edit3,
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
  onAddRecord: (date: string, sender: 'user' | 'robot', text: string) => Promise<void>;
  activeCharacter: 'study' | 'cooking';
  hasQueried: boolean;
  onPerformQuery: (date: string) => void;
  facts: MemoryFact[];
  isFactsLoading?: boolean;
  isExtracting?: boolean;
  onExtractSession: (sessionId?: string) => Promise<void>;
  onExtractAllSessions: () => Promise<void>;
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
  onAddRecord,
  activeCharacter,
  hasQueried,
  onPerformQuery,
  facts = [],
  isFactsLoading = false,
  isExtracting = false,
  onExtractSession,
  onExtractAllSessions,
}) => {
  // Local state for querying & editing
  const [inputDate, setInputDate] = useState<string>(selectedDate);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [senderFilter, setSenderFilter] = useState<'all' | 'user' | 'robot'>('all');
  const [showArchGuide, setShowArchGuide] = useState(false);

  // Confirmation modals
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
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

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditText(msg.text);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) return;
    await onUpdateMessage(id, editText.trim());
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
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

  // Filtered messages
  const filteredMessages = messages.filter((m) => {
    if (senderFilter !== 'all' && m.sender !== senderFilter) return false;
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

        {/* Horizontal Weekday Date Strip */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-0.5 px-0.5">
          {weekDates.map((item) => {
            const isSelected = selectedDate === item.date;
            const hasMemoryDot =
              item.hasData ||
              facts.some(
                (f) => f.event_time === item.date || f.created_at?.startsWith(item.date)
              );

            return (
              <button
                key={item.date}
                onClick={() => handleQuery(item.date)}
                className={`flex flex-col items-center justify-center flex-1 min-w-[42px] h-[58px] rounded-xl transition-all duration-150 select-none shrink-0 relative ${
                  isSelected
                    ? 'bg-[#2D7D54] text-[#FFFFFF] shadow-md shadow-[#2D7D54]/25 ring-2 ring-[#2D7D54]/20 scale-[1.03]'
                    : 'bg-[#FAF8F5] border border-[#E8E2D8] text-[#7A7268] hover:bg-[#F2EFE8] hover:border-[#DDD7CD]'
                }`}
              >
                <span
                  className={`text-[10px] font-medium tracking-tight ${
                    isSelected ? 'text-[#D5F0E1]' : 'text-[#8C8479]'
                  }`}
                >
                  {item.dayName}
                </span>
                <span
                  className={`text-sm font-bold font-mono tracking-tight my-0.5 ${
                    isSelected ? 'text-[#FFFFFF]' : 'text-[#2D2926]'
                  }`}
                >
                  {item.dayNum}
                </span>

                {/* Dot Indicator for Stored Memories */}
                <span className="h-1.5 flex items-center justify-center">
                  {hasMemoryDot ? (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-[#FFFFFF]' : 'bg-[#2D7D54]'
                      }`}
                    />
                  ) : (
                    <span className="w-1 h-1 rounded-full opacity-0" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Queried Memory Records Display Area */}
      {!hasQueried ? (
        /* Prompt before query */
        <div className="bg-[#FAF8F5] border border-dashed border-[#DDD7CD] rounded-2xl p-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#EFECE6] text-[#8C8479] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#38332E]">날짜를 조회해주세요</h3>
          <p className="text-xs text-[#7A7268] max-w-xs mx-auto">
            상단에서 날짜를 선택한 후 <span className="text-[#236845] font-semibold">[대화 기록 조회]</span> 버튼을 누르면 해당 일자의 장기 기억 대화 목록을 확인하고 수정/삭제할 수 있습니다.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#7A7268] gap-2">
          <RotateCcw className="w-5 h-5 animate-spin text-[#2D7D54]" />
          <span className="text-xs">장기 기억 대화 데이터베이스 조회 중...</span>
        </div>
      ) : (
        /* Queried Records Section */
        <section className="space-y-3">
          {/* AI Long-term Memory Facts Panel (Mem0 Facts) */}
          <div className="bg-[#FFFFFF] border border-[#D5E2D9] rounded-2xl p-3.5 space-y-2.5 shadow-[0_2px_8px_rgba(45,125,84,0.06)]">
            {/* Header: Title + Badge + Action Buttons */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#EAF5EF] text-[#2D7D54] flex items-center justify-center shrink-0 border border-[#CDE5D7]">
                  <Brain className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <h4 className="text-xs font-bold text-[#2D2926] whitespace-nowrap">
                    AI 장기기억
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap border shrink-0 ${
                      dateFacts.length > 0
                        ? 'bg-[#EAF5EF] text-[#236845] border-[#CDE5D7]'
                        : 'bg-[#FEF5E7] text-[#B45309] border-[#FCD9A2]'
                    }`}
                  >
                    {dateFacts.length > 0 ? `${dateFacts.length}건 저장` : '미추출'}
                  </span>
                </div>
              </div>

              {/* Extract Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onExtractSession()}
                  disabled={isExtracting || messages.length === 0}
                  className={`h-7 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 shadow-xs ${
                    isExtracting
                      ? 'bg-[#E4DDD2] text-[#8C8479] cursor-not-allowed'
                      : dateFacts.length > 0
                      ? 'bg-[#FAF8F5] hover:bg-[#EAE4D7] text-[#3D3730] border border-[#DDD7CD]'
                      : 'bg-[#2D7D54] hover:bg-[#256643] text-[#FFFFFF] shadow-sm'
                  }`}
                  title="이 대화 세션에서 AI 장기기억 추출"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-[#2D7D54]" />
                      <span className="whitespace-nowrap">추출 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="whitespace-nowrap">
                        {dateFacts.length > 0 ? '재추출' : '기억 추출'}
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={onExtractAllSessions}
                  disabled={isExtracting}
                  className="h-7 w-7 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#DDD7CD] text-[#7A7268] hover:text-[#2D2926] flex items-center justify-center shrink-0 transition-colors"
                  title="전체 날짜 세션 장기기억 일괄 추출 (저비용)"
                >
                  <Database className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Helper Subtitle */}
            <p className="text-[10px] text-[#7A7268] leading-tight">
              대화에서 LLM이 추출한 핵심 사실(Mem0) 및 실시간 pgvector 동기화
            </p>

            {/* In-progress Notification */}
            {isExtracting && (
              <div className="p-2.5 rounded-xl bg-[#EAF5EF] border border-[#CDE5D7] flex items-center gap-2 text-xs text-[#236845] animate-in fade-in">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#2D7D54]" />
                <span>
                  대화 문맥을 분석하여 새 사실(ADD) 또는 갱신(UPDATE) 여부를 판단하는 중입니다...
                </span>
              </div>
            )}

            {/* Extracted Facts List */}
            {dateFacts.length > 0 ? (
              <div className="space-y-2 pt-1 border-t border-[#EFEAE0]">
                {dateFacts.map((fact) => (
                  <div
                    key={fact.memory_id}
                    className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-2.5 space-y-1.5 hover:border-[#2D7D54]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {fact.domain_tags?.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-1.5 py-0.2 rounded-md bg-[#FFFFFF] border border-[#DDD7CD] font-medium text-[#236845]"
                          >
                            #{tag}
                          </span>
                        ))}
                        <span
                          className={`px-1.5 py-0.2 rounded-md border font-medium ${
                            fact.scope === 'character_private'
                              ? 'bg-[#EEF4FB] text-[#2563EB] border-[#BCD9FA]'
                              : 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]'
                          }`}
                        >
                          {fact.scope === 'character_private'
                            ? fact.owner_character_id === 'study'
                              ? '📚 공부 전용'
                              : '🍳 요리 전용'
                            : '🌐 전체 공유'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[#8C8479] font-mono">
                        <span>
                          중요도{' '}
                          {'★'.repeat(
                            Math.min(5, Math.max(1, Math.round(fact.importance / 2)))
                          )}
                        </span>
                        <span>신뢰도 {Math.round((fact.confidence || 0.9) * 100)}%</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#2D2926] leading-relaxed font-sans font-medium">
                      {fact.content}
                    </p>

                    {fact.summary_for_prompt && (
                      <p className="text-[10px] text-[#7A7268] bg-[#FFFFFF] rounded-md px-2 py-1 border border-[#E8E2D8]">
                        <span className="font-semibold text-[#8C8479]">프롬프트 주입 요약: </span>
                        {fact.summary_for_prompt}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl px-3 py-2 flex items-center justify-between text-xs text-[#7A7268]">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>아직 추출된 기억이 없습니다.</span>
                </span>
                <button
                  onClick={() => onExtractSession()}
                  disabled={isExtracting || messages.length === 0}
                  className="text-[11px] font-bold text-[#236845] hover:underline whitespace-nowrap"
                >
                  기억 추출하기 →
                </button>
              </div>
            )}
          </div>

          {/* Controls Bar: Count, Filter, Search, New Record, Delete All */}
          <div className="bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl p-3 space-y-2.5 shadow-[0_2px_10px_rgba(45,125,84,0.03)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#2D2926]">
                  {selectedDate.slice(5)} 대화 기록
                </span>
                <span className="text-[10px] font-mono text-[#236845] bg-[#EAF5EF] border border-[#CDE5D7] px-2 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0">
                  총 {messages.length}건
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#DDD7CD] text-[11px] font-semibold text-[#236845] flex items-center gap-1 transition-colors shadow-2xs whitespace-nowrap shrink-0"
                  title="기억 데이터 수동 추가"
                >
                  <Plus className="w-3 h-3 text-[#2D7D54]" />
                  <span>발화 추가</span>
                </button>

                {messages.length > 0 && (
                  <button
                    onClick={() => setConfirmDeleteAll(true)}
                    className="p-1 rounded-lg bg-[#FAF8F5] hover:bg-[#FEE2E2] border border-[#DDD7CD] hover:border-[#FCA5A5] text-[#8C8479] hover:text-[#DC2626] transition-colors shrink-0"
                    title="이 날짜 기록 전체 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#E8E2D8]">
              {/* Sender Filter */}
              <div className="flex items-center gap-0.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-lg p-0.5 shrink-0">
                <button
                  onClick={() => setSenderFilter('all')}
                  className={`px-2 py-1 rounded-md text-[10px] transition-colors whitespace-nowrap ${
                    senderFilter === 'all'
                      ? 'bg-[#FFFFFF] text-[#2D2926] font-bold shadow-2xs'
                      : 'text-[#7A7268] hover:text-[#2D2926]'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setSenderFilter('user')}
                  className={`px-2 py-1 rounded-md text-[10px] transition-colors whitespace-nowrap ${
                    senderFilter === 'user'
                      ? 'bg-[#EAF5EF] text-[#236845] font-bold shadow-2xs'
                      : 'text-[#7A7268] hover:text-[#2D2926]'
                  }`}
                >
                  나 (STT)
                </button>
                <button
                  onClick={() => setSenderFilter('robot')}
                  className={`px-2 py-1 rounded-md text-[10px] transition-colors whitespace-nowrap ${
                    senderFilter === 'robot'
                      ? 'bg-[#EEF4FB] text-[#2563EB] font-bold shadow-2xs'
                      : 'text-[#7A7268] hover:text-[#2D2926]'
                  }`}
                >
                  MindMate
                </button>
              </div>

              {/* Keyword Search */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="대화 내용 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#DDD7CD] focus:border-[#2D7D54] focus:bg-[#FFFFFF] rounded-lg pl-6 pr-2 py-1 text-[11px] text-[#2D2926] placeholder-[#A0988E] focus:outline-none transition-colors"
                />
                <Search className="w-3 h-3 text-[#8C8479] absolute left-2 top-2 pointer-events-none" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-1.5 top-1.5 text-[#8C8479] hover:text-[#2D2926]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Record List */}
          {filteredMessages.length === 0 ? (
            <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl p-8 text-center space-y-2">
              <Info className="w-6 h-6 text-[#8C8479] mx-auto" />
              <p className="text-xs font-semibold text-[#38332E]">
                {searchTerm || senderFilter !== 'all'
                  ? '검색 조건에 일치하는 대화 데이터가 없습니다.'
                  : `${selectedDate} 일자에 저장된 대화가 없습니다.`}
              </p>
              <p className="text-[11px] text-[#7A7268]">
                [발화 추가] 버튼을 눌러 기억 데이터를 직접 주입할 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredMessages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                const isEditing = editingId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`rounded-2xl p-3.5 transition-all space-y-2 shadow-[0_2px_10px_rgba(45,125,84,0.03)] ${
                      isEditing
                        ? 'bg-[#FFFFFF] border-2 border-[#2D7D54] ring-2 ring-[#2D7D54]/20'
                        : isUser
                        ? 'bg-[#FFFFFF] border border-[#E8E2D8] hover:border-[#D6CEC1]'
                        : 'bg-gradient-to-br from-[#FFFFFF] via-[#F8FAF9] to-[#F1F7F4] border border-[#D5EADF] hover:border-[#BCE2CD]'
                    }`}
                  >
                    {/* Record Header */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#EFEAE0]/80">
                      <div className="flex items-center gap-1.5">
                        {/* Sender Label Badge */}
                        {isUser ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EAF5EF] text-[#236845] border border-[#CDE5D7] whitespace-nowrap shrink-0">
                            <User className="w-3 h-3 text-[#2D7D54] shrink-0" />
                            나 (STT)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EEF4FB] text-[#2563EB] border border-[#BCD9FA] whitespace-nowrap shrink-0">
                            <Bot className="w-3 h-3 text-[#2563EB] shrink-0" />
                            MindMate
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-[#8C8479] flex items-center gap-0.5 whitespace-nowrap shrink-0">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          {msg.time}
                        </span>

                        {msg.edited && (
                          <span className="text-[10px] font-medium text-[#B45309] bg-[#FEF5E7] px-1.5 py-0.2 rounded border border-[#FCD9A2] whitespace-nowrap shrink-0">
                            수정됨
                          </span>
                        )}
                      </div>

                      {/* Header Micro Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartEdit(msg)}
                          className="h-6 px-2 rounded-md bg-[#FAF8F5] hover:bg-[#ECE6DA] border border-[#DDD7CD] text-[#6E675E] hover:text-[#2D2926] flex items-center gap-1 text-[10px] font-medium transition-colors shadow-2xs"
                          title="발화 수정"
                        >
                          <Edit3 className="w-2.5 h-2.5 text-[#7A7268]" />
                          <span>수정</span>
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(msg.id)}
                          className="h-6 w-6 rounded-md bg-[#FAF8F5] hover:bg-[#FEE2E2] border border-[#DDD7CD] hover:border-[#FCA5A5] text-[#8C8479] hover:text-[#DC2626] flex items-center justify-center transition-colors shadow-2xs"
                          title="기록 삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Record Content & Inline Editor */}
                    {isEditing ? (
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-[#38332E] flex items-center justify-between">
                            <span>대화 내용 수정 (장기 기억 정제)</span>
                            <span className="text-[#8C8479] font-mono text-[10px]">
                              {editText.length}자
                            </span>
                          </label>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="w-full bg-[#FAF8F5] border border-[#DDD7CD] focus:border-[#2D7D54] focus:bg-[#FFFFFF] rounded-xl p-3 text-xs text-[#2D2926] focus:outline-none leading-relaxed resize-none font-sans"
                            placeholder="STT 인식 오류나 왜곡된 내용을 정확하게 교정해주세요."
                            autoFocus
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#7A7268] pt-1">
                          <span className="flex items-center gap-1 text-[#236845] text-[10px]">
                            <Info className="w-3 h-3 shrink-0" />
                            저장 시 LLM 프롬프트에 즉시 반영됩니다.
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 rounded-lg bg-[#F4F0E8] hover:bg-[#EAE4D7] text-[#524B43] text-xs flex items-center gap-1 transition-colors"
                            >
                              <X className="w-3 h-3" />
                              취소
                            </button>
                            <button
                              onClick={() => handleSaveEdit(msg.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#2D7D54] hover:bg-[#256643] text-[#FFFFFF] font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                              기억 반영 저장
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[13px] text-[#2D2926] leading-relaxed font-sans whitespace-pre-wrap break-words select-text">
                        {msg.text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Manual Memory Injection Modal (+ 수동 추가) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2926]/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFEAE0] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#EAF5EF] text-[#236845]">
                  <Plus className="w-4 h-4 text-[#2D7D54]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2D2926]">대화 기억 데이터 수동 등록</h3>
                  <span className="text-[10px] text-[#7A7268] font-mono">대상 날짜: {selectedDate}</span>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#8C8479] hover:text-[#2D2926]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-3">
              {/* Sender Select */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#38332E] block">발화 주체 선택</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSender('user')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      newSender === 'user'
                        ? 'bg-[#EAF5EF] border-[#2D7D54] text-[#236845]'
                        : 'bg-[#FAF8F5] border-[#DDD7CD] text-[#7A7268]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-[#2D7D54]" />
                    사용자 (STT)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSender('robot')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      newSender === 'robot'
                        ? 'bg-[#EEF4FB] border-[#2563EB] text-[#2563EB]'
                        : 'bg-[#FAF8F5] border-[#DDD7CD] text-[#7A7268]'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 text-[#2563EB]" />
                    로봇 (MindMate)
                  </button>
                </div>
              </div>

              {/* Text Input */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#38332E] block">대화 내용 (장기 기억 본문)</label>
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  rows={4}
                  placeholder={
                    newSender === 'user'
                      ? '예: 오늘 집중 뽀모도로 세션 시작하자'
                      : '예: 네! 25분 집중 타이머를 설정해두었습니다.'
                  }
                  className="w-full bg-[#FAF8F5] border border-[#DDD7CD] focus:border-[#2D7D54] focus:bg-[#FFFFFF] rounded-xl p-3 text-xs text-[#2D2926] placeholder-[#A0988E] focus:outline-none resize-none leading-relaxed"
                  required
                />
              </div>

              <p className="text-[10px] text-[#7A7268] leading-normal">
                💡 등록된 발화는 {selectedDate} 일자의 장기 기억 DB에 즉시 적재되어 로봇의 맥락 데이터로 활용됩니다.
              </p>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#F4F0E8] hover:bg-[#EAE4D7] text-xs font-semibold text-[#524B43]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!newText.trim() || isAdding}
                  className="flex-1 py-2.5 rounded-xl bg-[#2D7D54] hover:bg-[#256643] active:scale-95 disabled:opacity-40 text-xs font-bold text-[#FFFFFF] shadow-sm transition-all"
                >
                  {isAdding ? '저장 중...' : '기억 DB에 저장'}
                </button>
              </div>
            </form>
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
              <h3 className="font-bold text-[#2D2926] text-sm">장기 기억 발화 삭제</h3>
              <p className="text-xs text-[#6B645C] mt-1 leading-relaxed">
                해당 발화 기록을 장기 기억 데이터베이스에서 완전히 삭제하시겠습니까? <span className="text-[#2D2926] font-semibold">LLM의 향후 문맥 참조 및 대화 추론에서 제외</span>됩니다.
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
