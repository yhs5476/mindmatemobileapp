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
  Check,
  Sparkles,
  Trash2,
  Mic,
  ChevronDown,
  ChevronUp,
  Plus,
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

  // Trained Voice Models State
  const [trainedModels, setTrainedModels] = useState<TrainedVoiceModel[]>([]);
  const [activeModelId, setActiveModelId] = useState<string>(profile.activeVoiceModelId || '');
  const [isModelsLoading, setIsModelsLoading] = useState(false);

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
    { name: '셰프_마르코_목소리_녹음.mp3', size: 2.0, duration: 32, tone: 'energetic' as const, character: 'cooking' as const },
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
    setShowTrainingForm(false); // reset inline training box when switching characters

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
      setCustomVoiceName(file.name.replace(/\.[^/.]+$/, '') + ' 모델');
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
          setSaveSuccessMsg(`🎉 [${character === 'study' ? '공부 메이트' : '요리 메이트'}] 새 음성 학습이 완료되어 자동 적용되었습니다!`);
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
    setSaveSuccessMsg('로봇에 캐릭터 모드 및 선택된 음성 설정이 실시간 동기화되었습니다.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Filter models for each character
  const studyModels = trainedModels.filter((m) => m.characterTarget === 'study');
  const cookingModels = trainedModels.filter((m) => m.characterTarget === 'cooking');

  // Render Voice List for a specific character
  const renderVoiceListForCharacter = (targetMode: CharacterMode, models: TrainedVoiceModel[]) => {
    const isStudy = targetMode === 'study';

    return (
      <div className="mt-3 pt-3 border-t border-[#EAE4D9] space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#2D2926] flex items-center gap-1.5">
            <Mic className={`w-3.5 h-3.5 ${isStudy ? 'text-[#3B82F6]' : 'text-[#EA580C]'}`} />
            <span>{isStudy ? '공부 메이트' : '요리 메이트'} 적용 음성 선택</span>
          </span>
          <span className="text-[10px] text-[#7A7268] font-mono">
            {models.length}개 보이스
          </span>
        </div>

        {models.length === 0 ? (
          <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-3 text-center text-xs text-[#7A7268]">
            등록된 목소리가 없습니다. 아래에서 새 MP3 음성을 학습시켜보세요.
          </div>
        ) : (
          <div className="space-y-2">
            {models.map((model) => {
              const isSelected = activeModelId === model.id;
              const isPlaying = playingModelId === model.id;

              return (
                <div
                  key={model.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModelId(model.id);
                  }}
                  className={`rounded-xl p-3 border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-[#FFFFFF] border-[#2D7D54] shadow-[0_2px_8px_rgba(45,125,84,0.12)] ring-1.5 ring-[#2D7D54]'
                      : 'bg-[#FAF8F5] border-[#E8E2D8] hover:border-[#D0C7B9] hover:bg-[#FFFFFF]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-[#2D7D54] bg-[#2D7D54] text-white'
                            : 'border-[#CCC5B9] bg-[#FFFFFF]'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-[#2D2926] truncate">
                            {model.name}
                          </h4>
                          {isSelected && (
                            <span className="text-[9px] font-semibold text-[#236845] bg-[#EAF5EF] border border-[#BCE2CD] px-1.5 py-0.2 rounded shrink-0">
                              사용 중
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#7A7268] font-mono">
                          유사도 {model.similarityScore}% · {model.fileName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Audio Preview Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePreview(model);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                          isPlaying
                            ? 'bg-[#DC2626] text-white animate-pulse'
                            : 'bg-[#EAF5EF] hover:bg-[#D5EBDE] text-[#236845] border border-[#CDE5D7]'
                        }`}
                        title={isPlaying ? '정지' : '미리듣기'}
                      >
                        {isPlaying ? (
                          <>
                            <Square className="w-3 h-3 fill-current" />
                            <span>정지</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>미리듣기</span>
                          </>
                        )}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteModel(model.id, e)}
                        title="삭제"
                        className="p-1 rounded-md text-[#A39B90] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Sample Phrase Preview */}
                  <div className="bg-[#FFFFFF] border border-[#EDE8DF] rounded-lg px-2.5 py-1.5 text-[11px] text-[#554F47] italic truncate">
                    "{model.samplePhrase}"
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Inline Button to Toggle MP3 Voice Training for this character */}
        <div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTrainingForm((prev) => !prev);
              setCustomVoiceName(`${isStudy ? '학습용' : '요리용'} 맞춤 목소리`);
              setToneStyle(isStudy ? 'calm' : 'energetic');
            }}
            className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              showTrainingForm
                ? 'bg-[#F2EFE8] border-[#DDD7CD] text-[#554F47]'
                : 'bg-[#FFFFFF] hover:bg-[#FAF8F5] border-dashed border-[#2D7D54] text-[#236845]'
            }`}
          >
            {showTrainingForm ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>음성 학습 폼 접기</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>[+ {isStudy ? '공부 메이트' : '요리 메이트'}에 새 MP3 목소리 학습 및 추가]</span>
              </>
            )}
          </button>
        </div>

        {/* Expandable Inline MP3 Training Box */}
        {showTrainingForm && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFFFFF] border border-[#CDE5D7] rounded-xl p-3.5 space-y-3 shadow-sm animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center justify-between border-b border-[#EFEAE0] pb-2">
              <span className="text-xs font-bold text-[#236845] flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-[#2D7D54]" />
                <span>{isStudy ? '공부 메이트' : '요리 메이트'} 전용 MP3 보이스 학습</span>
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
              className="border border-dashed border-[#BCE2CD] hover:border-[#2D7D54] rounded-xl p-3 bg-[#FAF8F5] text-center cursor-pointer transition-colors hover:bg-[#EAF5EF]/40"
            >
              <UploadCloud className="w-5 h-5 text-[#2D7D54] mx-auto mb-1" />
              <p className="text-xs font-semibold text-[#2D2926]">
                내 PC/기기의 MP3 음성 파일 선택
              </p>
              <p className="text-[10px] text-[#7A7268] mt-0.5">
                선택된 파일: <strong className="text-[#236845]">{selectedFileName}</strong> ({fileSizeMb}MB)
              </p>
            </div>

            {/* Sample Audio Presets */}
            <div className="space-y-1">
              <span className="text-[10px] text-[#827A70] block font-medium">
                또는 준비된 예시 MP3 즉시 선택:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {demoAudioPresets
                  .filter((p) => p.character === targetMode)
                  .map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedFileName(item.name);
                        setFileSizeMb(item.size);
                        setFileDurationSec(item.duration);
                        setToneStyle(item.tone);
                        setCustomVoiceName(item.name.replace(/\.[^/.]+$/, ''));
                      }}
                      className={`text-[10px] px-2 py-1 rounded-lg border flex items-center gap-1 shrink-0 transition-all ${
                        selectedFileName === item.name
                          ? 'bg-[#EAF5EF] border-[#2D7D54] text-[#236845] font-bold'
                          : 'bg-[#FAF8F5] border-[#E4DDD2] text-[#6E675E]'
                      }`}
                    >
                      <FileAudio className="w-3 h-3" />
                      <span>{item.name}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Inputs: Voice Name & Tone */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#38332E] block">
                  목소리 이름
                </label>
                <input
                  type="text"
                  value={customVoiceName}
                  onChange={(e) => setCustomVoiceName(e.target.value)}
                  placeholder="예: 내 차분한 보이스"
                  className="w-full bg-[#FAF8F5] border border-[#DDD7CD] focus:border-[#2D7D54] focus:bg-[#FFFFFF] rounded-lg px-2.5 py-1.5 text-xs text-[#2D2926] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#38332E] block">
                  음향 톤 스타일
                </label>
                <select
                  value={toneStyle}
                  onChange={(e) => setToneStyle(e.target.value as any)}
                  className="w-full bg-[#FAF8F5] border border-[#DDD7CD] focus:border-[#2D7D54] focus:bg-[#FFFFFF] rounded-lg px-2 py-1.5 text-xs text-[#2D2926] focus:outline-none cursor-pointer"
                >
                  <option value="calm">차분함 / 중저음</option>
                  <option value="energetic">활기참 / 높은 명료도</option>
                  <option value="warm">부드러움 / 따뜻함</option>
                </select>
              </div>
            </div>

            {/* Training Action or Progress */}
            {isTraining ? (
              <div className="bg-[#FAF8F5] border border-[#BCE2CD] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#236845] flex items-center gap-1.5 text-[11px]">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {trainingStep === 1 && '1/4 잡음 제거 및 정규화 진행 중...'}
                    {trainingStep === 2 && '2/4 성문 음향 특징 추출 중...'}
                    {trainingStep === 3 && '3/4 Zero-Shot TTS 미세조정 중...'}
                    {trainingStep === 4 && '4/4 캐릭터 보이스 모듈에 탑재 중...'}
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
                className="w-full py-2.5 px-3 rounded-xl bg-[#2D7D54] hover:bg-[#256643] active:scale-[0.98] text-[#FFFFFF] font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                <span>[이 파일로 AI 목소리 학습 시작하기 🚀]</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] pb-28 max-w-md mx-auto px-4 py-4 space-y-5">
      {/* Save Success Alert Banner */}
      {saveSuccessMsg && (
        <div className="bg-[#EAF5EF] border border-[#BCE2CD] rounded-xl p-3 flex items-center gap-2.5 text-[#236845] text-xs font-semibold animate-in fade-in slide-in-from-top-2 shadow-sm">
          <CheckCircle className="w-4 h-4 text-[#2D7D54] shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* SECTION: Character Selection with Direct Inline Voice Selection */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7A7268] flex items-center gap-1.5">
            <span>로봇 특화 캐릭터 & 보이스 설정</span>
          </h2>
          <span className="text-[10px] text-[#8C8479]">캐릭터 선택 시 아래에 보이스가 표시됩니다</span>
        </div>

        <div className="space-y-3">
          {/* 1. Study Mate Card */}
          <div
            onClick={() => handleSelectCharacter('study')}
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

            {/* DIRECT INLINE VOICE SELECTION: Displayed right below when Study Mate is selected */}
            {character === 'study' && renderVoiceListForCharacter('study', studyModels)}
          </div>

          {/* 2. Cooking Mate Card */}
          <div
            onClick={() => handleSelectCharacter('cooking')}
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

            {/* DIRECT INLINE VOICE SELECTION: Displayed right below when Cooking Mate is selected */}
            {character === 'cooking' && renderVoiceListForCharacter('cooking', cookingModels)}
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
          저장 시 MindMate 로봇에 선택된 캐릭터와 학습 목소리가 즉시 동기화됩니다.
        </p>
      </div>
    </div>
  );
};
