import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { ConversationTab } from './components/tabs/ConversationTab';
import { ProactiveTab } from './components/tabs/ProactiveTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import {
  ChatMessage,
  ProactiveSummary,
  RobotProfile,
  RobotStatus,
  CharacterMode,
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

  // Date & Chats State: User must query to see
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-27');
  const [hasQueried, setHasQueried] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatsLoading, setIsChatsLoading] = useState<boolean>(false);

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

  // Fetch Chats by Date
  const fetchChats = useCallback(async (date: string) => {
    try {
      setIsChatsLoading(true);
      const res = await fetch(`/api/v1/chats?date=${date}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMessages(json.data);
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

  // Periodic poll for status & initial loads
  useEffect(() => {
    fetchStatus();
    fetchProfile();
    fetchProactive();

    const interval = setInterval(() => {
      fetchStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchStatus, fetchProfile, fetchProactive]);

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
    showToast(`📅 ${date} 일자의 장기 기억 대화 기록을 조회했습니다.`);
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

  // Chat message delete (Remove from long term memory)
  const handleDeleteMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/chats/messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        showToast('발화가 장기 기억 DB에서 영구 삭제되었습니다');
      }
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  // Delete all for date
  const handleDeleteAllForDate = async (date: string) => {
    try {
      const res = await fetch(`/api/v1/chats?date=${date}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages([]);
        showToast(`${date} 일자의 모든 대화 데이터가 삭제되었습니다`);
      }
    } catch (err) {
      console.error('Failed to delete all chats for date', err);
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
        showToast('설정이 로봇에 실시간 동기화되었습니다');
      }
    } catch (err) {
      console.error('Failed to save profile', err);
      showToast('설정 동기화 실패');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-zinc-850/95 text-emerald-300 text-xs font-semibold border border-zinc-700 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 pointer-events-none text-center max-w-[90vw]">
          {toastMessage}
        </div>
      )}

      {/* Global Sticky Top Header */}
      <Header status={status} onToggleOnline={handleToggleOnline} />

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
            onAddRecord={handleAddRecord}
            activeCharacter={profile.character}
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
          />
        )}
      </main>

      {/* Fixed Bottom 3-Tab Navigation */}
      <Navigation activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
};

export default App;
