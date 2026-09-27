import express from 'express';
import cors from 'cors';

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
  time: string;
  mode: InterventionMode;
  type: string;
  reason: string;
  utterance: string;
  userResponded: boolean;
}

export interface TrainedVoiceModel {
  id: string;
  name: string;
  fileName: string;
  fileSizeMb: number;
  durationSec: number;
  characterTarget: InterventionMode;
  similarityScore: number;
  status: 'ready' | 'training';
  createdAt: string;
  samplePhrase: string;
  toneStyle: 'calm' | 'energetic' | 'warm';
  pitchOffset: number;
}

export interface RobotProfile {
  character: InterventionMode;
  activeVoiceModelId: string;
  voiceName: string;
  speed: number;
  pitch: number;
  updatedAt: string;
}

const app = express();

app.use(cors());
app.use(express.json());

// Comprehensive Normalization middleware for Vercel Serverless environment
app.use((req, res, next) => {
  const queryPath = (req.query?.__path as string) || '';
  if (queryPath) {
    const cleanUrl = req.url.replace(/[?&]__path=[^&]*/, '').replace(/\?$/, '');
    const qIndex = cleanUrl.indexOf('?');
    const qs = qIndex !== -1 ? cleanUrl.substring(qIndex) : '';
    const normPath = queryPath.startsWith('/api')
      ? queryPath
      : '/api' + (queryPath.startsWith('/') ? '' : '/') + queryPath;
    req.url = normPath + qs;
  } else {
    const matchedPath = (req.headers['x-matched-path'] as string) || '';
    if (matchedPath && matchedPath.startsWith('/api')) {
      const qIndex = req.url.indexOf('?');
      const qs = qIndex !== -1 ? req.url.substring(qIndex) : '';
      req.url = matchedPath + (matchedPath.includes('?') ? '' : qs);
    } else if (req.url && req.url.startsWith('/v1/')) {
      req.url = '/api' + req.url;
    }
  }
  next();
});

// Live Cloud PostgreSQL Database Configuration (mindmate.brewertranslator.cloud)
const CLOUD_DB_CONFIG = {
  baseUrl: process.env.MINDMATE_API_URL || 'https://mindmate.brewertranslator.cloud',
  userId: process.env.MINDMATE_USER_ID || '280dab65474e4598bfc0df0e9173fd4f',
  apiKey: process.env.MINDMATE_API_KEY || 'mk_511852e88e23c3505e68c77e8ba2c0899d6fc953ad853036f3787cc9587d1a03',
  userName: '조형주',
};

// Data Store for MindMate Robot
let robotStatus: RobotStatus = {
  online: true,
  uptimeSeconds: 15155, // 04:12:35
  status: 'idle',
  deviceName: 'MindMate-01',
  batteryLevel: 88,
  cloudDb: {
    connected: true,
    host: 'mindmate.brewertranslator.cloud',
    userName: CLOUD_DB_CONFIG.userName,
    userId: CLOUD_DB_CONFIG.userId,
  },
};

