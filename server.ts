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
  {
    id: 'voice-model-3',
    name: '심야 서재 멘토 보이스 (부드러운 저음)',
    fileName: 'deep_night_mentor.mp3',
    fileSizeMb: 3.1,
    durationSec: 48,
    characterTarget: 'study',
    similarityScore: 98.1,
    status: 'ready',
    createdAt: '2026-09-24 22:30',
    samplePhrase: '오늘 하루도 수고 많으셨습니다. 가벼운 복습으로 오늘의 학습을 정리해보세요.',
    toneStyle: 'warm',
    pitchOffset: 0.9,
  },
  {
    id: 'voice-model-4',
    name: '셰프 마르코 파스타 가이드 (명료한 낭독)',
    fileName: 'chef_marco_voice.mp3',
    fileSizeMb: 2.0,
    durationSec: 32,
    characterTarget: 'cooking',
    similarityScore: 95.8,
    status: 'ready',
    createdAt: '2026-09-24 11:15',
    samplePhrase: '팬에 올리브유를 두르고 마늘이 노릇해질 때까지 약불에서 천천히 향을 뽑아냅니다.',
    toneStyle: 'energetic',
    pitchOffset: 1.0,
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

// Seed chat conversations by date (Long-term memory DB)
let chats: ChatMessage[] = [
  // 1. Today's chats (2026-09-27) - 공부 메이트 중심
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
  {
    id: 'msg-7',
    date: '2026-09-27',
    time: '14:38',
    sender: 'user',
    text: '방금 외운 단어 3개 테스트해줘',
    edited: true,
  },
  {
    id: 'msg-8',
    date: '2026-09-27',
    time: '14:38',
    sender: 'robot',
    text: "좋아요! 첫 번째 질문입니다. '신중한, 빈틈없는'을 뜻하는 m으로 시작하는 형용사는 무엇일까요?",
    edited: false,
  },
  {
    id: 'msg-9',
    date: '2026-09-27',
    time: '14:39',
    sender: 'user',
    text: 'meticulous 맞아?',
    edited: false,
  },
  {
    id: 'msg-10',
    date: '2026-09-27',
    time: '14:39',
    sender: 'robot',
    text: '정답입니다! meticulous는 토익 빈출 어휘예요. 바로 다음 2번째 단어로 넘어갈까요?',
    edited: false,
  },

  // 2. Yesterday's chats (2026-09-26) - 요리 메이트 중심
  {
    id: 'msg-11',
    date: '2026-09-26',
    time: '12:15',
    sender: 'user',
    text: '오늘 점심 파스타 만들 건데 면 몇 분 삶아야 해?',
    edited: false,
  },
  {
    id: 'msg-12',
    date: '2026-09-26',
    time: '12:15',
    sender: 'robot',
    text: '스파게티 면 기준 알덴테는 7분, 부드러운 식감은 8분이 적당해요. 7분 타이머를 맞출까요?',
    edited: false,
  },
  {
    id: 'msg-13',
    date: '2026-09-26',
    time: '12:16',
    sender: 'user',
    text: '응 7분 맞춰줘',
    edited: false,
  },
  {
    id: 'msg-14',
    date: '2026-09-26',
    time: '12:16',
    sender: 'robot',
    text: '7분 타이머를 시작합니다. 끓는 물에 굵은 소금 반 스푼 넣으셨는지 확인해주세요!',
    edited: false,
  },
  {
    id: 'msg-15',
    date: '2026-09-26',
    time: '12:20',
    sender: 'user',
    text: '마늘은 언제 넣어야 타지 않아?',
    edited: false,
  },
  {
    id: 'msg-16',
    date: '2026-09-26',
    time: '12:20',
    sender: 'robot',
    text: '팬을 달구기 전 오일에 편마늘을 넣고, 약불에서 은은하게 황금빛이 돌 때까지 볶아주세요.',
    edited: false,
  },
  {
    id: 'msg-17',
    date: '2026-09-26',
    time: '12:23',
    sender: 'robot',
    text: '띵동! 7분 타이머가 끝났습니다. 면수를 한 국자 남겨두고 면을 건져주세요.',
    edited: true,
  },
  {
    id: 'msg-18',
    date: '2026-09-26',
    time: '12:24',
    sender: 'user',
    text: '알겠어, 올리브유 넣고 유화(에멀전) 작업 들어갈게',
    edited: false,
  },

  // 3. Previous date (2026-09-25) - 코딩 및 알고리즘 학습
  {
    id: 'msg-19',
    date: '2026-09-25',
    time: '09:10',
    sender: 'user',
    text: '오늘 일정 브리핑해줘',
    edited: false,
  },
  {
    id: 'msg-20',
    date: '2026-09-25',
    time: '09:10',
    sender: 'robot',
    text: '좋은 아침이에요! 오전 10시 알고리즘 스터디, 오후 2시 코딩 테스트 모의고사가 예정되어 있습니다.',
    edited: false,
  },
  {
    id: 'msg-21',
    date: '2026-09-25',
    time: '10:15',
    sender: 'user',
    text: '이진 탐색 시간 복잡도가 왜 O(log N)인지 쉽게 설명해줘',
    edited: true,
  },
  {
    id: 'msg-22',
    date: '2026-09-25',
    time: '10:15',
    sender: 'robot',
    text: '탐색을 한 번 진행할 때마다 남은 데이터가 절반으로 줄어들기 때문이에요. 1,000개의 데이터도 단 10번 만에 찾을 수 있습니다.',
    edited: false,
  },
  {
    id: 'msg-23',
    date: '2026-09-25',
    time: '11:30',
    sender: 'user',
    text: '오후 세션 전까지 DP(동적계획법) 문제 2개 먼저 풀어볼게',
    edited: false,
  },
  {
    id: 'msg-24',
    date: '2026-09-25',
    time: '11:30',
    sender: 'robot',
    text: '피보나치 수열과 계단 오르기 기본 문제를 추천드려요. 40분 타이머를 설정해둘까요?',
    edited: false,
  },

  // 4. 2026-09-24 - 스테이크 조리 테크닉
  {
    id: 'msg-25',
    date: '2026-09-24',
    time: '18:30',
    sender: 'user',
    text: '두께 3cm 소고기 안심 스테이크 굽는 법 알려줘',
    edited: false,
  },
  {
    id: 'msg-26',
    date: '2026-09-24',
    time: '18:30',
    sender: 'robot',
    text: '고기 겉면 수분을 키친타월로 완전히 닦아낸 뒤, 팬에서 연기가 살짝 날 때까지 강불로 충분히 예열해주세요.',
    edited: false,
  },
  {
    id: 'msg-27',
    date: '2026-09-24',
    time: '18:34',
    sender: 'user',
    text: '시어링할 때 얼마나 자주 뒤집어야 해?',
    edited: false,
  },
  {
    id: 'msg-28',
    date: '2026-09-24',
    time: '18:34',
    sender: 'robot',
    text: '30초~1분 간격으로 자주 뒤집어주면 겉은 바삭한 마이야르가 생기고 속은 고르게 익어 부드러운 미디움 레어가 됩니다.',
    edited: false,
  },
  {
    id: 'msg-29',
    date: '2026-09-24',
    time: '18:37',
    sender: 'user',
    text: '버터랑 로즈마리 넣고 끼얹는 타이밍은 언제야?',
    edited: false,
  },
  {
    id: 'msg-30',
    date: '2026-09-24',
    time: '18:37',
    sender: 'robot',
    text: '불을 중약불로 낮추고 버터 2조각, 으깬 마늘, 로즈마리를 넣고 녹은 버터를 고기에 끼얹는 아로제(Arroser)를 1분간 진행하세요.',
    edited: false,
  },
];

// Seed proactive intervention logs (선제 개입 이력)
let proactiveLogs: ProactiveLog[] = [
  // 1. Today (2026-09-27) - 총 8건 (공부 5건, 요리 3건, 반응 6건 -> 75% 반응률)
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
    time: '12:45',
    mode: 'cooking',
    type: '화력 조절 알림',
    reason: '팬 과열 및 고온 연기 감지',
    utterance: '팬 온도가 급격히 올라가고 있어요. 올리브유가 타기 전에 불을 중약불로 낮춰주세요.',
    userResponded: true,
  },
  {
    id: 'act-4',
    date: '2026-09-27',
    time: '12:23',
    mode: 'cooking',
    type: '타이머 종료 경보',
    reason: '스파게티 면 삶기 7분 타이머 종료',
    utterance: '띵동! 7분 알덴테 조리 시간이 완료되었습니다. 면수를 덜고 면을 건져내세요.',
    userResponded: true,
  },
  {
    id: 'act-5',
    date: '2026-09-27',
    time: '11:30',
    mode: 'study',
    type: '복습 퀴즈',
    reason: '망각곡선 주기 도달 (어제 외운 단어 5개)',
    utterance: '어제 학습한 핵심 단어 3개 기억나시나요? 1분 미니 퀴즈를 풀어볼까요?',
    userResponded: true,
  },
  {
    id: 'act-6',
    date: '2026-09-27',
    time: '10:15',
    mode: 'study',
    type: '집중력 환기',
    reason: '잦은 자리 이탈 및 침묵 감지',
    utterance: '잠시 스트레칭을 하고 기분 전환용 잔잔한 클래식 음악을 틀어드릴까요?',
    userResponded: false,
  },
  {
    id: 'act-7',
    date: '2026-09-27',
    time: '09:00',
    mode: 'study',
    type: '학습 타이머',
    reason: '오전 일과 시작 시간 루틴 알림',
    utterance: '오전 공부 블록 시간입니다. 오늘의 1순위 태스크를 설정해보세요.',
    userResponded: true,
  },
  {
    id: 'act-8',
    date: '2026-09-27',
    time: '08:15',
    mode: 'cooking',
    type: '레시피 순서 안내',
    reason: '아침 영양 밸런스 권장 알림',
    utterance: '좋은 아침이에요! 단백질 보충을 위해 그릭요거트와 달걀 프라이를 곁들여보세요.',
    userResponded: false,
  },

  // 2. Yesterday (2026-09-26) - 총 6건 (전일 대비 +2건 차이 계산용)
  {
    id: 'act-9',
    date: '2026-09-26',
    time: '18:40',
    mode: 'cooking',
    type: '화력 조절 알림',
    reason: '조리 완료 후 인덕션 잔열 주의',
    utterance: '조리가 끝났습니다. 상판이 아직 뜨거우니 주의하시고 전원을 꺼주세요.',
    userResponded: true,
  },
  {
    id: 'act-10',
    date: '2026-09-26',
    time: '16:00',
    mode: 'study',
    type: '휴식 권유',
    reason: '2시간 연속 업무 인지',
    utterance: '오후 집중 시간이 길어지고 있어요. 물을 한 잔 마시고 5분간 먼 곳을 바라보세요.',
    userResponded: true,
  },
  {
    id: 'act-11',
    date: '2026-09-26',
    time: '14:00',
    mode: 'study',
    type: '학습 타이머',
    reason: '오후 세션 시작 제안',
    utterance: '식사 후 졸음이 올 수 있어요. 가벼운 문제 풀이로 20분 세션을 시작할까요?',
    userResponded: true,
  },
  {
    id: 'act-12',
    date: '2026-09-26',
    time: '12:20',
    mode: 'cooking',
    type: '타이머 종료 경보',
    reason: '점심 식사 타이머 종료',
    utterance: '스파게티 면 조리가 끝났습니다. 맛있게 드세요!',
    userResponded: true,
  },
  {
    id: 'act-13',
    date: '2026-09-26',
    time: '10:30',
    mode: 'study',
    type: '복습 퀴즈',
    reason: '기억 유지 주기 도달',
    utterance: '오전에 학습한 개념을 한 줄로 요약해볼까요?',
    userResponded: false,
  },
  {
    id: 'act-14',
    date: '2026-09-26',
    time: '09:00',
    mode: 'study',
    type: '학습 타이머',
    reason: '일과 시작 루틴 알림',
    utterance: '새로운 하루의 학습을 시작할 시간입니다. 파이팅!',
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

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('[MindMate] Failed to start server:', err);
  });
}

export default app;
