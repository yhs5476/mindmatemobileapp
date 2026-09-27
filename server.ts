import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  ChatMessage,
  ProactiveLog,
  RobotProfile,
  RobotStatus,
  TrainedVoiceModel,
} from './src/types';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// In-Memory Data Store for MindMate Robot
let robotStatus: RobotStatus = {
  online: true,
  uptimeSeconds: 15155, // 04:12:35
  status: 'idle',
  deviceName: 'MindMate-01',
  batteryLevel: 88,
};

// Increment uptime periodically when online
setInterval(() => {
  if (robotStatus.online) {
    robotStatus.uptimeSeconds += 1;
  }
}, 1000);

// Trained Custom Voice Models (MP3 voice training dataset)
let trainedVoiceModels: TrainedVoiceModel[] = [
  {
    id: 'voice-model-1',
    name: '사용자 녹음 음성 (차분한 학습형)',
    fileName: 'my_study_voice.mp3',
    fileSizeMb: 2.4,
    durationSec: 42,
    characterTarget: 'study',
    similarityScore: 97.4,
    status: 'ready',
    createdAt: '2026-09-26 14:20',
    samplePhrase: '안녕하세요. 학습 세션을 시작할 준비가 되셨나요? 25분 집중 타이머를 가동합니다.',
    toneStyle: 'calm',
    pitchOffset: 0.95,
  },
  {
    id: 'voice-model-2',
    name: '주방 요리 코치 음성 (밝은 조리형)',
    fileName: 'kitchen_coach_sample.mp3',
    fileSizeMb: 1.8,
    durationSec: 35,
    characterTarget: 'cooking',
    similarityScore: 96.2,
    status: 'ready',
    createdAt: '2026-09-25 18:05',
    samplePhrase: '스파게티 면 알덴테 7분 삶기가 완료되었습니다. 면수를 덜어두고 면을 건져주세요!',
    toneStyle: 'energetic',
    pitchOffset: 1.05,
  },
];

let robotProfile: RobotProfile = {
  character: 'study',
  activeVoiceModelId: 'voice-model-1',
  voiceName: '사용자 녹음 음성 (차분한 학습형)',
  speed: 1.0,
  pitch: 1.0,
  updatedAt: new Date().toISOString(),
};

// Seed chat conversations by date
let chats: ChatMessage[] = [
  // Today's chats (2026-09-27)
  {
    id: 'msg-1',
    date: '2026-09-27',
    time: '14:05',
    sender: 'user',
    text: '오늘 영단어 30개 외우자',
    edited: false,
  },
  {
    id: 'msg-2',
    date: '2026-09-27',
    time: '14:05',
    sender: 'robot',
    text: '1일차 토익 필수 영단어 30개를 준비했어요. 25분 집중 타이머를 시작할까요?',
    edited: false,
  },
  {
    id: 'msg-3',
    date: '2026-09-27',
    time: '14:06',
    sender: 'user',
    text: '집중 타이머 켜줘',
    edited: false,
  },
  {
    id: 'msg-4',
    date: '2026-09-27',
    time: '14:06',
    sender: 'robot',
    text: '네! 25분 뽀모도로 학습 타이머를 가동합니다. 주변 소음을 줄이고 집중 모드로 전환할게요.',
    edited: false,
  },
  {
    id: 'msg-5',
    date: '2026-09-27',
    time: '14:31',
    sender: 'robot',
    text: '25분이 경과했습니다. 5분간 가벼운 스트레칭과 수분 섭취를 추천드려요.',
    edited: false,
  },
  {
    id: 'msg-6',
    date: '2026-09-27',
    time: '14:32',
    sender: 'user',
    text: '고마워, 물 한 잔 마시고 올게',
    edited: false,
  },

  // Yesterday's chats (2026-09-26)
  {
    id: 'msg-7',
    date: '2026-09-26',
    time: '12:15',
    sender: 'user',
    text: '오늘 점심 파스타 만들 건데 면 몇 분 삶아야 해?',
    edited: false,
  },
  {
    id: 'msg-8',
    date: '2026-09-26',
    time: '12:15',
    sender: 'robot',
    text: '스파게티 면 기준 알덴테는 7분, 부드러운 식감은 8분이 적당해요. 7분 타이머를 맞출까요?',
    edited: false,
  },
  {
    id: 'msg-9',
    date: '2026-09-26',
    time: '12:16',
    sender: 'user',
    text: '응 7분 맞춰줘',
    edited: false,
  },
  {
    id: 'msg-10',
    date: '2026-09-26',
    time: '12:23',
    sender: 'robot',
    text: '띵동! 7분 타이머가 끝났습니다. 면수를 한 국자 남겨두고 면을 건져주세요.',
    edited: true,
  },

  // Previous date (2026-09-25)
  {
    id: 'msg-11',
    date: '2026-09-25',
    time: '09:10',
    sender: 'user',
    text: '오늘 일정 브리핑해줘',
    edited: false,
  },
  {
    id: 'msg-12',
    date: '2026-09-25',
    time: '09:10',
    sender: 'robot',
    text: '좋은 아침이에요! 오전 10시 팀 싱크, 오후 2시 코드 리뷰 일정이 등록되어 있습니다.',
    edited: false,
  },
];