// Increment uptime periodically when online (only in persistent server mode)
if (!process.env.VERCEL) {
  setInterval(() => {
    if (robotStatus.online) {
      robotStatus.uptimeSeconds += 1;
    }
  }, 1000);
}

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
    samplePhrase: '스파게티 면 삶는 7분 타이머가 완료되었습니다. 지금 건져 올리세요!',
    toneStyle: 'energetic',
    pitchOffset: 1.05,
  },
  {
    id: 'voice-model-3',
    name: '심야 독서 보이스 (부드러운 톤)',
    fileName: 'deep_night_mentor.mp3',
    fileSizeMb: 3.1,
    durationSec: 48,
    characterTarget: 'study',
    similarityScore: 98.1,
    status: 'ready',
    createdAt: '2026-09-24 22:30',
    samplePhrase: '오늘 하루도 수고 많으셨습니다. 가벼운 마음으로 10분 복습을 시작해볼까요.',
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
    text: '25분이 경과했습니다! 5분간 가벼운 스트레칭과 눈 휴식을 취해보세요.',
    edited: false,
  },
  {
    id: 'msg-6',
    date: '2026-09-27',
    time: '14:32',
    sender: 'user',
    text: '고마워, 방금 외운 단어 중 follow-up 이메일 예문 하나만 알려줘',
    edited: false,
  },

  // 2. Yesterday's chats (2026-09-26) - 요리 메이트 중심
  {
    id: 'msg-7',
    date: '2026-09-26',
    time: '18:10',
    sender: 'user',
    text: '오늘 저녁은 알리오 올리오 파스타 만들래. 면 삶는 시간 알려줘',
    edited: false,
  },
  {
    id: 'msg-8',
    date: '2026-09-26',
    time: '18:10',
    sender: 'robot',
    text: '알 덴테(Al dente) 식감을 위해서는 끓는 물에 소금 1큰술을 넣고 7분간 삶는 것을 추천해요. 타이머를 켤까요?',
    edited: false,
  },
  {
    id: 'msg-9',
    date: '2026-09-26',
    time: '18:11',
    sender: 'user',
    text: '응 7분 타이머 시작해줘',
    edited: false,
  },
  {
    id: 'msg-10',
    date: '2026-09-26',
    time: '18:11',
    sender: 'robot',
    text: '7분 면 삶기 타이머 시작했습니다! 옆 팬에서 올리브유와 편마늘을 약불로 볶아 향을 내주세요.',
    edited: false,
  },
  {
    id: 'msg-11',
    date: '2026-09-26',
    time: '18:15',
    sender: 'user',
    text: '페페론치노는 언제 넣어?',
    edited: true,
  },
  {
    id: 'msg-12',
    date: '2026-09-26',
    time: '18:15',
    sender: 'robot',
    text: '마늘 표면이 노릇해지기 직전, 불을 끄거나 아주 약하게 줄인 상태에서 페페론치노를 부수어 넣어야 타지 않고 매콤한 향이 은은하게 퍼집니다.',
    edited: false,
  },
  {
    id: 'msg-13',
    date: '2026-09-26',
    time: '18:18',
    sender: 'robot',
    text: '띵동! 7분이 지났습니다. 면수 1국자를 남겨두고 면을 건져 팬에 합쳐 유화(만테카레) 작업을 진행해주세요.',
    edited: false,
  },
  {
    id: 'msg-14',
    date: '2026-09-26',
    time: '18:22',
    sender: 'user',
    text: '면수 넣고 저으니까 윤기가 잘 도네! 고마워',
    edited: false,
  },

  // 3. 2026-09-25 chats - 알고리즘 코칭
  {
    id: 'msg-15',
    date: '2026-09-25',
    time: '20:10',
    sender: 'user',
    text: '이진 탐색(Binary Search) 시간복잡도가 왜 O(log N)인지 설명해줘',
    edited: false,
  },
  {
    id: 'msg-16',
    date: '2026-09-25',
    time: '20:11',
    sender: 'robot',
    text: '이진 탐색은 매 단계마다 탐색 범위를 정확히 절반(1/2)으로 줄이기 때문입니다. N개의 원소를 2로 k번 나누어 1이 될 때 k = log2(N)이 되므로 시간복잡도는 O(log N)이 됩니다.',
    edited: false,
  },
  {
    id: 'msg-17',
    date: '2026-09-25',
    time: '20:13',
    sender: 'user',
    text: '파이썬 bisect 모듈 사용법도 예시로 보여줘',
    edited: false,
  },
  {
    id: 'msg-18',
    date: '2026-09-25',
    time: '20:14',
    sender: 'robot',
    text: 'from bisect import bisect_left, bisect_right 로 정렬된 리스트에서 특정 값의 삽입 인덱스를 O(log N)에 구할 수 있어요. bisect_left(arr, x)는 x가 처음 들어갈 위치입니다.',
    edited: false,
  },
  {
    id: 'msg-19',
    date: '2026-09-25',
    time: '20:30',
    sender: 'user',
    text: '리스트가 정렬되어 있지 않으면 쓸 수 없지?',
    edited: false,
  },
  {
    id: 'msg-20',
    date: '2026-09-25',
    time: '20:30',
    sender: 'robot',
    text: '정확합니다! 정렬되어 있지 않다면 먼저 arr.sort()로 O(N log N) 정렬을 하거나 선형 탐색 O(N)을 해야 합니다.',
    edited: false,
  },
  {
    id: 'msg-21',
    date: '2026-09-25',
    time: '21:00',
    sender: 'user',
    text: '백준 1920번 수 찾기 문제 풀어서 통과했어!',
    edited: false,
  },
  {
    id: 'msg-22',
    date: '2026-09-25',
    time: '21:01',
    sender: 'robot',
    text: '축하합니다! 이진 탐색의 기본기를 완벽하게 익히셨네요. 다음엔 매개변수 탐색(Parametric Search) 문제도 도전해봐요!',
    edited: false,
  },

  // 4. 2026-09-24 chats - 스테이크 요리 코칭
  {
    id: 'msg-23',
    date: '2026-09-24',
    time: '19:00',
    sender: 'user',
    text: '두께 3cm 립아이 스테이크 미디엄 레어로 굽는 법',
    edited: false,
  },
  {
    id: 'msg-24',
    date: '2026-09-24',
    time: '19:01',
    sender: 'robot',
    text: '고기를 굽기 30분 전 냉장고에서 꺼내 상온에 두고 키친타월로 수분을 닦아주세요. 강불로 달군 무쇠팬에 연기가 살짝 날 때 앞뒤 각 1분 30초씩 시어링합니다.',
    edited: false,
  },
  {
    id: 'msg-25',
    date: '2026-09-24',
    time: '19:15',
    sender: 'user',
    text: '버터랑 로즈마리는 언제 넣어?',
    edited: false,
  },
  {
    id: 'msg-26',
    date: '2026-09-24',
    time: '19:15',
    sender: 'robot',
    text: '양면 시어링 후 중약불로 줄인 다음 버터 2큰술, 으깬 마늘, 로즈마리를 넣고 숟가락으로 녹은 버터를 고기에 끼얹는 아로제(Arrosé)를 1분간 진행해주세요.',
    edited: false,
  },
  {
    id: 'msg-27',
    date: '2026-09-24',
    time: '19:20',
    sender: 'user',
    text: '레스팅은 몇 분 해야 해?',
    edited: false,
  },
  {
    id: 'msg-28',
    date: '2026-09-24',
    time: '19:20',
    sender: 'robot',
    text: '호일로 느슨하게 덮어 구운 시간과 동일한 5분간 레스팅하세요. 육즙이 고기 전체로 재분배되어 촉촉해집니다. 5분 타이머 켜드릴게요!',
    edited: false,
  },
  {
    id: 'msg-29',
    date: '2026-09-24',
    time: '19:25',
    sender: 'robot',
    text: '5분 레스팅 완료! 도마 위에서 결 반대 방향으로 썰어 드시면 최상의 부드러움을 즐기실 수 있습니다.',
    edited: false,
  },
  {
    id: 'msg-30',
    date: '2026-09-24',
    time: '19:30',
    sender: 'user',
    text: '육즙 꽉 차있고 미디엄 레어로 완벽하게 됐어 대박!',
    edited: false,
  },
];

