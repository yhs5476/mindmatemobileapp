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
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  sender: 'user' | 'robot';
  text: string;
  edited?: boolean;
  confidence?: number;
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