// Seed proactive intervention logs
let proactiveLogs: ProactiveLog[] = [
  {
    id: 'act-1',
    date: '2026-09-27',
    time: '14:31',
    mode: 'study',
    type: '휴식 권유',
    reason: '50분 연속 학습 감지',
    utterance: '50분 동안 높은 집중력을 유지하셨어요. 10분간 눈의 피로를 풀고 휴식을 취하세요.',
    userResponded: true,
  },
  {
    id: 'act-2',
    date: '2026-09-27',
    time: '14:06',
    mode: 'study',
    type: '학습 타이머',
    reason: '학습 시작 발화 인지 및 뽀모도로 제안',
    utterance: '25분 집중 세션을 시작할까요? 목표 단어 카드를 펼쳐둘게요.',
    userResponded: true,
  },
  {
    id: 'act-3',
    date: '2026-09-27',
    time: '11:30',
    mode: 'study',
    type: '복습 퀴즈',
    reason: '망각곡선 주기 도달 (어제 외운 단어 5개)',
    utterance: '어제 학습한 핵심 단어 3개 기억나시나요? 1분 미니 퀴즈를 풀어볼까요?',
    userResponded: true,
  },
  {
    id: 'act-4',
    date: '2026-09-27',
    time: '10:15',
    mode: 'study',
    type: '집중력 환기',
    reason: '잦은 자리 이탈 및 침묵 감지',
    utterance: '잠시 스트레칭을 하고 기분 전환용 잔잔한 클래식 음악을 틀어드릴까요?',
    userResponded: false,
  },
  {
    id: 'act-5',
    date: '2026-09-27',
    time: '09:00',
    mode: 'study',
    type: '학습 타이머',
    reason: '오전 일과 시작 시간 루틴 알림',
    utterance: '오전 공부 블록 시간입니다. 오늘의 1순위 태스크를 설정해보세요.',
    userResponded: true,
  },
  {
    id: 'act-6',
    date: '2026-09-27',
    time: '08:15',
    mode: 'study',
    type: '집중력 환기',
    reason: '기상 직후 루틴 격려',
    utterance: '상쾌한 아침이에요! 물 한 잔 드시고 하루를 시작해보세요.',
    userResponded: true,
  },
];

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// 1. Robot Status
app.get('/api/v1/robot/status', (req, res) => {
  res.json({
    success: true,
    data: robotStatus,
  });
});

app.post('/api/v1/robot/status/toggle-online', (req, res) => {
  robotStatus.online = !robotStatus.online;
  if (!robotStatus.online) {
    robotStatus.status = 'idle';
  }
  res.json({
    success: true,
    data: robotStatus,
  });
});

app.post('/api/v1/robot/status/state', (req, res) => {
  const { status } = req.body;
  if (['idle', 'speaking', 'intervening'].includes(status)) {
    robotStatus.status = status;
  }
  res.json({
    success: true,
    data: robotStatus,
  });
});

// 2. Chat Conversations (Long-Term Memory DB)
app.get('/api/v1/chats', (req, res) => {
  const queryDate = (req.query.date as string) || '2026-09-27';
  const filtered = chats.filter((c) => c.date === queryDate);
  res.json({
    success: true,
    date: queryDate,
    data: filtered,
    total: filtered.length,
  });
});