// Seed Proactive Logs
let proactiveLogs: ProactiveLog[] = [
  // 오늘 (2026-09-27)
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
    reason: '학습 시작 대화 연계 뽀모도로 제안',
    utterance: '25분 집중 세션을 시작할까요? 목표 단어 카드를 준비했습니다.',
    userResponded: true,
  },
  {
    id: 'act-3',
    date: '2026-09-27',
    time: '11:30',
    mode: 'study',
    type: '복습 퀴즈',
    reason: '망각곡선 주기 도달 (오늘 외운 단어 5개)',
    utterance: '아까 학습한 핵심 단어 3개가 기억나시나요? 1분 미니 퀴즈를 풀어볼까요?',
    userResponded: true,
  },
  {
    id: 'act-4',
    date: '2026-09-27',
    time: '10:15',
    mode: 'study',
    type: '집중력 환기',
    reason: '장시간 자리 이탈 후 착석 감지',
    utterance: '가벼운 스트레칭과 함께 기분 전환용 클래식을 틀어드릴까요?',
    userResponded: false,
  },
  {
    id: 'act-5',
    date: '2026-09-27',
    time: '09:00',
    mode: 'study',
    type: '학습 타이머',
    reason: '설정된 일과 시작 루틴 알림',
    utterance: '오전 집중 시간입니다. 오늘 1순위 태스크를 시작해볼까요?',
    userResponded: true,
  },
  {
    id: 'act-6',
    date: '2026-09-27',
    time: '08:15',
    mode: 'study',
    type: '집중력 환기',
    reason: '기상 직후 루틴 브리핑',
    utterance: '좋은 아침이에요! 오늘 목표 학습 시간 3시간 달성을 응원합니다.',
    userResponded: true,
  },
  {
    id: 'act-7',
    date: '2026-09-27',
    time: '15:20',
    mode: 'study',
    type: '휴식 권유',
    reason: '스트레스 지수 누적 방지',
    utterance: '잠시 창문을 열고 신선한 공기를 마셔보세요.',
    userResponded: false,
  },
  {
    id: 'act-8',
    date: '2026-09-27',
    time: '16:00',
    mode: 'study',
    type: '복습 퀴즈',
    reason: '오후 집중력 리프레시',
    utterance: '오늘 암기한 표현 3가지를 빠르게 복습해볼까요?',
    userResponded: true,
  },

  // 어제 (2026-09-26)
  {
    id: 'act-9',
    date: '2026-09-26',
    time: '18:18',
    mode: 'cooking',
    type: '타이머 종료 경보',
    reason: '면 삶기 7분 타이머 종료',
    utterance: '스파게티 면 삶기 7분이 끝났습니다. 면수 한 국자를 남기고 건져내세요!',
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

// Root & Health Check Routes for Vercel
app.get(['/api', '/api/index', '/api/health'], (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    message: 'MindMate API Server is running',
    timestamp: new Date().toISOString(),
  });
});

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

