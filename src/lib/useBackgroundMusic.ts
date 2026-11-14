import { useCallback, useEffect, useRef, useState } from "react";

// "Inspiration" by Kevin MacLeod, released on FreePD as CC0 (public domain).
// Source: https://en.freepd.cn/music (track: Upbeat / Inspiration).
const AUDIO_SRC = "/audio/test-theme.mp3";
const STORAGE_KEY = "smarm_test_music_muted";
const TARGET_VOLUME = 0.38;

const readMuted = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const writeMuted = (muted: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore quota errors */
  }
};

export function useBackgroundMusic() {
  const [muted, setMuted] = useState(readMuted);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const wantsPlayRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startingRef = useRef(false);

  const clearFade = useCallback(() => {
    if (fadeRef.current) {
      clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  }, []);

  const fadeTo = useCallback(
    (target: number, duration: number, done?: () => void) => {
      const audio = audioRef.current;
      if (!audio) return;
      clearFade();
      const from = audio.volume;
      const startedAt = performance.now();
      fadeRef.current = setInterval(() => {
        const progress = Math.min(1, (performance.now() - startedAt) / duration);
        audio.volume = Math.min(1, Math.max(0, from + (target - from) * progress));
        if (progress >= 1) {
          clearFade();
          done?.();
        }
      }, 40);
    },
    [clearFade],
  );

  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio(AUDIO_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    audio.setAttribute("playsinline", "");
    audio.setAttribute("aria-hidden", "true");
    audio.style.display = "none";
    document.body.appendChild(audio);
    audioRef.current = audio;
    return audio;
  }, []);

  const play = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    try {
      const audio = ensureAudio();
      if (!audio.paused) {
        playingRef.current = true;
        setPlaying(true);
        return;
      }
      audio.volume = 0;
      await audio.play();
      playingRef.current = true;
      setPlaying(true);
      fadeTo(TARGET_VOLUME, 900);
    } catch (error) {
      playingRef.current = false;
      setPlaying(false);
      console.warn("[MUSIC] Không thể phát nhạc nền:", error);
    } finally {
      startingRef.current = false;
    }
  }, [ensureAudio, fadeTo]);

  const start = useCallback(() => {
    wantsPlayRef.current = true;
    void play();
  }, [play]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    wantsPlayRef.current = false;
    playingRef.current = false;
    setPlaying(false);
    if (!audio) return;
    fadeTo(0, 320, () => audio.pause());
  }, [fadeTo]);

  const toggle = useCallback(() => {
    if (playingRef.current) {
      writeMuted(true);
      setMuted(true);
      stop();
      return;
    }
    writeMuted(false);
    setMuted(false);
    start();
  }, [start, stop]);

  useEffect(() => {
    if (muted) return;
    const onGesture = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-music-toggle]")) {
        return;
      }
      start();
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, [muted, start]);

  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) {
        clearFade();
        audio.pause();
        playingRef.current = false;
        setPlaying(false);
      } else if (wantsPlayRef.current && !muted) {
        void play();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [clearFade, muted, play]);

  useEffect(
    () => () => {
      clearFade();
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.remove();
      }
      audioRef.current = null;
    },
    [clearFade],
  );

  return { muted, playing, toggle };
}
