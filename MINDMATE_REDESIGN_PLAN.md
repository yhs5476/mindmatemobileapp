# 🧠 MindMate 장기기억 및 인지 콘솔 고도화 계획

본 문서는 MindMate의 장기기억 백엔드(FastAPI + pgvector + Mem0 + Generative Agents 기반 인지 엔진)와 모바일 웹 콘솔을 완벽히 융합하기 위한 **단계별 실행 체크리스트**입니다.

---

## 📌 목표 및 핵심 방향
1. **단순 대화 로그 뷰어 탈피**: 원본 대화(`raw_sessions`)만 보여주던 화면에서, 로봇이 실제로 학습하고 기억한 **원자적 사실(`memory_facts`)**과 **상위 인지 통찰(`reflections`)**을 시각화하고 제어하는 **"로봇의 두뇌 관제 센터"**로 도약.
2. **세션 ➔ 기억 추출 파이프라인 완성**: 대화 세션 종료 후 LLM 기반 ADD/UPDATE/CONFLICT 메모리 추출 트리거 및 실시간 상태 동기화.
3. **캐릭터별 프라이버시 격리(MAP) 시각화**: 학습 메이트(Study)와 요리 메이트(Cooking)의 **Memory Access Policy**에 따른 기억 주입 현황을 실시간 비교 검토.
4. **Human-in-the-Loop 제어권 보장**: 잘못 추출된 기억의 수정/삭제 및 사용자 프로필 동기화.

---

## 📋 단계별 실행 체크리스트 (Phase-by-Phase Roadmap)

### [Phase 1] 대화 관리 탭 & 장기기억(Facts) 추출 파이프라인 연동 (✅ 완료)
> **목표:** 날짜별 대화 원본 세션과 함께 해당 세션에서 도출된 사실(Facts)을 한눈에 파악하고, 미추출 세션은 원클릭으로 추출할 수 있게 구현.

- [x] **1.1. 프록시 API 엔드포인트 확장 (`api/index.ts`)**
  - [x] `GET /api/v1/facts`: 사용자 전체 또는 세션 연관 장기기억 사실 조회
  - [x] `POST /api/v1/sessions/:sessionId/extract`: 특정 세션의 AI 기억 추출 트리거
  - [x] `POST /api/v1/facts/extract-all`: 전체 세션 일괄 추출 트리거
- [x] **1.2. 대화 세션 카드 UI 고도화 (`src/components/tabs/ConversationTab.tsx`)**
  - [x] 세션 상단에 `AI 장기기억 사실 (Mem0 Facts)` 패널 및 `[N건 기억됨]` / `[기억 미추출]` 배지 표시
  - [x] 추출된 사실 칩(Chip) 표시 (`#영어`, `#영단어`, `중요도 ★`, `신뢰도 %`, `📚 공부 전용 / 🌐 전체 공유`)
  - [x] `[기억 추출하기]` 및 `[전체 일괄 추출]` 원클릭 트리거 버튼
- [x] **1.3. 추출 결과 인라인 피드백 및 실시간 갱신**
  - [x] 실시간 추출 진행 상태 피드백 (스피너 & 토스트 메시지)
  - [x] 갱신된 사실 즉시 로컬 상태 및 UI 반영

---

### [Phase 2] 선제 개입 탭 ➔ 로봇 인지 & 장기기억 대시보드(Reflections Hub) 개편
> **목표:** 기존의 정적 모의 알림을 넘어, 로봇이 스스로 합성한 상위 인사이트(`reflections`)와 카테고리별 장기기억(`facts`) 브라우저로 업그레이드.

- [ ] **2.1. 인지 및 통찰 API 연동 (`api/index.ts`)**
  - [ ] `GET /api/users/:userId/reflections`: 로봇이 도출한 상위 인사이트 목록 조회
  - [ ] `POST /api/users/:userId/reflect`: 누적된 Facts에서 신규 Reflection 합성 트리거
  - [ ] `GET /api/users/:userId/facts/search`: 질문/키워드 기반 가중치(Weighted) 벡터 검색
- [ ] **2.2. 로봇 두뇌 대시보드 UI 구현 (`src/components/ProactiveIntervention.tsx`)**
  - [ ] **섹션 A: 로봇이 깨달은 나의 특성 (Reflections 카드)**
    - 예: *"조형주 님은 밤 10시 이후 집중도가 높으며, 시험 전날 커피를 평소보다 2배 자주 마십니다."*
    - 근거가 된 사실 ID(Source Facts) 연결 및 생성 일시 표기
    - `[새로운 통찰 합성하기]` 수동 트리거 버튼
  - [ ] **섹션 B: 카테고리별 장기기억(Facts) 브라우저**
    - 도메인 태그 필터: `#식습관`, `#학습/일정`, `#취미`, `#건강/생활`
    - 중요도(1~10 별점), 신뢰도(Confidence), 유효기간(`valid_until`) 표기
    - 검색창: 자연어 질문으로 로봇의 기억 검색 (`q=좋아하는 음식`)
  - [ ] **섹션 C: 선제 개입 이력 로그 (Proactive Action History)**
    - 로봇이 해당 기억/습관을 바탕으로 실제 먼저 말을 건 사유와 발화 기록 연계

