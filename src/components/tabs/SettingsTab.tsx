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
  Check,
  Sparkles,
  Trash2,
  Plus,
  RefreshCw,
  AudioLines,
  Volume2,
  ChevronUp,
  Sliders,
  CheckCircle2,
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

  // Trained Voice Models State
  const [trainedModels, setTrainedModels] = useState<TrainedVoiceModel[]>([]);
  const [activeModelId, setActiveModelId] = useState<string>(profile.activeVoiceModelId || '');
  const [, setIsModelsLoading] = useState(false);

  // Expandable inline training form state
  const [showTrainingForm, setShowTrainingForm] = useState<boolean>(false);

  // Audio Upload & Training State
  const [selectedFileName, setSelectedFileName] = useState<string>('my_voice_sample.mp3');
  const [fileSizeMb, setFileSizeMb] = useState<number>(2.4);
  const [fileDurationSec, setFileDurationSec] = useState<number>(38);
  const [customVoiceName, setCustomVoiceName] = useState<string>('내 맞춤 목소리');
  const [toneStyle, setToneStyle] = useState<'calm' | 'energetic' | 'warm'>('calm');

  // Training Process State
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStep, setTrainingStep] = useState<number>(0);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);

  // Audio Playback Preview State
  const [playingModelId, setPlayingModelId] = useState<string | null>(null);
  const [stopAudioFn, setStopAudioFn] = useState<(() => void) | null>(null);

  // Success Feedback Toast
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset sample audio files
  const demoAudioPresets = [
    { name: '사용자_차분한_발화_샘플.mp3', label: '차분한 톤', size: 2.3, duration: 41, tone: 'calm' as const, character: 'study' as const },
    { name: '밝고_또렷한_음성_샘플.mp3', label: '밝고 또렷한 톤', size: 1.9, duration: 34, tone: 'energetic' as const, character: 'cooking' as const },
    { name: '다정한_낭독_녹음.mp3', label: '다정한 낭독', size: 2.7, duration: 48, tone: 'warm' as const, character: 'study' as const },
    { name: '셰프_마르코_목소리_녹음.mp3', label: '열정적인 셰프', size: 2.0, duration: 32, tone: 'energetic' as const, character: 'cooking' as const },
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
    if (profile.activeVoiceModelId) {
      setActiveModelId(profile.activeVoiceModelId);
    }
  }, [profile]);

  // Handle character mode switch
  const handleSelectCharacter = (mode: CharacterMode) => {
    setCharacter(mode);
    setShowTrainingForm(false);

    // Auto-select a voice model matching the newly selected character mode
    const currentModel = trainedModels.find((m) => m.id === activeModelId);
    if (!currentModel || currentModel.characterTarget !== mode) {
      const candidate = trainedModels.find((m) => m.characterTarget === mode);
      if (candidate) {
        setActiveModelId(candidate.id);
      }
    }
  };

  // Handle local MP3 file selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      setFileSizeMb(Number((file.size / (1024 * 1024)).toFixed(1)) || 2.1);
      setFileDurationSec(35 + Math.floor(Math.random() * 20));
      setCustomVoiceName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  // Start AI Voice Training Pipeline
  const handleStartTraining = async () => {
    if (isTraining) return;
    setIsTraining(true);
    setTrainingStep(1);
    setTrainingProgress(20);

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
            name: customVoiceName || `${character === 'study' ? '학습' : '요리'} 맞춤 음성`,
            fileName: selectedFileName,
            fileSizeMb,
            durationSec: fileDurationSec,
            characterTarget: character,
            toneStyle,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          await fetchTrainedModels();
          if (json.data?.id) {
            setActiveModelId(json.data.id);
          }
          setShowTrainingForm(false);
          setSaveSuccessMsg(`새 목소리가 성공적으로 학습되어 ${character === 'study' ? '학습 메이트' : '요리 메이트'}에 적용되었습니다.`);
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
          const remain = trainedModels.filter((m) => m.id !== id && m.characterTarget === character);
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

      const effectivePitch = model.pitchOffset || 1.0;
      const stop = playVoiceSample(
        model.samplePhrase,
        1.0,
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
      speed: 1.0,
      pitch: 1.0,
    });
    setSaveSuccessMsg('캐릭터 모드와 보이스 설정이 로봇에 실시간 동기화되었습니다.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Active models for selected character
  const activeModels = trainedModels.filter((m) => m.characterTarget === character);

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] pb-28 max-w-md mx-auto px-4 py-4 space-y-6">
      {/* Toast Feedback */}
      {saveSuccessMsg && (
        <div className="bg-[#1E3A2B] text-white rounded-2xl p-3.5 flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-[#4ADE80] shrink-0" />
          <span className="text-xs font-medium leading-relaxed">{saveSuccessMsg}</span>
        </div>
      )}

      {/* SECTION 1: Character Hero Switcher (2-Column Grid) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#8A8276]">캐릭터 페르소나</h2>
            <p className="text-[11px] text-[#A39B90] mt-0.5">MindMate의 대화 성향과 지식 맥락을 전환합니다</p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EFECE6] text-[#5C554E]">
            {character === 'study' ? '학습 활성' : '요리 활성'}
          </span>
        </div>

        {/* 2-Column Hero Selector */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Study Mate */}
          <button
            type="button"
            onClick={() => handleSelectCharacter('study')}
            className={`relative rounded-2xl p-3.5 text-left transition-all flex flex-col justify-between ${
              character === 'study'
                ? 'bg-gradient-to-b from-[#F0F6FF] to-[#E5EFFF] border-2 border-[#3B82F6] shadow-sm'
                : 'bg-white border border-[#E8E2D8] hover:border-[#D5CFC3] opacity-85 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between w-full mb-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform ${
                  character === 'study'
                    ? 'bg-[#3B82F6] text-white shadow-xs'
                    : 'bg-[#F4F1EB] text-[#7A7268]'
                }`}
              >
                <BookOpen className="w-5 h-5" />
              </div>
              {character === 'study' ? (
                <span className="w-5 h-5 rounded-full bg-[#3B82F6] text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              ) : (
                <span className="w-5 h-5 rounded-full border border-[#DCD5C9] bg-[#FAF8F5]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-[#1E1B18]">공부 메이트</h3>
              </div>
              <p className="text-[11px] text-[#6E675E] mt-1 line-clamp-2 leading-snug">
                차분하고 논리적인 톤, 집중을 돕는 피드백
              </p>
            </div>
          </button>

          {/* Cooking Mate */}
          <button
            type="button"
            onClick={() => handleSelectCharacter('cooking')}
            className={`relative rounded-2xl p-3.5 text-left transition-all flex flex-col justify-between ${
              character === 'cooking'
                ? 'bg-gradient-to-b from-[#FFF7F0] to-[#FFEFE4] border-2 border-[#EA580C] shadow-sm'
                : 'bg-white border border-[#E8E2D8] hover:border-[#D5CFC3] opacity-85 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between w-full mb-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform ${
                  character === 'cooking'
                    ? 'bg-[#EA580C] text-white shadow-xs'
                    : 'bg-[#F4F1EB] text-[#7A7268]'
                }`}
              >
                <Utensils className="w-5 h-5" />
              </div>
              {character === 'cooking' ? (
                <span className="w-5 h-5 rounded-full bg-[#EA580C] text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              ) : (
                <span className="w-5 h-5 rounded-full border border-[#DCD5C9] bg-[#FAF8F5]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-[#1E1B18]">요리 메이트</h3>
              </div>
              <p className="text-[11px] text-[#6E675E] mt-1 line-clamp-2 leading-snug">
                활기차고 명확한 톤, 조리 순서와 실시간 타이머
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* SECTION 2: Voice Persona Studio (Audio List) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <AudioLines className={`w-4 h-4 ${character === 'study' ? 'text-[#3B82F6]' : 'text-[#EA580C]'}`} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#8A8276]">
              {character === 'study' ? '학습 메이트' : '요리 메이트'} 보이스
            </h2>
          </div>
          <span className="text-[11px] font-medium text-[#8A8276]">
            {activeModels.length}개 보이스
          </span>
        </div>

        {/* Voice List Items */}
        {activeModels.length === 0 ? (
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 text-center text-xs text-[#7A7268] space-y-1">
            <Volume2 className="w-6 h-6 text-[#A39B90] mx-auto mb-2 opacity-60" />
            <p className="font-medium text-[#2D2926]">등록된 목소리가 없습니다</p>
            <p className="text-[11px]">아래 버튼을 눌러 새 MP3 음성을 학습시켜보세요</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeModels.map((model) => {
              const isSelected = activeModelId === model.id;
              const isPlaying = playingModelId === model.id;

              return (
                <div
                  key={model.id}
                  onClick={() => setActiveModelId(model.id)}
                  className={`rounded-2xl p-3.5 border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-white border-[#2D7D54] shadow-[0_2px_12px_rgba(45,125,84,0.1)] ring-1 ring-[#2D7D54]'
                      : 'bg-white/80 hover:bg-white border-[#E8E2D8] hover:border-[#D5CFC3]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Play/Pause Circular Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePreview(model);
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                        isPlaying
                          ? 'bg-[#1E1B18] text-white shadow-md'
                          : 'bg-[#F2EFE9] hover:bg-[#E7E2DA] text-[#2D2926]'
                      }`}
                      title={isPlaying ? '정지' : '미리듣기'}
                    >
                      {isPlaying ? (
                        <div className="flex items-center gap-0.5 h-3.5">
                          <span className="w-0.5 h-3 bg-[#4ADE80] rounded-full animate-pulse" />
                          <span className="w-0.5 h-4 bg-[#4ADE80] rounded-full animate-bounce" />
                          <span className="w-0.5 h-2 bg-[#4ADE80] rounded-full animate-pulse" />
                        </div>
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Center: Info & Sample text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-[#1E1B18] truncate">
                          {model.name}
                        </h4>

                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F4F1EA] text-[#6B645C]">
                          {model.toneStyle === 'calm' ? '차분함' : model.toneStyle === 'energetic' ? '활기참' : '따뜻함'}
                        </span>

                        <span className="text-[10px] text-[#8C8479]">
                          일치율 {model.similarityScore}%
                        </span>
                      </div>

                      {/* Natural sample phrase display without nested border box */}
                      <p className="text-xs text-[#5C554E] mt-1.5 leading-relaxed line-clamp-2">
                        &ldquo;{model.samplePhrase}&rdquo;
                      </p>
                    </div>

                    {/* Right: Selection & Delete */}
                    <div className="flex flex-col items-end justify-between h-full shrink-0 gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#2D7D54] text-white'
                            : 'border border-[#CCC5B9] bg-[#FAF8F5]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {/* Delete icon */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteModel(model.id, e)}
                        title="보이스 삭제"
                        className="p-1 rounded-md text-[#B5AEA4] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Voice CTA Trigger */}
        <div>
          <button
            type="button"
            onClick={() => {
              setShowTrainingForm((prev) => !prev);
              setCustomVoiceName(`${character === 'study' ? '학습용' : '요리용'} 맞춤 보이스`);
              setToneStyle(character === 'study' ? 'calm' : 'energetic');
            }}
            className={`w-full py-3 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              showTrainingForm
                ? 'bg-[#F2EFE8] border-[#DDD7CD] text-[#554F47]'
                : 'bg-white hover:bg-[#F9F7F3] border-[#2D7D54]/40 text-[#236845] shadow-xs active:scale-[0.99]'
            }`}
          >
            {showTrainingForm ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>음성 학습 닫기</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>새 맞춤 목소리 추가 (MP3)</span>
              </>
            )}
          </button>
        </div>

        {/* Inline AI Voice Studio Form */}
        {showTrainingForm && (
          <div className="bg-white border border-[#E2DBD0] rounded-2xl p-4 space-y-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-2.5">
              <span className="text-xs font-bold text-[#1E1B18] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2D7D54]" />
                <span>AI 맞춤 보이스 생성</span>
              </span>
              <span className="text-[10px] text-[#8C8479]">Few-Shot TTS</span>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".mp3,audio/mp3,audio/wav,audio/m4a"
              className="hidden"
            />

            {/* Upload Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[#C5BFB4] hover:border-[#2D7D54] rounded-xl p-3.5 bg-[#FAF8F5] text-center cursor-pointer transition-colors hover:bg-[#F2F8F4]"
            >
              <UploadCloud className="w-5 h-5 text-[#2D7D54] mx-auto mb-1" />
              <p className="text-xs font-semibold text-[#2D2926]">
                음성 파일 업로드 (MP3 / WAV)
              </p>
              <p className="text-[10px] text-[#7A7268] mt-0.5">
                선택됨: <span className="font-semibold text-[#236845]">{selectedFileName}</span> ({fileSizeMb}MB)
              </p>
            </div>

            {/* Quick Demo Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-[#827A70] block font-medium">
                또는 준비된 샘플로 바로 체험:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {demoAudioPresets
                  .filter((p) => p.character === character)
                  .map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedFileName(item.name);
                        setFileSizeMb(item.size);
                        setFileDurationSec(item.duration);
                        setToneStyle(item.tone);
                        setCustomVoiceName(item.label);
                      }}
                      className={`text-[11px] px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 shrink-0 transition-all ${
                        selectedFileName === item.name
                          ? 'bg-[#EAF5EF] border-[#2D7D54] text-[#236845] font-bold'
                          : 'bg-[#FAF8F5] border-[#E4DDD2] text-[#6E675E] hover:border-[#CCC4B7]'
                      }`}
                    >
                      <FileAudio className="w-3 h-3" />
                      <span>{item.label}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Name & Tone */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#554F47] block">
                  목소리 이름
                </label>
                <input
                  type="text"
                  value={customVoiceName}
                  onChange={(e) => setCustomVoiceName(e.target.value)}
                  placeholder="예: 내 차분한 보이스"
                  className="w-full bg-[#FAF8F5] border border-[#DDD7CD] focus:border-[#2D7D54] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#2D2926] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#554F47] block">
                  음향 톤
                </label>
                <select
                  value={toneStyle}
                  onChange={(e) => setToneStyle(e.target.value as any)}
                  className="w-full bg-[#FAF8F5] border border-[#DDD7CD] focus:border-[#2D7D54] focus:bg-white rounded-xl px-2.5 py-2 text-xs text-[#2D2926] focus:outline-none cursor-pointer"
                >
                  <option value="calm">차분함 / 중저음</option>
                  <option value="energetic">활기참 / 높은 명료도</option>
                  <option value="warm">부드러움 / 따뜻함</option>
                </select>
              </div>
            </div>

            {/* Action / Progress */}
            {isTraining ? (
              <div className="bg-[#FAF8F5] border border-[#BCE2CD] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#236845] flex items-center gap-2 text-[11px]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {trainingStep === 1 && '잡음 제거 및 음성 정규화 중...'}
                    {trainingStep === 2 && '성문 음향 특징 추출 중...'}
                    {trainingStep === 3 && 'Zero-Shot TTS 미세조정 중...'}
                    {trainingStep === 4 && '캐릭터 보이스 모듈에 탑재 중...'}
                  </span>
                  <span className="font-mono text-[#236845] font-bold text-xs">{trainingProgress}%</span>
                </div>
                <div className="w-full bg-[#E5DFD4] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#2D7D54] h-full rounded-full transition-all duration-300"
                    style={{ width: `${trainingProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartTraining}
                className="w-full py-2.5 px-4 rounded-xl bg-[#2D7D54] hover:bg-[#256643] active:scale-[0.98] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                <span>AI 목소리 학습 시작</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* SECTION 3: Save & Sync CTA */}
      <div className="pt-2 space-y-2">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full py-3.5 px-5 rounded-2xl bg-[#1E1B18] hover:bg-[#2E2A26] active:scale-[0.98] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-[#FDE047]" />
          <span>설정 저장 및 로봇 동기화</span>
        </button>
        <p className="text-[11px] text-center text-[#8C8479]">
          저장 즉시 로봇의 발화 목소리와 대화 성향이 전환됩니다
        </p>
      </div>

      {/* Cloud & Device Status Footer */}
      <div className="bg-white/80 border border-[#E8E2D8] rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-[#7A7268]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D7D54] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2D7D54]"></span>
          </span>
          <span className="font-medium text-[#2D2926]">클라우드 DB 동기화 정상</span>
        </div>
        <span className="font-mono text-[10px] font-semibold text-[#8C8479] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E2DBD0]">
          MindMate Core v2.1
        </span>
      </div>
    </div>
  );
};

