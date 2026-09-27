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
        <div className="bg-emerald-950/90 border border-emerald-500/60 rounded-xl p-3 flex items-center gap-2.5 text-emerald-300 text-xs font-semibold animate-in fade-in slide-in-from-top-2 shadow-lg">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* SECTION A: Character Selection (2 Dedicated Modes) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <span>A. 로봇 특화 캐릭터 모드</span>
          </h2>
          <span className="text-[10px] text-zinc-400">페르소나 선택</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* 1. Study Mate Card */}
          <div
            onClick={() => setCharacter('study')}
            className={`cursor-pointer rounded-2xl p-4 border transition-all relative overflow-hidden ${
              character === 'study'
                ? 'bg-gradient-to-br from-blue-950/60 to-zinc-900 border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/50'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700/80'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    character === 'study'
                      ? 'bg-blue-500 text-zinc-950 font-bold'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-zinc-100">📚 공부 메이트</h3>
                    <span className="text-[10px] font-mono text-blue-400 px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/40">
                      Study Mate
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    차분하고 논리적인 톤, 집중을 돕는 간결한 피드백
                  </p>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                  character === 'study'
                    ? 'border-blue-500 bg-blue-500 text-zinc-950'
                    : 'border-zinc-700 bg-zinc-800'
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
                ? 'bg-gradient-to-br from-orange-950/60 to-zinc-900 border-orange-500/80 shadow-[0_0_15px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/50'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700/80'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    character === 'cooking'
                      ? 'bg-orange-500 text-zinc-950 font-bold'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-zinc-100">🍳 요리 메이트</h3>
                    <span className="text-[10px] font-mono text-orange-400 px-1.5 py-0.5 rounded bg-orange-950/80 border border-orange-800/40">
                      Cooking Mate
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    활기차고 명확한 톤, 조리 순서 가이드 및 타이머
                  </p>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                  character === 'cooking'
                    ? 'border-orange-500 bg-orange-500 text-zinc-950'
                    : 'border-zinc-700 bg-zinc-800'
                }`}
              >
                {character === 'cooking' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: Custom MP3 Voice Training & Cloning Studio */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <span>B. MP3 파일 음성 학습 (AI 보이스 클로닝)</span>
              </h2>
              <p className="text-[10px] text-zinc-400">
                기존 음성 프리셋 대신 MP3 음성 파일로 로봇의 목소리를 직접 학습시킵니다.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
            Few-Shot TTS
          </span>
        </div>

        {/* 1. MP3 File Upload & Dropzone Area */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">
              학습용 목소리 MP3 파일 업로드
            </span>
            <span className="text-[10px] text-zinc-400">.mp3 / .wav / .m4a 지원</span>
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
            className="border-2 border-dashed border-zinc-700/80 hover:border-emerald-500/60 rounded-2xl p-4 bg-zinc-950/60 text-center cursor-pointer transition-all hover:bg-zinc-950/90 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-zinc-850 group-hover:bg-emerald-500/20 text-zinc-400 group-hover:text-emerald-400 flex items-center justify-center mx-auto mb-2 transition-colors">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-zinc-200">
              클릭하여 내 기기의 음성 MP3 파일 선택
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              30초 이상의 깨끗한 육성 녹음 파일이 가장 이상적입니다.
            </p>
          </div>

          {/* Sample Preset Audio Files Quick Pick */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] text-zinc-400 block font-medium">
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
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
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
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileAudio className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-200 block truncate max-w-[200px]">
                  {selectedFileName}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {fileSizeMb} MB · 약 {fileDurationSec}초 재생
                </span>
              </div>
            </div>

            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
              준비 완료
            </span>
          </div>
        </div>

        {/* 2. Voice Training Configuration Form */}
        <div className="space-y-3 pt-2 border-t border-zinc-800">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300 block">
              학습할 목소리 모델 이름
            </label>
            <input
              type="text"
              value={customVoiceName}
              onChange={(e) => setCustomVoiceName(e.target.value)}
              placeholder="예: 내 차분한 공부 목소리 v1"
              className="w-full bg-zinc-950 border border-zinc-750 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Target Mode */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300 block">적용할 페르소나</label>
              <select
                value={targetCharacter}
                onChange={(e) => setTargetCharacter(e.target.value as CharacterMode)}
                className="w-full bg-zinc-950 border border-zinc-750 focus:border-emerald-500 rounded-xl px-2.5 py-2 text-xs text-zinc-100 appearance-none focus:outline-none cursor-pointer"
              >
                <option value="study">📚 공부 메이트</option>
                <option value="cooking">🍳 요리 메이트</option>
              </select>
            </div>

            {/* Tone Style */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300 block">음향 감정 톤</label>
              <select
                value={toneStyle}
                onChange={(e) => setToneStyle(e.target.value as 'calm' | 'energetic' | 'warm')}
                className="w-full bg-zinc-950 border border-zinc-750 focus:border-emerald-500 rounded-xl px-2.5 py-2 text-xs text-zinc-100 appearance-none focus:outline-none cursor-pointer"
              >
                <option value="calm">차분함 / 중저음</option>
                <option value="energetic">활기참 / 높은 명료도</option>
                <option value="warm">부드러움 / 따뜻함</option>
              </select>
            </div>
          </div>

          {/* AI Voice Training Action Button & Progress */}
          {isTraining ? (
            <div className="bg-zinc-950 border border-emerald-500/50 rounded-2xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-400 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {trainingStep === 1 && '1/4 오디오 잡음 제거 및 정규화 진행 중...'}
                  {trainingStep === 2 && '2/4 성문 음향 특징 및 음성 임베딩 추출 중...'}
                  {trainingStep === 3 && '3/4 Zero-Shot 뉴럴 TTS 모델 미세조정(Fine-tuning)...'}
                  {trainingStep === 4 && '4/4 MindMate 로봇 음성 모듈에 배포 중...'}
                </span>
                <span className="font-mono text-emerald-300 font-bold">{trainingProgress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-850 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-1 text-[10px] text-zinc-400 text-center font-mono">
                <span className={trainingStep >= 1 ? 'text-emerald-400 font-semibold' : ''}>전처리</span>
                <span className={trainingStep >= 2 ? 'text-emerald-400 font-semibold' : ''}>특징추출</span>
                <span className={trainingStep >= 3 ? 'text-emerald-400 font-semibold' : ''}>AI학습</span>
                <span className={trainingStep >= 4 ? 'text-emerald-400 font-semibold' : ''}>로봇탑재</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartTraining}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-zinc-950" />
              <span>[MP3 파일로 AI 목소리 학습 시작하기 🚀]</span>
            </button>
          )}
        </div>
      </section>

      {/* SECTION C: Trained Voice Models List (학습 완료된 목소리 목록) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>학습 완료된 커스텀 목소리 목록</span>
          </h2>
          <span className="text-[10px] text-zinc-400 font-mono">
            총 {trainedModels.length}개 모델
          </span>
        </div>

        {isModelsLoading ? (
          <div className="p-6 text-center text-xs text-zinc-400">
            목소리 모델 불러오는 중...
          </div>
        ) : trainedModels.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-xs text-zinc-400">
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
                      ? 'bg-zinc-900 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-emerald-500 text-zinc-950 font-bold'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-zinc-100">{model.name}</h4>
                          {isSelected && (
                            <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.2 rounded">
                              현재 적용 중
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {model.fileName} · 음성 유사도 {model.similarityScore}%
                        </p>
                      </div>
                    </div>

                    {/* Radio Select & Delete */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteModel(model.id, e)}
                        title="이 모델 삭제"
                        className="p-1 rounded-lg hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500 text-zinc-950'
                            : 'border-zinc-700 bg-zinc-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>

                  {/* Sample Phrase Bubble & Audio Preview */}
                  <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-zinc-400 block mb-0.5">
                        학습된 합성 샘플:
                      </span>
                      <p className="text-xs text-zinc-200 italic truncate font-sans">
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
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold active:scale-95'
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
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] text-zinc-400">
                    <span
                      className={`px-2 py-0.5 rounded-full border ${
                        isStudy
                          ? 'bg-blue-950/60 text-blue-300 border-blue-500/30'
                          : 'bg-orange-950/60 text-orange-300 border-orange-500/30'
                      }`}
                    >
                      {isStudy ? '📚 공부용' : '🍳 요리용'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/50">
                      톤: {model.toneStyle === 'calm' ? '차분함' : model.toneStyle === 'energetic' ? '활기참' : '따뜻함'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/50 font-mono">
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
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>D. 음성 발화 속도 및 음높이 미세조절</span>
          </h2>
          <span className="text-[10px] text-zinc-400 font-mono">실시간 적용</span>
        </div>

        {/* Speed Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">말하기 속도</span>
            <span className="font-mono text-emerald-400 font-bold">{speed.toFixed(1)}x</span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 bg-zinc-800 rounded-lg h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 px-0.5">
              <span>느림 (0.7x)</span>
              <span>보통 (1.0x)</span>
              <span>빠름 (1.5x)</span>
            </div>
          </div>
        </div>

        {/* Pitch Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">음높이 (Pitch)</span>
            <span className="font-mono text-emerald-400 font-bold">{pitch.toFixed(1)}</span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 bg-zinc-800 rounded-lg h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 px-0.5">
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
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 fill-zinc-950" />
          <span>[설정 저장 및 로봇 실시간 동기화]</span>
        </button>
        <p className="text-[10px] text-center text-zinc-400 mt-2">
          저장 시 MindMate 로봇에 선택된 학습 목소리와 발화 속도가 즉시 동기화됩니다.
        </p>
      </div>
    </div>
  );
};
