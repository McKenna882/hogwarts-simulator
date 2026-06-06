interface AudioUnlockOptions {
  getAudio: () => HTMLAudioElement | null;
  volume: number;
  onPlaying?: () => void;
}

export function fadeAudio(audio: HTMLAudioElement, targetVolume: number) {
  const step = targetVolume > audio.volume ? 0.04 : -0.04;
  const timer = window.setInterval(() => {
    audio.volume = Math.max(0, Math.min(targetVolume, audio.volume + step));
    if (Math.abs(audio.volume - targetVolume) < 0.05) {
      audio.volume = targetVolume;
      window.clearInterval(timer);
    }
  }, 80);
  return timer;
}

export function installAudioUnlock({ getAudio, volume, onPlaying }: AudioUnlockOptions) {
  let disposed = false;

  const cleanup = () => {
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
    window.removeEventListener('touchstart', unlock, true);
  };

  const unlock = async () => {
    const audio = getAudio();
    if (!audio || disposed || !audio.paused) return;

    audio.loop = true;
    audio.volume = 0;
    try {
      await audio.play();
      if (disposed) return;
      onPlaying?.();
      fadeAudio(audio, volume);
      cleanup();
    } catch {
      // Browsers may still block audio until a stronger user gesture.
    }
  };

  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('touchstart', unlock, true);

  return () => {
    disposed = true;
    cleanup();
  };
}
