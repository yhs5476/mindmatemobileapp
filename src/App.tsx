import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { ConversationTab } from './components/tabs/ConversationTab';
import { ProactiveTab } from './components/tabs/ProactiveTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import {
  ChatMessage,
  MemoryFact,
  ProactiveSummary,
  RobotProfile,
  RobotStatus,
  CharacterMode,
  ServerPreset,
  CharacterMemoryPack,
} from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('conversations');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Robot Status State
  const [status, setStatus] = useState<RobotStatus>({
    online: true,
    uptimeSeconds: 15155,
    status: 'idle',
    deviceName: 'MindMate-01',
  });

  // Server Configuration & Connection State
  const [serverConfig, setServerConfig] = useState<ServerPreset | null>(null);
  const [serverPresets, setServerPresets] = useState<ServerPreset[]>([]);

  // Date & Chats State: Auto-query enabled for Today (2026-10-28)
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-28');
  const [hasQueried, setHasQueried] = useState<boolean>(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isChatsLoading, setIsChatsLoading] = useState<boolean>(false);

  // Character-aware Realtime Memory Pack State
  const [memoryPack, setMemoryPack] = useState<CharacterMemoryPack | null>(null);
  const [isMemoryPackLoading, setIsMemoryPackLoading] = useState<boolean>(false);


  // Long-term Memory Facts State
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [isFactsLoading, setIsFactsLoading] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  // Proactive Interventions State
  const [proactiveSummary, setProactiveSummary] = useState<ProactiveSummary | null>(null);
  const [isProactiveLoading, setIsProactiveLoading] = useState<boolean>(false);

  // Settings & Profile State
  const [profile, setProfile] = useState<RobotProfile>({
    character: 'study',
    activeVoiceModelId: 'voice-model-1',
    voiceName: '사용자 녹음 음성 (차분한 학습형)',
    speed: 1.0,
    pitch: 1.0,
    updatedAt: new Date().toISOString(),
  });
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Fetch Robot Status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/robot/status');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setStatus(json.data);
        }
      }
    } catch {
      // Offline fallback
    }
  }, []);

  // Fetch Profile
  const fetchProfile = useCallback(async () => {
    try {
      setIsProfileLoading(true);
      const res = await fetch('/api/v1/robot/profile');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setProfile(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  // Fetch Server Configuration
  const fetchServerConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/server/config');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.active) {
          setServerConfig(json.active);
          setServerPresets(json.presets || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch server config', err);
    }
  }, []);

  // Fetch Realtime Memory Pack for Active Character
  const fetchMemoryPack = useCallback(async (char?: CharacterMode) => {
    const targetChar = char || profile.character;
    try {
      setIsMemoryPackLoading(true);
      const res = await fetch(`/api/v1/characters/${targetChar}/memory-pack`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setMemoryPack(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch memory pack', err);
    } finally {
      setIsMemoryPackLoading(false);
    }
  }, [profile.character]);

  // Switch Server Connection / Account Login
  const handleSwitchServer = async (presetId?: string, custom?: Partial<ServerPreset>) => {
    try {
      const res = await fetch('/api/v1/server/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId, ...custom }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setServerConfig(json.active);
        try {
          if (json.active.userId && json.active.apiKey) {
            localStorage.setItem(
              'mindmate_active_user',
              JSON.stringify({
                userId: json.active.userId,
                apiKey: json.active.apiKey,
                baseUrl: json.active.baseUrl,
                userName: json.active.userName,
              })
            );
          } else {
            localStorage.removeItem('mindmate_active_user');
            setMessages([]);
            setFacts([]);
          }
        } catch {}
        showToast(`✨ ${json.message || '로그인 및 DB 전환이 완료되었습니다.'}`);
        // Reload everything from the newly connected server
        fetchStatus();
        fetchChats(selectedDate);
        fetchFacts();
        fetchMemoryPack(profile.character);
      } else {
        showToast(`❌ ${json.message || '로그인에 실패했습니다.'}`);
      }
    } catch (err) {
      console.error('Failed to switch server', err);
      showToast('로그인 요청 중 오류가 발생했습니다.');
    }
  };

  // Fetch Chats by Date
  const fetchChats = useCallback(async (date: string) => {
    try {
      setIsChatsLoading(true);
      const res = await fetch(`/api/v1/chats?date=${date}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMessages(json.data);
          if (Array.isArray(json.availableDates)) {
            setAvailableDates(json.availableDates);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch chats', err);
    } finally {
      setIsChatsLoading(false);
    }
  }, []);

  // Fetch Proactive Summary
  const fetchProactive = useCallback(async () => {
    try {
      setIsProactiveLoading(true);
      const res = await fetch('/api/v1/robot/proactive-logs?period=today');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setProactiveSummary(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch proactive summary', err);
    } finally {
      setIsProactiveLoading(false);
    }
  }, []);

  // Fetch Long-term Memory Facts
  const fetchFacts = useCallback(async () => {
    try {
      setIsFactsLoading(true);
      const res = await fetch('/api/v1/facts');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setFacts(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch facts', err);
    } finally {
      setIsFactsLoading(false);
    }
  }, []);

  // Periodic poll for status & initial loads
  useEffect(() => {
    fetchServerConfig();
    fetchStatus();
    fetchProfile();
    fetchProactive();
    fetchFacts();
    fetchMemoryPack(profile.character);

    // Restore saved user credentials from localStorage
    try {
      const saved = localStorage.getItem('mindmate_active_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.userId && parsed.apiKey) {
          fetch('/api/v1/server/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed),
          })
            .then((r) => r.json())
            .then((json) => {
              if (json.success && json.active) {
                setServerConfig(json.active);
                fetchStatus();
                fetchChats(selectedDate);
                fetchFacts();
                fetchMemoryPack(profile.character);
              }
            })
            .catch(() => {});
        }
      }
    } catch {}

    // Step 1: Zero-Step Discovery - Automatically load today's chats on initial launch
    fetchChats(selectedDate);
    setHasQueried(true);

    const interval = setInterval(() => {
      fetchStatus();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchServerConfig, fetchStatus, fetchProfile, fetchProactive, fetchFacts, fetchMemoryPack, fetchChats, selectedDate, profile.character]);

  // Handle Online/Offline toggle
  const handleToggleOnline = async () => {
    try {
      const res = await fetch('/api/v1/robot/status/toggle-online', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setStatus(json.data);
        showToast(json.data.online ? '🟢 로봇 연결 완료 (온라인)' : '⚪ 로봇 연결 해제 (오프라인)');
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  // Perform date query
  const handlePerformQuery = (date: string) => {
    setSelectedDate(date);
    setHasQueried(true);
    fetchChats(date);
    fetchFacts();
    showToast(`📅 ${date} 일자의 대화 및 장기기억을 조회했습니다.`);
  };

  // Extract Memory Facts from Session
  const handleExtractSession = async (sessionId?: string) => {
    const targetSid = sessionId || messages.find((m) => m.sessionId)?.sessionId;
    if (!targetSid) {
      showToast('⚠️ 추출할 원본 세션 ID를 찾을 수 없습니다.');
      return;
    }

    try {
      setIsExtracting(true);
      showToast('🧠 AI가 대화에서 장기기억을 추출하고 있습니다...');
      const res = await fetch(`/api/v1/sessions/${targetSid}/extract`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success && json.data) {
        const counts = json.data.counts || {};
        const added = counts.ADD || 0;
        const updated = counts.UPDATE || 0;
        await fetchFacts();
        await fetchChats(selectedDate);
        showToast(`✨ 기억 추출 완료: 신규 ${added}건 추가, ${updated}건 갱신`);
      } else {
        showToast(json.message || '기억 추출에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Extraction failed:', err);
      showToast('기억 추출 요청 중 오류 발생');
    } finally {
      setIsExtracting(false);
    }
  };

  // Bulk extract all sessions
  const handleExtractAllSessions = async () => {
    try {
      setIsExtracting(true);
      showToast('⚡ 전체 세션에서 장기기억을 일괄 추출 중입니다 (약 15~30초 소요)...');
      const res = await fetch('/api/v1/facts/extract-all?reset=false', {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success && json.data) {
        const counts = json.data.counts || {};
        await fetchFacts();
        await fetchChats(selectedDate);
        showToast(`✨ 전체 추출 완료: 총 ${counts.ADD || 0}건의 장기기억 적재`);
      } else {
        showToast(json.message || '일괄 추출 실패');
      }
    } catch (err: any) {
      console.error('Bulk extract failed:', err);
      showToast('일괄 추출 중 오류 발생');
    } finally {
      setIsExtracting(false);
    }
  };

  // Chat message update (STT typo or LLM memory refinement)
  const handleUpdateMessage = async (id: string, text: string) => {
    try {
      const res = await fetch(`/api/v1/chats/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, text, edited: true } : m))
        );
        showToast('대화가 수정되어 로봇의 장기 기억(LLM Context)이 갱신되었습니다');
      }
    } catch (err) {
      console.error('Failed to update message', err);
      showToast('발화 수정 실패');
    }
  };

  // Update memory fact (memory_facts table in PostgreSQL)
  const handleUpdateFact = async (
    memoryId: number | string,
    content: string,
    summaryForPrompt?: string
  ) => {
    try {
      const res = await fetch(`/api/v1/facts/${memoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, summary_for_prompt: summaryForPrompt }),
      });
      if (res.ok) {
        setFacts((prev) =>
          prev.map((f) =>
            String(f.memory_id) === String(memoryId)
              ? {
                  ...f,
                  content,
                  summary_for_prompt: summaryForPrompt !== undefined ? summaryForPrompt : f.summary_for_prompt,
                }
              : f
          )
        );
        showToast('✨ 장기기억(memory_facts)이 성공적으로 수정되었습니다.');
        // Refresh memory pack so character prompts reflect the change immediately
        fetchMemoryPack(profile.character);
      } else {
        showToast('장기기억 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('Failed to update fact:', err);
      showToast('기억 수정 중 오류가 발생했습니다.');
    }
  };

  // Delete memory fact (memory_facts table in PostgreSQL)
  const handleDeleteFact = async (memoryId: number | string) => {
    try {
      const res = await fetch(`/api/v1/facts/${memoryId}`, { method: 'DELETE' });
      if (res.ok) {
        setFacts((prev) => prev.filter((f) => String(f.memory_id) !== String(memoryId)));
        showToast('🗑️ 장기기억(memory_facts)이 성공적으로 삭제되었습니다.');
        // Refresh memory pack so character prompts reflect the change immediately
        fetchMemoryPack(profile.character);
      } else {
        showToast('장기기억 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('Failed to delete fact:', err);
      showToast('기억 삭제 중 오류가 발생했습니다.');
    }
  };

  // Chat message / memory_fact delete (Remove from long term memory)
  const handleDeleteMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/chats/messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        const rawFactId = id.startsWith('fact-') ? id.replace('fact-', '') : id;
        setFacts((prev) => prev.filter((f) => String(f.memory_id) !== rawFactId));
        showToast('🗑️ 장기기억(memory_facts)이 성공적으로 삭제되었습니다.');
        fetchMemoryPack(profile.character);
      } else {
        showToast('장기기억 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('Failed to delete message', err);
      showToast('기억 삭제 중 오류가 발생했습니다.');
    }
  };

  // Delete all for date
  const handleDeleteAllForDate = async (date: string) => {
    try {
      const res = await fetch(`/api/v1/chats?date=${date}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages([]);
        setFacts((prev) => prev.filter((f) => f.event_time !== date && !f.created_at?.startsWith(date)));
        showToast(`🗑️ ${date} 일자의 모든 memory_facts가 삭제되었습니다`);
        fetchMemoryPack(profile.character);
      } else {
        showToast('일자 전체 기억 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('Failed to delete all chats for date', err);
      showToast('삭제 중 오류가 발생했습니다.');
    }
  };

  // Manual record insertion into long term memory
  const handleAddRecord = async (date: string, sender: 'user' | 'robot', text: string) => {
    try {
      const res = await fetch('/api/v1/chats/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          sender,
          text,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setMessages((prev) => [...prev, json.data]);
        showToast('대화 데이터가 장기 기억 DB에 등록되었습니다');
      }
    } catch (err) {
      console.error('Failed to add memory record', err);
    }
  };

  // Trigger Proactive Intervention
  const handleTriggerIntervention = async (mode?: CharacterMode) => {
    try {
      const res = await fetch('/api/v1/robot/proactive-logs/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      if (res.ok) {
        const json = await res.json();
        await fetchProactive();
        await fetchStatus();
        showToast(`⚡ 선제 개입 발생: "${json.data.type}" - ${json.data.reason}`);
      }
    } catch (err) {
      console.error('Failed to trigger intervention', err);
    }
  };

  // Save Settings & Profile
  const handleSaveProfile = async (updated: Partial<RobotProfile>) => {
    try {
      const res = await fetch('/api/v1/robot/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const json = await res.json();
        setProfile(json.data);
        if (updated.character) {
          fetchMemoryPack(updated.character);
        }
        showToast('설정이 로봇에 실시간 동기화되었습니다');
      }
    } catch (err) {
      console.error('Failed to save profile', err);
      showToast('설정 동기화 실패');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D2926] flex flex-col justify-between">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#2D2926]/90 text-[#FAF8F5] text-xs font-semibold border border-[#443F3B] shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 pointer-events-none text-center max-w-[90vw]">
          {toastMessage}
        </div>
      )}

      {/* Global Sticky Top Header 2.0 */}
      <Header status={status} onToggleOnline={handleToggleOnline} character={profile.character} />

      {/* Main Tab Content */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {activeTab === 'conversations' && (
          <ConversationTab
            status={status}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            hasQueried={hasQueried}
            onPerformQuery={handlePerformQuery}
            messages={messages}
            isLoading={isChatsLoading}
            onUpdateMessage={handleUpdateMessage}
            onDeleteMessage={handleDeleteMessage}
            onDeleteAllForDate={handleDeleteAllForDate}
            onDeleteFact={handleDeleteFact}
            onUpdateFact={handleUpdateFact}
            onAddRecord={handleAddRecord}
            activeCharacter={profile.character}
            facts={facts}
            isFactsLoading={isFactsLoading}
            isExtracting={isExtracting}
            onExtractSession={handleExtractSession}
            onExtractAllSessions={handleExtractAllSessions}
            memoryPack={memoryPack}
            isMemoryPackLoading={isMemoryPackLoading}
            onRefreshMemoryPack={() => fetchMemoryPack(profile.character)}
            availableDates={availableDates}
            serverConfig={serverConfig}
          />
        )}

        {activeTab === 'proactive' && (
          <ProactiveTab
            summary={proactiveSummary}
            isLoading={isProactiveLoading}
            onTriggerIntervention={handleTriggerIntervention}
            activeCharacter={profile.character}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            profile={profile}
            onSaveProfile={handleSaveProfile}
            isLoading={isProfileLoading}
            serverConfig={serverConfig}
            serverPresets={serverPresets}
            onSwitchServer={handleSwitchServer}
          />
        )}
      </main>


      {/* Fixed Bottom 3-Tab Navigation */}
      <Navigation activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
};

export default App;