---

### [Phase 3] 멀티 캐릭터 프라이버시(MAP) & 메모리 팩 인스펙터
> **목표:** 학습 메이트와 요리 메이트가 사용자 기억을 어떻게 격리(Shared vs Private)하여 음성 프롬프트에 주입하는지 투명하게 시각화.

- [ ] **3.1. 캐릭터 메모리 팩 API 연동 (`api/index.ts`)**
  - [ ] `GET /api/users/:userId/characters/:characterId/memory-pack`: Realtime 세션용 완성형 프롬프트 팩 조회
- [ ] **3.2. 메모리 팩 인스펙터 뷰어 구현 (`src/components/CharacterVoiceSettings.tsx`)**
  - [ ] **캐릭터별 기억 격리 비교 탭**:
    - 📚 **공부 메이트**: 학습/일정 관련 Shared + Study Private 기억만 포함된 프롬프트 미리보기
    - 🍳 **요리 메이트**: 음식/주방 관련 Shared + Cooking Private 기억만 포함된 프롬프트 미리보기
  - [ ] **MAP(Memory Access Policy) 차단 사유 통계**:
    - 허용된 기억 수(`allowed`), 차단된 타 캐릭터 기억 수(`blocked`) 실시간 확인
- [ ] **3.3. 사용자 프로필(페르소나/습관/정보) 실시간 동기화**
  - [ ] `GET /api/users/:userId`: 클라우드 DB의 `users` 테이블 프로필(이름, 페르소나, 습관, 거주정보) 로드
  - [ ] 클라이언트 설정과 클라우드 DB 프로필의 일치성 보장

---

### [Phase 4] 백엔드(FastAPI) 파이프라인 자동화 및 제어권(Human-in-the-Loop) 추가
> **목표:** 클라우드 서버 코드에 자동화 및 편집 권한 API를 추가하여 서비스 완성도 극대화.

- [ ] **4.1. 세션 적재 시 비동기 자동 기억 추출 (`BackgroundTasks`)**
  - [ ] `POST /users/{user_id}/sessions`에 `auto_extract=true` 쿼리 파라미터 지원
  - [ ] 세션 INSERT 완료 후 응답은 즉시 반환하고, 백그라운드 스레드에서 `extract_facts` 및 섹션 갱신 자동 수행
- [ ] **4.2. 사용자 프로필 수정 엔드포인트 (`PATCH /users/{user_id}`) 신설**
  - [ ] `persona`, `robot_name`, `job`, `living_info`, `habit` 필드 동적 갱신 지원
- [ ] **4.3. 기억 제어(수정/삭제) 엔드포인트 신설**
  - [ ] `DELETE /users/{user_id}/facts/{memory_id}`: 오기억 삭제 또는 즉시 만료 처리
  - [ ] `PATCH /users/{user_id}/facts/{memory_id}`: 사실 내용 수정 또는 프라이버시 스코프(`shared` ↔ `character_private`) 변경

---

### [Phase 5] 시스템 안정화, E2E 검증 및 실전 배포
> **목표:** 클라우드 DB 연동의 견고성 확보 및 Vercel 배포 완료.

- [ ] **5.1. Graceful Fallback & 로컬 캐싱 강화**
  - [ ] OpenAI/DB 지연 발생 시 UI 멈춤 방지 (Skeleton UI & Toast 알림)
  - [ ] 네트워크 오프라인 시 인메모리/로컬스토리지 백업 모드 유지
- [ ] **5.2. 모바일 반응형 터치 및 테마 완성도 검증**
  - [ ] 웜 베이지 & 세이지 그린 컬러 시스템의 일관성 유지
  - [ ] 한 손 조작에 최적화된 하단 탭 및 모달 인터랙션
- [ ] **5.3. Vercel 프로덕션 배포 및 라이브 E2E 테스트**
  - [ ] Vercel Serverless Function 환경 변수(`MINDMATE_USER_ID`, `MINDMATE_API_KEY`) 정합성 검증
  - [ ] 실시간 라이브 URL (`https://mindmatemobileapp-y5ca-dun.vercel.app/`) 최종 검증

---

## 🗓️ 권장 진행 순서
```
[Phase 1: 대화 탭 기억 추출] ──► [Phase 2: 로봇 통찰 대시보드] ──► [Phase 3: 캐릭터 메모리 팩] ──► [Phase 4 & 5: 백엔드 고도화 및 배포]
```
각 단계가 완료될 때마다 본 체크리스트의 항목을 `[x]`로 갱신하여 프로젝트 진척도를 투명하게 관리합니다.
