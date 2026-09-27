// Audio preview helper using Web Speech API with Web Audio fallback

export function playVoiceSample(
  text: string,
  rate: number = 1.0,
  pitch: number = 1.0,
  onEnd?: () => void
): () => void {
  // Check if browser SpeechSynthesis is supported
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Try finding a Korean voice
    const voices = window.speechSynthesis.getVoices();
    const koreanVoice = voices.find((v) => v.lang.includes('ko') || v.lang.includes('KR'));
    if (koreanVoice) {
      utterance.voice = koreanVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = () => {
        // Fallback tone on error
        playChimeFallback(pitch, onEnd);
      };
    }

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  } else {
    playChimeFallback(pitch, onEnd);
    return () => {};
  }
}

function playChimeFallback(pitch: number = 1.0, onEnd?: () => void) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      if (onEnd) onEnd();
      return;
    }
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const baseFreq = 440 * pitch;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.5);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);

    setTimeout(() => {
      ctx.close();
      if (onEnd) onEnd();
    }, 650);
  } catch {
    if (onEnd) onEnd();
  }
}