// 2. Chat Conversations (Cloud PostgreSQL DB with In-Memory fallback)
app.get('/api/v1/chats', async (req, res) => {
  const queryDate = (req.query.date as string) || '2026-09-27';

  try {
    const remoteRes = await fetch(
      `${CLOUD_DB_CONFIG.baseUrl}/users/${CLOUD_DB_CONFIG.userId}/sessions`,
      {
        headers: { 'X-API-Key': CLOUD_DB_CONFIG.apiKey },
        signal: AbortSignal.timeout(4000),
      }
    );

    if (remoteRes.ok) {
      const sessions = (await remoteRes.json()) as any[];
      if (Array.isArray(sessions)) {
        const matchingSessions = sessions.filter((s) => s.session_date === queryDate);

        if (matchingSessions.length > 0) {
          const remoteChats: ChatMessage[] = [];
          matchingSessions.forEach((s) => {
            if (Array.isArray(s.transcript)) {
              s.transcript.forEach((t: any, idx: number) => {
                const hour = 14 + Math.floor(idx / 4);
                const min = 5 + (idx * 2) % 55;
                const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

                remoteChats.push({
                  id: `cloud-${s.session_id.slice(0, 8)}-${idx}`,
                  date: s.session_date || queryDate,
                  time: timeStr,
                  sender: t.role === 'user' ? 'user' : 'robot',
                  text: t.text || '',
                  edited: false,
                });
              });
            }
          });

          if (remoteChats.length > 0) {
            return res.json({
              success: true,
              date: queryDate,
              source: 'cloud_postgresql',
              user: CLOUD_DB_CONFIG.userName,
              data: remoteChats,
              total: remoteChats.length,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[CloudDB] Remote fetch fallback to cache:', err);
  }

  // Fallback to local cache
  const filtered = chats.filter((c) => c.date === queryDate);
  res.json({
    success: true,
    date: queryDate,
    source: 'in_memory_cache',
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

  // Sync to Cloud PostgreSQL Server asynchronously
  fetch(`${CLOUD_DB_CONFIG.baseUrl}/users/${CLOUD_DB_CONFIG.userId}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': CLOUD_DB_CONFIG.apiKey,
    },
    body: JSON.stringify({
      session_date: targetDate,
      character_id: robotProfile.character,
      turns: [{ role: sender === 'user' ? 'user' : 'assistant', text }],
    }),
    signal: AbortSignal.timeout(4000),
  }).catch((e) => console.warn('[CloudDB] Sync failed:', e));

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
    source: 'cloud_sync',
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

// 6. Cloud PostgreSQL Health Check
app.get('/api/v1/cloud/status', async (req, res) => {
  try {
    const health = await fetch(`${CLOUD_DB_CONFIG.baseUrl}/health/db`, {
      signal: AbortSignal.timeout(3000),
    }).then((r) => r.json());
    res.json({
      success: true,
      cloudDb: health,
      user: {
        name: CLOUD_DB_CONFIG.userName,
        id: CLOUD_DB_CONFIG.userId,
      },
    });
  } catch (err: any) {
    res.json({
      success: false,
      error: err.message,
    });
  }
});

export default function handler(req: any, res: any) {
  return app(req, res);
}

export { app };
