import React, { useState, useEffect, useRef } from 'react';
import { RobotProfile, CharacterMode, TrainedVoiceModel } from '../../types';
import { playVoiceSample } from '../../utils/audio';
import {
  BookOpen,
  Utensils,
  UploadCloud,
  FileAudio,
  Play,
  Square,
  CheckCircle,
  Sliders,
  Check,
  Sparkles,
  Trash2,
  Mic,
  Cpu,
  Layers,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface SettingsTabProps {
  profile: RobotProfile;
  onSaveProfile: (profile: Partial<RobotProfile>) => Promise<void>;
  isLoading: boolean;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  profile,
  onSaveProfile,
  isLoading,
}) => {
  const [character, setCharacter] = useState<CharacterMode>(profile.character);
  const [speed, setSpeed] = useState<number>(profile.speed);
  const [pitch, setPitch] = useState<number>(profile.pitch || 1.0);

  // Trained Voice Models State
  const [trainedModels, setTrainedModels] = useState<TrainedVoiceModel[]>([]);
  const [activeModelId, setActiveModelId] = useState<string>(profile.activeVoiceModelId || '');
  const [isModelsLoading, setIsModelsLoading] = useState(false);

  // Audio Upload & Training State
  const [selectedFileName, setSelectedFileName] = useState<string>('my_voice_sample.mp3');
  const [fileSizeMb, setFileSizeMb] = useState<number>(2.4);
  const [fileDurationSec, setFileDurationSec] = useState<number>(38);
  const [customVoiceName, setCustomVoiceName] = useState<string>('내 맞춤 학습 목소리');
  const [targetCharacter, setTargetCharacter] = useState<CharacterMode>('study');
  const [toneStyle, setToneStyle] = useState<'calm' | 'energetic' | 'warm'>('calm');

  // Training Process State
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStep, setTrainingStep] = useState<number>(0); // 0 to 4
  const [trainingProgress, setTrainingProgress] = useState<number>(0);

  // Audio Playback Preview State
  const [playingModelId, setPlayingModelId] = useState<string | null>(null);
  const [stopAudioFn, setStopAudioFn] = useState<(() => void) | null>(null);

  // Success Feedback Toast
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset sample audio files that users can pick instantly
  const demoAudioPresets = [
    { name: '사용자_차분한_발화_샘플.mp3', size: 2.3, duration: 41, tone: 'calm' as const, character: 'study' as const },
    { name: '밝고_또렷한_음성_샘플.mp3', size: 1.9, duration: 34, tone: 'energetic' as const, character: 'cooking' as const },
    { name: '다정한_낭독_녹음.mp3', size: 2.7, duration: 48, tone: 'warm' as const, character: 'study' as const },
  ];

  // Fetch trained voice models from backend
  const fetchTrainedModels = async () => {
    try {
      setIsModelsLoading(true);
      const res = await fetch('/api/v1/robot/voice-models');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTrainedModels(json.data);
          if (json.data.length > 0 && !activeModelId) {
            setActiveModelId(json.data[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch voice models', err);
    } finally {
      setIsModelsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainedModels();
  }, []);

  useEffect(() => {
    setCharacter(profile.character);
    setSpeed(profile.speed);
    setPitch(profile.pitch || 1.0);
    if (profile.activeVoiceModelId) {
      setActiveModelId(profile.activeVoiceModelId);
    }
  }, [profile]);

  // Handle local MP3 file selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      setFileSizeMb(Number((file.size / (1024 * 1024)).toFixed(1)) || 2.1);
      setFileDurationSec(35 + Math.floor(Math.random() * 20));
      setCustomVoiceName(file.name.replace(/\.[^/.]+$/, '') + ' 모델');
    }
  };

  // Start AI Voice Training Pipeline
  const handleStartTraining = async () => {
    if (isTraining) return;
    setIsTraining(true);
    setTrainingStep(1);
    setTrainingProgress(20);

    // Simulate multi-stage neural vocoder training steps
    setTimeout(() => {
      setTrainingStep(2);
      setTrainingProgress(50);
    }, 900);

    setTimeout(() => {
      setTrainingStep(3);
      setTrainingProgress(80);
    }, 1900);

    setTimeout(async () => {
      setTrainingStep(4);
      setTrainingProgress(100);

      try {
        const res = await fetch('/api/v1/robot/voice-models/train', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: customVoiceName || '새로 학습된 맞춤 음성',
            fileName: selectedFileName,
            fileSizeMb,
            durationSec: fileDurationSec,
            characterTarget: targetCharacter,
            toneStyle,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          await fetchTrainedModels();
          if (json.data?.id) {
            setActiveModelId(json.data.id);
          }
          setSaveSuccessMsg('🎉 MP3 목소리 학습이 성공적으로 완료되어 로봇에 적용되었습니다!');
          setTimeout(() => setSaveSuccessMsg(null), 4000);
        }
      } catch (err) {
        console.error('Failed to train voice model', err);
      } finally {
        setIsTraining(false);
        setTrainingStep(0);
        setTrainingProgress(0);
      }
    }, 2800);
  };

  // Delete custom model
  const handleDeleteModel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('이 학습된 목소리 모델을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/v1/robot/voice-models/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTrainedModels((prev) => prev.filter((m) => m.id !== id));
        if (activeModelId === id) {
          const remain = trainedModels.filter((m) => m.id !== id);
          if (remain.length > 0) {
            setActiveModelId(remain[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete voice model', err);
    }
  };

  // Preview trained model voice
  const handleTogglePreview = (model: TrainedVoiceModel) => {
    if (playingModelId === model.id) {
      if (stopAudioFn) stopAudioFn();
      setPlayingModelId(null);
      setStopAudioFn(null);
    } else {
      if (stopAudioFn) stopAudioFn();
      setPlayingModelId(model.id);

      const effectivePitch = pitch * (model.pitchOffset || 1.0);
      const stop = playVoiceSample(
        model.samplePhrase,
        speed,
        effectivePitch,
        () => {
          setPlayingModelId(null);
          setStopAudioFn(null);
        }
      );
      setStopAudioFn(() => stop);
    }
  };

  // Save Settings to Robot
  const handleSave = async () => {
    await onSaveProfile({
      character,
      activeVoiceModelId: activeModelId,
      speed,
      pitch,
    });
    setSaveSuccessMsg('로봇에 캐릭터 모드 및 학습된 음성 설정이 실시간 동기화되었습니다.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const activeModel = trainedModels.find((m) => m.id === activeModelId) || trainedModels[0];

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] pb-28 max-w-md mx-auto px-4 py-4 space-y-5">
      {/* Save Success Alert Banner */}
      {saveSuccessMsg && (
        <div className="bg-[#EAF5EF] border border-[#BCE2CD] rounded-xl p-3 flex items-center gap-2.5 text-[#236845] text-xs font-semibold animate-in fade-in slide-in-from-top-2 shadow-sm">
          <CheckCircle className="w-4 h-4 text-[#2D7D54] shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* SECTION A: Character Selection (2 Dedicated Modes) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7A7268] flex items-center gap-1.5">
            <span>A. 로봇 특화 캐릭터 모드</span>
          </h2>
          <span className="text-[10px] text-[#8C8479]">페르소나 선택</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* 1. Study Mate Card */}
          <div
            onClick={() => setCharacter('study')}
            className={`cursor-pointer rounded-2xl p-4 border transition-all relative overflow-hidden ${
              character === 'study'
                ? 'bg-[#F4F8FC] border-[#3B82F6] shadow-[0_2px_8px_rgba(59,130,246,0.12)] ring-1 ring-[#3B82F6]/50'
                : 'bg-[#FFFFFF] border-[#E8E2D8] hover:border-[#D0C7B9]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    character === 'study'
                      ? 'bg-[#3B82F6] text-white font-bold'
                      : 'bg-[#FAF8F5] text-[#7A7268] border border-[#E2DBD0]'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#2D2926]">📚 공부 메이트</h3>
                    <span className="text-[10px] font-mono text-[#2563EB] px-1.5 py-0.5 rounded bg-[#EEF4FB] border border-[#BCD9FA]">
                      Study Mate
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B645C] mt-0.5">
                    차분하고 논리적인 톤, 집중을 돕는 간결한 피드백
                  </p>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                  character === 'study'
                    ? 'border-[#3B82F6] bg-[#3B82F6] text-white'
                    : 'border-[#DDD7CD] bg-[#FAF8F5]'
                }`}
              >
                {character === 'study' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* 2. Cooking Mate Card */}
          <div
            onClick={() => setCharacter('cooking')}
            className={`cursor-pointer rounded-2xl p-4 border transition-all relative overflow-hidden ${
              character === 'cooking'
                ? 'bg-[#FFF7F2] border-[#EA580C] shadow-[0_2px_8px_rgba(234,88,12,0.12)] ring-1 ring-[#EA580C]/50'
                : 'bg-[#FFFFFF] border-[#E8E2D8] hover:border-[#D0C7B9]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    character === 'cooking'
                      ? 'bg-[#EA580C] text-white font-bold'
                      : 'bg-[#FAF8F5] text-[#7A7268] border border-[#E2DBD0]'
                  }`}
                >
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#2D2926]">🍳 요리 메이트</h3>
                    <span className="text-[10px] font-mono text-[#EA580C] px-1.5 py-0.5 rounded bg-[#FFF0E6] border border-[#FCD2B5]">
                      Cooking Mate
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B645C] mt-0.5">
                    활기차고 명확한 톤, 조리 순서 가이드 및 타이머
                  </p>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                  character === 'cooking'
                    ? 'border-[#EA580C] bg-[#EA580C] text-white'
                    : 'border-[#DDD7CD] bg-[#FAF8F5]'
                }`}
              >
                {character === 'cooking' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: Custom MP3 Voice Training & Cloning Studio */}
      <section className="bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl p-4 space-y-4 shadow-[0_2px_8px_rgba(180,170,155,0.06)]">
        <div className="flex items-center justify-between border-b border-[#EFEAE0] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#EAF5EF] text-[#236845]">
              <Mic className="w-4 h-4 text-[#2D7D54]" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#2D2926] flex items-center gap-1.5">
                <span>B. MP3 파일 음성 학습 (AI 보이스 클로닝)</span>
              </h2>
              <p className="text-[10px] text-[#7A7268]">
                기존 음성 프리셋 대신 MP3 음성 파일로 로봇의 목소리를 직접 학습시킵니다.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#236845] bg-[#EAF5EF] px-2 py-0.5 rounded-full border border-[#CDE5D7]">
            Few-Shot TTS
          </span>
        </div>

        {/* 1. MP3 File Upload & Dropzone Area */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#38332E]">
              학습용 목소리 MP3 파일 업로드
            </span>
            <span className="text-[10px] text-[#8C8479]">.mp3 / .wav / .m4a 지원</span>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".mp3,audio/mp3,audio/wav,audio/m4a"
            className="hidden"
          />

          {/* Upload Drop Card */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#DDD7CD] hover:border-[#2D7D54] rounded-2xl p-4 bg-[#FAF8F5] text-center cursor-pointer transition-all hover:bg-[#F3EFE6] group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#EFECE6] group-hover:bg-[#EAF5EF] text-[#7A7268] group-hover:text-[#236845] flex items-center justify-center mx-auto mb-2 transition-colors">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-[#2D2926]">
              클릭하여 내 기기의 음성 MP3 파일 선택
            </p>
            <p className="text-[11px] text-[#7A7268] mt-0.5">
              30초 이상의 깨끗한 육성 녹음 파일이 가장 이상적입니다.
            </p>
          </div>

          {/* Sample Preset Audio Files Quick Pick */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] text-[#827A70] block font-medium">
              또는 준비된 샘플 음성 MP3 즉시 선택:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {demoAudioPresets.map((item, idx) => {
                const isSelected = selectedFileName === item.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedFileName(item.name);
                      setFileSizeMb(item.size);
                      setFileDurationSec(item.duration);
                      setToneStyle(item.tone);
                      setTargetCharacter(item.character);
                      setCustomVoiceName(item.name.replace(/\.[^/.]+$/, ''));
                    }}
                    className={`text-[11px] px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#EAF5EF] border-[#2D7D54] text-[#236845] font-bold'
                        : 'bg-[#FAF8F5] border-[#E4DDD2] text-[#6E675E] hover:text-[#2D2926] hover:bg-[#EDE7DC]'
                    }`}
                  >
                    <FileAudio className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                    <span className="text-[9px] opacity-75 font-mono">({item.duration}s)</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected File Details Card */}
          <div className="bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#EAF5EF] text-[#236845] border border-[#CDE5D7]">
                <FileAudio className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#2D2926] block truncate max-w-[200px]">
                  {selectedFileName}
                </span>
                <span className="text-[10px] text-[#7A7268] font-mono">
                  {fileSizeMb} MB · 약 {fileDurationSec}초 재생
                </span>
              </div>
            </div>

            <span className="text-[10px] text-[#236845] bg-[#EAF5EF] border border-[#CDE5D7] px-2 py-0.5 rounded-full font-medium">
              준비 완료
            </span>
          </div>
        </div>

        {/* 2. Voice Training Configuration Form */}
        <div className="space-y-3 pt-2 border-t border-[#EFEAE0]">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#38332E] block">
              학습할 목소리 모델 이름
            </label>
            <input
              type="text"
              value={customVoiceName}
              onChange={(e) => setCustomVoiceName(e.target.value)}
              placeholder="예: 내 차분한 공부 목소리 v1"
              className="w-full bg-[#FAF8F5] border border-[#DDD7CD] focus:border-[#2D7D54] focus:bg-[#FFFFFF] rounded-xl px-3 py-2 text-xs text-[#2D2926] placeholder-[#A0988E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Target Mode */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#38332E] block">적용할 페르소나</label>
              <select
                value={targetCharacter}
                onChange={(e) => setTargetCharacter(e.target.value as CharacterMode)}
                className="w-full bg-[#FAF8F5] border border-[#DDD7CD] focus:border-[#2D7D54] focus:bg-[#FFFFFF] rounded-xl px-2.5 py-2 text-xs text-[#2D2926] appearance-none focus:outline-none cursor-pointer"
              >
                <option value="study">📚 공부 메이트</option>
                <option value="cooking">🍳 요리 메이트</option>
              </select>
            </div>

            {/* Tone Style */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#38332E] block">음향 감정 톤</label>
              <select
                value={toneStyle}
                onChange={(e) => setToneStyle(e.target.value as 'calm' | 'energetic' | 'warm')}
                className="w-full bg-[#FAF8F5] border border-[#DDD7CD] focus:border-[#2D7D54] focus:bg-[#FFFFFF] rounded-xl px-2.5 py-2 text-xs text-[#2D2926] appearance-none focus:outline-none cursor-pointer"
              >
                <option value="calm">차분함 / 중저음</option>
                <option value="energetic">활기참 / 높은 명료도</option>
                <option value="warm">부드러움 / 따뜻함</option>
              </select>
            </div>
          </div>

          {/* AI Voice Training Action Button & Progress */}
          {isTraining ? (
            <div className="bg-[#FAF8F5] border border-[#BCE2CD] rounded-2xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#236845] flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {trainingStep === 1 && '1/4 오디오 잡음 제거 및 정규화 진행 중...'}
                  {trainingStep === 2 && '2/4 성문 음향 특징 및 음성 임베딩 추출 중...'}
                  {trainingStep === 3 && '3/4 Zero-Shot 뉴럴 TTS 모델 미세조정(Fine-tuning)...'}
                  {trainingStep === 4 && '4/4 MindMate 로봇 음성 모듈에 배포 중...'}
                </span>
                <span className="font-mono text-[#236845] font-bold">{trainingProgress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#E5DFD4] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#2D7D54] h-full rounded-full transition-all duration-300"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-1 text-[10px] text-[#8C8479] text-center font-mono">
                <span className={trainingStep >= 1 ? 'text-[#236845] font-bold' : ''}>전처리</span>
                <span className={trainingStep >= 2 ? 'text-[#236845] font-bold' : ''}>특징추출</span>
                <span className={trainingStep >= 3 ? 'text-[#236845] font-bold' : ''}>AI학습</span>
                <span className={trainingStep >= 4 ? 'text-[#236845] font-bold' : ''}>로봇탑재</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartTraining}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#2D7D54] to-[#399665] hover:from-[#256643] hover:to-[#2D7D54] active:scale-[0.98] text-[#FFFFFF] font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>[MP3 파일로 AI 목소리 학습 시작하기 🚀]</span>
            </button>
          )}
        </div>
      </section>

      {/* SECTION C: Trained Voice Models List (학습 완료된 목소리 목록) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7A7268] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#2D7D54]" />
            <span>학습 완료된 커스텀 목소리 목록</span>
          </h2>
          <span className="text-[10px] text-[#8C8479] font-mono">
            총 {trainedModels.length}개 모델
          </span>
        </div>

        {isModelsLoading ? (
          <div className="p-6 text-center text-xs text-[#7A7268]">
            목소리 모델 불러오는 중...
          </div>
        ) : trainedModels.length === 0 ? (
          <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl p-6 text-center text-xs text-[#7A7268]">
            학습된 커스텀 목소리가 없습니다. 상단에서 MP3 파일을 업로드하여 목소리를 학습시켜보세요.
          </div>
        ) : (
          <div className="space-y-2.5">
            {trainedModels.map((model) => {
              const isSelected = activeModelId === model.id;
              const isPlaying = playingModelId === model.id;
              const isStudy = model.characterTarget === 'study';

              return (
                <div
                  key={model.id}
                  onClick={() => setActiveModelId(model.id)}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all space-y-3 relative overflow-hidden ${
                    isSelected
                      ? 'bg-[#FFFFFF] border-[#2D7D54] shadow-[0_2px_8px_rgba(45,125,84,0.12)] ring-1 ring-[#2D7D54]/30'
                      : 'bg-[#FFFFFF] border-[#E8E2D8] hover:border-[#D0C7B9]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#2D7D54] text-white font-bold'
                            : 'bg-[#FAF8F5] text-[#7A7268] border border-[#E2DBD0]'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-[#2D2926]">{model.name}</h4>
                          {isSelected && (
                            <span className="text-[10px] font-semibold text-[#236845] bg-[#EAF5EF] border border-[#BCE2CD] px-1.5 py-0.2 rounded">
                              현재 적용 중
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#7A7268] font-mono mt-0.5">
                          {model.fileName} · 음성 유사도 {model.similarityScore}%
                        </p>
                      </div>
                    </div>

                    {/* Radio Select & Delete */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteModel(model.id, e)}
                        title="이 모델 삭제"
                        className="p-1 rounded-lg hover:bg-[#FEE2E2] text-[#8C8479] hover:text-[#DC2626] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-[#2D7D54] bg-[#2D7D54] text-white'
                            : 'border-[#DDD7CD] bg-[#FAF8F5]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>

                  {/* Sample Phrase Bubble & Audio Preview */}
                  <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-[#8C8479] block mb-0.5">
                        학습된 합성 샘플:
                      </span>
                      <p className="text-xs text-[#2D2926] italic truncate font-sans">
                        "{model.samplePhrase}"
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePreview(model);
                      }}
                      className={`p-2 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isPlaying
                          ? 'bg-[#DC2626] text-white animate-pulse'
                          : 'bg-[#2D7D54] hover:bg-[#256643] text-white font-bold active:scale-95'
                      }`}
                      title={isPlaying ? '정지' : '미리듣기'}
                    >
                      {isPlaying ? (
                        <Square className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Meta tags */}
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] text-[#7A7268]">
                    <span
                      className={`px-2 py-0.5 rounded-full border ${
                        isStudy
                          ? 'bg-[#EEF4FB] text-[#2563EB] border-[#BCD9FA]'
                          : 'bg-[#FFF0E6] text-[#EA580C] border-[#FCD2B5]'
                      }`}
                    >
                      {isStudy ? '📚 공부용' : '🍳 요리용'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E2DBD0] text-[#6E675E]">
                      톤: {model.toneStyle === 'calm' ? '차분함' : model.toneStyle === 'energetic' ? '활기참' : '따뜻함'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E2DBD0] font-mono text-[#6E675E]">
                      {model.createdAt}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION D: Speed and Pitch Tuning */}
      <section className="bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl p-4 space-y-4 shadow-[0_2px_8px_rgba(180,170,155,0.06)]">
        <div className="flex items-center justify-between border-b border-[#EFEAE0] pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7A7268] flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[#2D7D54]" />
            <span>D. 음성 발화 속도 및 음높이 미세조절</span>
          </h2>
          <span className="text-[10px] text-[#8C8479] font-mono">실시간 적용</span>
        </div>

        {/* Speed Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#38332E] font-semibold">말하기 속도</span>
            <span className="font-mono text-[#236845] font-bold">{speed.toFixed(1)}x</span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-[#2D7D54] bg-[#E8E2D8] rounded-lg h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8C8479] px-0.5">
              <span>느림 (0.7x)</span>
              <span>보통 (1.0x)</span>
              <span>빠름 (1.5x)</span>
            </div>
          </div>
        </div>

        {/* Pitch Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#38332E] font-semibold">음높이 (Pitch)</span>
            <span className="font-mono text-[#236845] font-bold">{pitch.toFixed(1)}</span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full accent-[#2D7D54] bg-[#E8E2D8] rounded-lg h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8C8479] px-0.5">
              <span>낮음 (0.8)</span>
              <span>표준 (1.0)</span>
              <span>높음 (1.2)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-[#2D7D54] hover:bg-[#256643] active:scale-[0.98] text-[#FFFFFF] font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>[설정 저장 및 로봇 실시간 동기화]</span>
        </button>
        <p className="text-[10px] text-center text-[#8C8479] mt-2">
          저장 시 MindMate 로봇에 선택된 학습 목소리와 발화 속도가 즉시 동기화됩니다.
        </p>
      </div>
    </div>
  );
};
