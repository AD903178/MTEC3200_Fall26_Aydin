"use client";

import { useEffect, useRef, useState } from "react";

type RainAudioGraph = {
  context: AudioContext;
  source: AudioBufferSourceNode;
  highPass: BiquadFilterNode;
  lowPass: BiquadFilterNode;
  gain: GainNode;
};

export default function RainAudioControl() {
  const audioGraph = useRef<RainAudioGraph | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      const graph = audioGraph.current;
      if (!graph) {
        return;
      }

      graph.source.onended = null;
      audioGraph.current = null;
      void graph.context.close().catch((closeError: unknown) => {
        console.error("Unable to close the rain audio context.", closeError);
      });
    },
    [],
  );

  async function toggleRain() {
    setError("");
    const activeGraph = audioGraph.current;

    if (activeGraph) {
      audioGraph.current = null;
      activeGraph.gain.gain.cancelScheduledValues(activeGraph.context.currentTime);
      activeGraph.gain.gain.setTargetAtTime(
        0,
        activeGraph.context.currentTime,
        0.08,
      );
      activeGraph.source.stop(activeGraph.context.currentTime + 0.35);
      setIsPlaying(false);
      return;
    }

    if (typeof window.AudioContext !== "function") {
      setError("Soft rain audio is not supported by this browser.");
      return;
    }

    let context: AudioContext | null = null;
    let sourceToClean: AudioBufferSourceNode | null = null;

    try {
      context = new window.AudioContext();
      const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let index = 0; index < samples.length; index += 1) {
        samples[index] = Math.random() * 2 - 1;
      }

      const source = context.createBufferSource();
      sourceToClean = source;
      const highPass = context.createBiquadFilter();
      const lowPass = context.createBiquadFilter();
      const gain = context.createGain();

      source.buffer = buffer;
      source.loop = true;
      highPass.type = "highpass";
      highPass.frequency.value = 180;
      lowPass.type = "lowpass";
      lowPass.frequency.value = 1_100;
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.055, context.currentTime + 0.8);

      source.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(gain);
      gain.connect(context.destination);

      const graph = { context, source, highPass, lowPass, gain };
      source.onended = () => {
        source.disconnect();
        highPass.disconnect();
        lowPass.disconnect();
        gain.disconnect();
        void context?.close().catch((closeError: unknown) => {
          console.error("Unable to close the rain audio context.", closeError);
        });
      };
      audioGraph.current = graph;
      source.start();
      setIsPlaying(true);
      await context.resume();
    } catch {
      audioGraph.current = null;
      setIsPlaying(false);
      if (sourceToClean) {
        sourceToClean.onended = null;
      }
      if (context && context.state !== "closed") {
        void context.close().catch((closeError: unknown) => {
          console.error("Unable to close the rain audio context.", closeError);
        });
      }
      setError("Soft rain couldn't start. Check your browser's audio settings and try again.");
    }
  }

  return (
    <div className="rain-audio-control">
      <button
        className={`rain-toggle${isPlaying ? " is-playing" : ""}`}
        type="button"
        aria-label={`${isPlaying ? "Pause" : "Play"} soft rain sounds`}
        aria-pressed={isPlaying}
        title={`${isPlaying ? "Pause" : "Play"} soft rain sounds`}
        onClick={toggleRain}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 13.5h2m3 0h2m3 0h2m-10 4h2m3 0h2m3 0h2M7 9.5l1-2m4 2 .8-2m3.2 2 1-2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M4.5 11.5h15"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <span>Rain</span>
      </button>
      {error && (
        <span className="rain-audio-status" role="status">
          {error}
        </span>
      )}
    </div>
  );
}