app.post('/api/v1/chats/messages', (req, res) => {
  const { date, sender, text } = req.body;
  if (!text || !sender) {
    res.status(400).json({ success: false, message: 'sender and text are required' });
    return;
  }

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const targetDate = date || '2026-09-27';

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}`,
    date: targetDate,
    time: timeStr,
    sender,
    text,
    edited: false,
  };

  chats.push(newMsg);

  if (sender === 'robot') {
    robotStatus.status = 'speaking';
    setTimeout(() => {
      if (robotStatus.status === 'speaking') {
        robotStatus.status = 'idle';
      }
    }, 4000);
  }

  res.status(201).json({
    success: true,
    data: newMsg,
  });
});

app.patch('/api/v1/chats/messages/:id', (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  const target = chats.find((c) => c.id === id);
  if (!target) {
    res.status(404).json({ success: false, message: 'Message not found' });
    return;
  }

  if (typeof text === 'string') {
    target.text = text;
    target.edited = true;
  }

  res.json({
    success: true,
    data: target,
  });
});

app.delete('/api/v1/chats/messages/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = chats.length;
  chats = chats.filter((c) => c.id !== id);

  if (chats.length === initialLen) {
    res.status(404).json({ success: false, message: 'Message not found' });
    return;
  }

  res.json({
    success: true,
    message: 'Message deleted successfully',
  });
});

app.delete('/api/v1/chats', (req, res) => {
  const queryDate = req.query.date as string;
  if (!queryDate) {
    res.status(400).json({ success: false, message: 'date query parameter required' });
    return;
  }

  const deletedCount = chats.filter((c) => c.date === queryDate).length;
  chats = chats.filter((c) => c.date !== queryDate);

  res.json({
    success: true,
    message: `Deleted ${deletedCount} messages for date ${queryDate}`,
  });
});

// 3. Proactive Interventions
app.get('/api/v1/robot/proactive-logs', (req, res) => {
  const period = (req.query.period as string) || 'today';
  const todayStr = '2026-09-27';
  const yesterdayStr = '2026-09-26';

  const todayLogs = proactiveLogs.filter((l) => l.date === todayStr);
  const yesterdayLogs = proactiveLogs.filter((l) => l.date === yesterdayStr);

  const todayCount = todayLogs.length;
  const yesterdayCount = yesterdayLogs.length;
  const diffCount = todayCount - yesterdayCount;
  const diffPercent = yesterdayCount > 0 ? Math.round((diffCount / yesterdayCount) * 100) : 100;

  const respondedCount = todayLogs.filter((l) => l.userResponded).length;
  const responseRate = todayCount > 0 ? Math.round((respondedCount / todayCount) * 100) : 0;

  const typeMap: Record<string, { mode: 'study' | 'cooking'; count: number; label: string }> = {};
  todayLogs.forEach((log) => {
    if (!typeMap[log.type]) {
      typeMap[log.type] = {
        mode: log.mode,
        count: 0,
        label: log.type,
      };
    }
    typeMap[log.type].count += 1;
  });

  const typeBreakdown = Object.entries(typeMap).map(([type, val]) => ({
    type,
    mode: val.mode,
    count: val.count,
    label: val.label,
  }));

  res.json({
    success: true,
    data: {
      period,
      todayCount,
      yesterdayCount,
      diffCount,
      diffPercent,
      responseRate,
      typeBreakdown,
      recentLogs: todayLogs,
    },
  });
});

app.post('/api/v1/robot/proactive-logs/trigger', (req, res) => {
  const { mode, type, reason, utterance } = req.body;
  const activeMode = mode || robotProfile.character;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const defaultTemplates = {
    study: [
      {
        type: '휴식 권유',
        reason: '50분 연속 학습 감지',
        utterance: '50분 동안 높은 집중력을 유지하셨어요. 10분간 눈의 피로를 풀고 휴식을 취하세요.',
      },
      {
        type: '복습 퀴즈',
        reason: '오늘 외운 단어 회상 주기 도달',
        utterance: '아까 학습한 첫 번째 핵심 단어의 뜻이 무엇이었는지 기억나시나요?',
      },
      {
        type: '집중력 환기',
        reason: '30분간 조용한 상태 감지',
        utterance: '잘 집중하고 계시네요. 현재 진도율 60%를 돌파했습니다!',
      },
    ],
    cooking: [
      {
        type: '타이머 알림',
        reason: '조리 단계 기준 타이머 도달',
        utterance: '소스가 자작하게 졸아들었습니다. 파마산 치즈를 넣을 타이밍이에요!',
      },
      {
        type: '다음 조리 단계 안내',
        reason: '팬 가열 안정화 감지',
        utterance: '올리브유 향이 올라왔습니다. 준비해둔 양파를 팬에 넣어 볶아주세요.',
      },
      {
        type: '불 조절 확인',
        reason: '냄비 끓어넘침 방지 센서 감지',
        utterance: '물이 끓어넘칠 수 있으니 뚜껑을 반쯤 열고 중약불로 조절하세요.',
      },
    ],
  };

  const pool = defaultTemplates[activeMode as 'study' | 'cooking'] || defaultTemplates.study;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  const newLog: ProactiveLog = {
    id: `act-${Date.now()}`,
    date: '2026-09-27',
    time: timeStr,
    mode: activeMode,
    type: type || picked.type,
    reason: reason || picked.reason,
    utterance: utterance || picked.utterance,
    userResponded: true,
  };

  proactiveLogs.unshift(newLog);

  robotStatus.status = 'intervening';
  setTimeout(() => {
    if (robotStatus.status === 'intervening') {
      robotStatus.status = 'idle';
    }
  }, 4000);

  res.status(201).json({
    success: true,
    data: newLog,
  });
});

// 4. Custom MP3 Voice Training & Models API
app.get('/api/v1/robot/voice-models', (req, res) => {
  res.json({
    success: true,
    data: trainedVoiceModels,
  });
});

// Train a new voice model using uploaded MP3 voice sample
app.post('/api/v1/robot/voice-models/train', (req, res) => {
  const {
    name,
    fileName,
    fileSizeMb,
    durationSec,
    characterTarget,
    toneStyle,
    samplePhrase,
  } = req.body;

  const targetMode = characterTarget || robotProfile.character;
  const isCooking = targetMode === 'cooking';

  const newModel: TrainedVoiceModel = {
    id: `voice-model-${Date.now()}`,
    name: name || (isCooking ? '커스텀 요리 음성 모델' : '커스텀 학습 음성 모델'),
    fileName: fileName || 'recorded_voice_sample.mp3',
    fileSizeMb: Number(fileSizeMb) || 2.2,
    durationSec: Number(durationSec) || 38,
    characterTarget: targetMode,
    similarityScore: Number((96.5 + Math.random() * 2.8).toFixed(1)),
    status: 'ready',
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    samplePhrase:
      samplePhrase ||
      (isCooking
        ? 'MP3 목소리 학습이 완료되었습니다. 조리 타이머와 재료 손질 과정을 가이드해드릴게요!'
        : 'MP3 목소리 학습이 완료되었습니다. 집중력 관리와 뽀모도로 세션을 함께 진행해요!'),
    toneStyle: toneStyle || (isCooking ? 'energetic' : 'calm'),
    pitchOffset: toneStyle === 'energetic' ? 1.05 : 0.95,
  };

  trainedVoiceModels.unshift(newModel);

  // Automatically activate the newly trained voice model
  robotProfile.activeVoiceModelId = newModel.id;
  robotProfile.voiceName = newModel.name;
  robotProfile.updatedAt = new Date().toISOString();

  res.status(201).json({
    success: true,
    data: newModel,
    message: 'MP3 음성 파일로 AI 목소리 학습이 성공적으로 완료되었습니다.',
  });
});

// Delete custom voice model
app.delete('/api/v1/robot/voice-models/:id', (req, res) => {
  const { id } = req.params;
  trainedVoiceModels = trainedVoiceModels.filter((v) => v.id !== id);

  if (robotProfile.activeVoiceModelId === id && trainedVoiceModels.length > 0) {
    robotProfile.activeVoiceModelId = trainedVoiceModels[0].id;
    robotProfile.voiceName = trainedVoiceModels[0].name;
  }

  res.json({
    success: true,
    message: '음성 모델이 삭제되었습니다.',
  });
});

// 5. Robot Character Profile & Voice Settings
app.get('/api/v1/robot/profile', (req, res) => {
  res.json({
    success: true,
    data: robotProfile,
  });
});

app.put('/api/v1/robot/profile', (req, res) => {
  const { character, activeVoiceModelId, speed, pitch } = req.body;

  if (character && ['study', 'cooking'].includes(character)) {
    robotProfile.character = character;
  }
  if (activeVoiceModelId) {
    robotProfile.activeVoiceModelId = activeVoiceModelId;
    const model = trainedVoiceModels.find((v) => v.id === activeVoiceModelId);
    if (model) {
      robotProfile.voiceName = model.name;
    }
  }
  if (typeof speed === 'number') {
    robotProfile.speed = Math.max(0.7, Math.min(1.5, speed));
  }
  if (typeof pitch === 'number') {
    robotProfile.pitch = Math.max(0.7, Math.min(1.3, pitch));
  }
  robotProfile.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: robotProfile,
    message: '설정이 로봇에 실시간 동기화되었습니다.',
  });
});

// -------------------------------------------------------------
// Vite Server Integration
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MindMate] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[MindMate] Failed to start server:', err);
});
