export type RobotState = 'idle' | 'speaking' | 'intervening';

export interface RobotStatus {
  online: boolean;
  uptimeSeconds: number;
  status: RobotState;
  deviceName: string;
  batteryLevel?: number;
  cloudDb?: {
    connected: boolean;
    host: string;
    userName: string;
    userId: string;
  };
}

export interface ChatMessage {
  id: string;
  sessionId?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  sender: 'user' | 'robot';
  text: string;
  edited?: boolean;
  confidence?: number;
}

export interface MemoryFact {
  memory_id: number;
  external_id?: string | null;
  user_id: string;
  content: string;
  summary_for_prompt?: string | null;
  memory_type: string;
  scope: 'shared' | 'character_private';
  owner_character_id?: string | null;
  domain_tags: string[];
  importance: number;
  event_time?: string | null;
  valid_until?: string | null;
  validity_status?: string;
  confidence?: number | null;
  sensitivity?: string;
  conflict_group_id?: string | null;
  selection_status?: string;
  selection_score?: number | null;
  source_session_id?: string | null;
  created_at: string;
}

export interface ExtractDecision {
  action: 'ADD' | 'UPDATE' | 'NOOP' | 'CONFLICT';
  content: string;
  fact?: MemoryFact | null;
  expired_id?: number | null;
  reason?: string;
}

export interface ExtractResult {
  decisions: ExtractDecision[];
  counts: {
    ADD: number;
    UPDATE: number;
    NOOP: number;
    CONFLICT: number;
  };
  updated_memory_sections?: string[];
  updated_prompt_caches?: string[];
}

export interface ReflectionItem {
  reflection_id: number;
  user_id: string;
  character_id?: string | null;
  summary: string;
  source_memory_ids: number[];
  created_at: string;
  score?: number;
}

export interface CharacterMemoryPack {
  text: string;
  user: {
    user_id: string;
    user_name: string;
    persona?: string;
    robot_name?: string;
    job?: string;
    location?: string;
    habit?: string;
  };
  character: {
    character_id: string;
    name: string;
    description: string;
    system_prompt?: string;
    switch_rules?: string;
    allowed_domains: string[];
    blocked_domains: string[];
    tone: string;
  };
  counts: {
    candidates: number;
    included: number;
    blocked: number;
    shared: number;
    character_private: number;
    reflections: number;
  };
  included_memory_ids: number[];
  blocked_memory_ids: number[];
}

export type InterventionMode = 'study' | 'cooking';

export interface ProactiveLog {
  id: string;
  date: string;
  time: string; // HH:mm
  mode: InterventionMode;
  type: string;
  reason: string;
  utterance: string;
  userResponded?: boolean;
}

export interface ProactiveTypeStat {
  type: string;
  mode: InterventionMode;
  count: number;
  label: string;
}

export interface ProactiveSummary {
  period: string;
  todayCount: number;
  yesterdayCount: number;
  diffCount: number;
  diffPercent: number;
  responseRate: number;
  typeBreakdown: ProactiveTypeStat[];
  recentLogs: ProactiveLog[];
}

export type CharacterMode = 'study' | 'cooking';

export interface TrainedVoiceModel {
  id: string;
  name: string;
  fileName: string;
  fileSizeMb: number;
  durationSec: number;
  characterTarget: CharacterMode;
  similarityScore: number; // e.g. 96.8
  status: 'ready' | 'training' | 'failed';
  createdAt: string;
  samplePhrase: string;
  toneStyle: 'calm' | 'energetic' | 'warm';
  pitchOffset: number;
}

export interface RobotProfile {
  character: CharacterMode;
  activeVoiceModelId: string;
  voiceName?: string;
  speed: number; // 0.7 to 1.5
  pitch: number; // 0.8 to 1.2
  updatedAt: string;
}
