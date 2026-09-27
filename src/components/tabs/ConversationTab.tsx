import React, { useState } from 'react';
import { ChatMessage, RobotStatus } from '../../types';
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
}) => {
  // Local state for querying & editing
  const [inputDate, setInputDate] = useState<string>(selectedDate);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [senderFilter, setSenderFilter] = useState<'all' | 'user' | 'robot'>('all');

  // Confirmation modals
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  // New record modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSender, setNewSender] = useState<'user' | 'robot'>('user');
  const [newText, setNewText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const quickDates = [
    { label: '오늘', date: '2026-09-27' },
    { label: '어제', date: '2026-09-26' },
    { label: '그저께', date: '2026-09-25' },
    { label: '9/24', date: '2026-09-24' },
  ];

  const handleQuery = (dateToQuery: string) => {
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
      {/* 1. Long-term Memory Architecture Explanation Banner */}
      <section className="bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl p-4 shadow-[0_2px_8px_rgba(180,170,155,0.06)] relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#EAF5EF] text-[#236845] border border-[#CDE5D7] shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-[#2D2926] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#2D7D54]" />
                <span>로봇 장기 기억(Memory DB) 관리</span>
              </h2>
              <span className="text-[10px] font-mono text-[#236845] bg-[#EAF5EF] px-1.5 py-0.5 rounded border border-[#CDE5D7]">
                LLM Context
              </span>
            </div>
            <p className="text-[11px] text-[#6B645C] leading-relaxed">
              이곳의 대화 데이터는 단순 채팅 기록이 아니라 <span className="text-[#236845] font-semibold">LLM의 차기 답변 및 행동 방식에 직접 주입되는 장기 기억</span>입니다. 날짜별 조회를 통해 잘못 인식된 STT 오탈자나 왜곡된 기억을 수정·삭제하여 로봇의 반응을 교정하세요.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Date Query Panel (날짜 조회 전용 인터페이스) */}
      <section className="bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl p-4 space-y-3 shadow-[0_2px_8px_rgba(180,170,155,0.06)]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#38332E] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#2D7D54]" />
            <span>조회할 날짜 선택</span>
          </label>
          {hasQueried && (
            <span className="text-[10px] text-[#7A7268] font-mono">
              현재 조회 일자: <strong className="text-[#236845]">{selectedDate}</strong>
            </span>
          )}
        </div>

        {/* Date Input & Query Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="date"
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#DDD7CD] focus:border-[#2D7D54] focus:bg-[#FFFFFF] rounded-xl px-3 py-2 text-xs font-mono text-[#2D2926] focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={() => handleQuery(inputDate)}
            className="px-4 py-2 rounded-xl bg-[#2D7D54] hover:bg-[#256643] active:scale-95 text-[#FFFFFF] font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>대화 기록 조회</span>
          </button>
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[10px] text-[#827A70] shrink-0">빠른 조회:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {quickDates.map((item) => {
              const isActive = selectedDate === item.date && hasQueried;
              return (
                <button
                  key={item.date}
                  onClick={() => {
                    setInputDate(item.date);
                    handleQuery(item.date);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all shrink-0 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#EAF5EF] border-[#2D7D54] text-[#236845] font-bold'
                      : 'bg-[#FAF8F5] border-[#E4DDD2] text-[#6E675E] hover:bg-[#EDE7DC] hover:text-[#2D2926]'
                  }`}
                >
                  {item.label} ({item.date.slice(5)})
                </button>
              );
            })}
          </div>
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
          {/* Controls Bar: Count, Filter, Search, New Record, Delete All */}
          <div className="bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl p-3 space-y-2.5 shadow-[0_2px_6px_rgba(180,170,155,0.05)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#2D2926]">
                  {selectedDate} 기록 목록
                </span>
                <span className="text-[10px] font-mono text-[#236845] bg-[#EAF5EF] border border-[#CDE5D7] px-2 py-0.5 rounded-full font-bold">
                  총 {messages.length}건
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#DDD7CD] text-[11px] font-semibold text-[#236845] flex items-center gap-1 transition-colors"
                  title="기억 데이터 수동 추가"
                >
                  <Plus className="w-3 h-3 text-[#2D7D54]" />
                  <span>수동 추가</span>
                </button>

                {messages.length > 0 && (
                  <button
                    onClick={() => setConfirmDeleteAll(true)}
                    className="p-1 rounded-lg bg-[#FAF8F5] hover:bg-[#FEE2E2] border border-[#DDD7CD] hover:border-[#FCA5A5] text-[#8C8479] hover:text-[#DC2626] transition-colors"
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
              <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#DDD7CD] rounded-lg p-0.5">
                <button
                  onClick={() => setSenderFilter('all')}
                  className={`px-2 py-1 rounded text-[10px] transition-colors ${
                    senderFilter === 'all'
                      ? 'bg-[#FFFFFF] text-[#2D2926] font-bold shadow-xs'
                      : 'text-[#7A7268] hover:text-[#2D2926]'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setSenderFilter('user')}
                  className={`px-2 py-1 rounded text-[10px] transition-colors ${
                    senderFilter === 'user'
                      ? 'bg-[#EAF5EF] text-[#236845] font-bold shadow-xs'
                      : 'text-[#7A7268] hover:text-[#2D2926]'
                  }`}
                >
                  사용자 STT
                </button>
                <button
                  onClick={() => setSenderFilter('robot')}
                  className={`px-2 py-1 rounded text-[10px] transition-colors ${
                    senderFilter === 'robot'
                      ? 'bg-[#EEF4FB] text-[#2563EB] font-bold shadow-xs'
                      : 'text-[#7A7268] hover:text-[#2D2926]'
                  }`}
                >
                  로봇 LLM
                </button>
              </div>

              {/* Keyword Search */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="대화 내용 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#DDD7CD] focus:border-[#2D7D54] focus:bg-[#FFFFFF] rounded-lg pl-6 pr-2 py-1 text-[11px] text-[#2D2926] placeholder-[#A0988E] focus:outline-none"
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
                  : `${selectedDate} 일자에 저장된 장기 기억 대화가 없습니다.`}
              </p>
              <p className="text-[11px] text-[#7A7268]">
                [수동 추가] 버튼을 눌러 기억 데이터를 직접 주입할 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                const isEditing = editingId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`bg-[#FFFFFF] border rounded-2xl p-4 transition-all space-y-3 shadow-[0_2px_6px_rgba(180,170,155,0.06)] ${
                      isEditing
                        ? 'border-[#2D7D54] ring-2 ring-[#2D7D54]/25'
                        : isUser
                        ? 'border-[#E8E2D8] hover:border-[#D6CEC1]'
                        : 'border-[#E4DED3] hover:border-[#BFD3EA]'
                    }`}
                  >
                    {/* Record Header */}
                    <div className="flex items-center justify-between border-b border-[#EFEAE0] pb-2.5">
                      <div className="flex items-center gap-2">
                        {/* Sender Label Badge */}
                        {isUser ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#EAF5EF] text-[#236845] border border-[#CDE5D7]">
                            <User className="w-3 h-3 text-[#2D7D54]" />
                            사용자 (STT 음성 인식)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#EEF4FB] text-[#2563EB] border border-[#BCD9FA]">
                            <Bot className="w-3 h-3 text-[#2563EB]" />
                            MindMate (LLM 생성 응답)
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-[#8C8479] flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {msg.time}
                        </span>

                        {msg.edited && (
                          <span className="text-[10px] font-medium text-[#B45309] bg-[#FEF5E7] px-1.5 py-0.2 rounded border border-[#FCD9A2]">
                            수정 반영됨
                          </span>
                        )}
                      </div>

                      {/* Memory Status Tag */}
                      <span className="text-[10px] text-[#A8A196] font-mono hidden sm:inline">
                        #{index + 1}
                      </span>
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
                            저장 시 LLM의 프롬프트 컨텍스트에 즉시 반영됩니다.
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
                      <div className="space-y-3">
                        {/* Text Block */}
                        <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-3.5 text-xs text-[#2D2926] leading-relaxed font-sans whitespace-pre-wrap break-words select-text">
                          {msg.text}
                        </div>

                        {/* Action Toolbar */}
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-[10px] text-[#8C8479]">
                            {isUser
                              ? '사용자 의도 및 키워드로 저장됨'
                              : '로봇 성향 및 페르소나 출력 기준'}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStartEdit(msg)}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#ECE6DA] border border-[#DDD7CD] text-[#524B43] hover:text-[#2D2926] flex items-center gap-1 text-[11px] transition-colors"
                            >
                              <Edit3 className="w-3 h-3 text-[#7A7268]" />
                              <span>수정하기</span>
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(msg.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#FEE2E2] border border-[#DDD7CD] hover:border-[#FCA5A5] text-[#8C8479] hover:text-[#DC2626] flex items-center gap-1 text-[11px] transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>삭제</span>
                            </button>
                          </div>
                        </div>
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
