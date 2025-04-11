// utils/soundPlayer.ts


export const playSound = (soundFile: string, volume: number = 1) => {
  const audio = new Audio(`/sounds/${soundFile}`);
  audio.volume = volume;
  audio.play().catch((e) => {
    console.warn('Audio play error:', e);
  });
};
