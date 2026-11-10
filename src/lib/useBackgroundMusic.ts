import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "smarm_test_music_muted";
const BPM = 124;
const STEP_DURATION = 60 / BPM / 4;
const MASTER_VOLUME = 0.16;

type Chord = { bass: number; notes: number[] };

const CHORDS: Chord[] = [
  { bass: 65.41, notes: [261.63, 329.63, 392.0] },
  { bass: 55.0, notes: [220.0, 261.63, 329.63] },
  { bass: 43.65, notes: [174.61, 220.0, 261.63] },
  { bass: 49.0, notes: [196.0, 246.94, 293.66] },
];

const ARPEGGIO = [0, 2, 1, 2, 0, 1, 2, 1];
const MELODY = [0, 2, 4, 2, 1, 0, 2, 4];
const MELODY_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0];

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

  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const noiseRef = useRef<AudioBuffer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextTimeRef = useRef(0);
  const stepRef = useRef(0);
  const startingRef = useRef(false);

  const getNoise = (ctx: AudioContext) => {
    if (noiseRef.current) return noiseRef.current;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseRef.current = buffer;
    return buffer;
  };

  const tone = (
    ctx: AudioContext,
    out: AudioNode,
    options: {
      freq: number;
      time: number;
      duration: number;
      type?: OscillatorType;
      volume?: number;
      attack?: number;
      detune?: number;
    },
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const { freq, time, duration, type = "triangle", volume = 0.2, attack = 0.006 } = options;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    if (options.detune) osc.detune.setValueAtTime(options.detune, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(out);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  };

  const kick = (ctx: AudioContext, out: AudioNode, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.16);
    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
    osc.connect(gain);
    gain.connect(out);
    osc.start(time);
    osc.stop(time + 0.22);
  };

  const noiseHit = (
    ctx: AudioContext,
    out: AudioNode,
    time: number,
    options: { volume: number; duration: number; frequency: number; type: BiquadFilterType },
  ) => {
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = getNoise(ctx);
    filter.type = options.type;
    filter.frequency.setValueAtTime(options.frequency, time);
    gain.gain.setValueAtTime(options.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + options.duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    source.start(time);
    source.stop(time + options.duration + 0.02);
  };

  const scheduleStep = (ctx: AudioContext, out: AudioNode, step: number, time: number) => {
    const chord = CHORDS[Math.floor(step / 16) % CHORDS.length];
    const position = step % 16;
    const bar = Math.floor(step / 16);
    const beat = position % 4;

    if (position % 4 === 0) kick(ctx, out, time);
    if (position === 4 || position === 12) {
      noiseHit(ctx, out, time, { volume: 0.28, duration: 0.13, frequency: 1900, type: "bandpass" });
    }
    if (position % 2 === 0) {
      noiseHit(ctx, out, time, {
        volume: position % 4 === 0 ? 0.09 : 0.05,
        duration: 0.04,
        frequency: 8200,
        type: "highpass",
      });
    }

    if (beat === 0 || position === 6 || position === 10) {
      tone(ctx, out, {
        freq: chord.bass,
        time,
        duration: 0.26,
        type: "triangle",
        volume: 0.24,
      });
    }

    const arpIndex = ARPEGGIO[position % ARPEGGIO.length];
    tone(ctx, out, {
      freq: chord.notes[arpIndex] * 2,
      time,
      duration: 0.14,
      type: "sawtooth",
      volume: 0.045,
      attack: 0.004,
    });

    if (bar % 2 === 1 && position % 2 === 0) {
      const melodyNote = MELODY[Math.floor(position / 2) % MELODY.length];
      tone(ctx, out, {
        freq: MELODY_NOTES[melodyNote % MELODY_NOTES.length],
        time,
        duration: 0.22,
        type: "square",
        volume: 0.035,
        attack: 0.008,
      });
    }

    if (position === 0) {
      chord.notes.forEach((freq) => {
        tone(ctx, out, {
          freq,
          time,
          duration: 1.6,
          type: "sine",
          volume: 0.022,
          attack: 0.35,
        });
      });
    }
  };

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const ctx = contextRef.current;
    const master = masterRef.current;
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12);
    }
    window.setTimeout(() => {
      const active = contextRef.current;
      contextRef.current = null;
      masterRef.current = null;
      if (active && active.state !== "closed") {
        void active.close().catch(() => {});
      }
    }, 500);
    playingRef.current = false;
    setPlaying(false);
  }, []);

  const start = useCallback(async () => {
    if (startingRef.current) return;
    if (contextRef.current) {
      const ctx = contextRef.current;
      if (ctx.state === "suspended") await ctx.resume();
      playingRef.current = true;
      setPlaying(true);
      return;
    }

    startingRef.current = true;
    try {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;

      const ctx = new AudioCtor();
      await ctx.resume();

      const master = ctx.createGain();
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, ctx.currentTime);
      compressor.ratio.setValueAtTime(6, ctx.currentTime);
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(MASTER_VOLUME, ctx.currentTime + 1.2);
      master.connect(compressor);
      compressor.connect(ctx.destination);

      contextRef.current = ctx;
      masterRef.current = master;
      nextTimeRef.current = ctx.currentTime + 0.08;
      stepRef.current = 0;

      timerRef.current = setInterval(() => {
        const active = contextRef.current;
        if (!active || !masterRef.current) return;
        while (nextTimeRef.current < active.currentTime + 0.22) {
          scheduleStep(active, masterRef.current, stepRef.current, nextTimeRef.current);
          nextTimeRef.current += STEP_DURATION;
          stepRef.current += 1;
        }
      }, 80);

      playingRef.current = true;
      setPlaying(true);
    } catch (error) {
      console.warn("[MUSIC] Không thể phát nhạc nền:", error);
    } finally {
      startingRef.current = false;
    }
  }, []);

  const toggle = useCallback(() => {
    if (playingRef.current) {
      writeMuted(true);
      setMuted(true);
      stop();
      return;
    }
    writeMuted(false);
    setMuted(false);
    void start();
  }, [start, stop]);

  useEffect(() => {
    if (muted) return;
    const onGesture = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-music-toggle]")) {
        return;
      }
      void start();
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
      const ctx = contextRef.current;
      if (!ctx) return;
      if (document.hidden) {
        void ctx.suspend().catch(() => {});
      } else if (!muted) {
        void ctx.resume().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [muted]);

  useEffect(() => stop, [stop]);

  return { muted, playing, toggle };
}
