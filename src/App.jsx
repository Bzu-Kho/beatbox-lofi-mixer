import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import { Play, Square, Save, Upload, Download, Volume2, VolumeX, Music, SlidersHorizontal, Drum, Wand2 } from "lucide-react";

// --- Helpers ---
const INSTRUMENTS = [
  { key: "kick", label: "Kick", color: "bg-emerald-600", note: "C1", type: "membrane" },
  { key: "snare", label: "Snare", color: "bg-rose-600", note: null, type: "snare" },
  { key: "chh", label: "Hi‑Hat C", color: "bg-zinc-600", note: null, type: "hihatC" },
  { key: "ohh", label: "Hi‑Hat O", color: "bg-zinc-500", note: null, type: "hihatO" },
  { key: "clap", label: "Clap", color: "bg-fuchsia-600", note: null, type: "clap" },
  { key: "perc", label: "Perc", color: "bg-sky-600", note: "D2", type: "metal" },
];

const STEPS = 16; // 1 bar of 16ths; loop length configurable via bars * STEPS

function defaultPattern() {
  const pattern = {};
  INSTRUMENTS.forEach(({ key }) => (pattern[key] = new Array(STEPS).fill(false)));
  // Lo‑fi / Yiruma-friendly groove (80–90 BPM)
  pattern.kick[0] = true; // 1
  pattern.kick[8] = true; // 3
  pattern.snare[4] = true; // 2
  pattern.snare[12] = true; // 4
  // Closed hats on 8ths
  for (let i = 0; i < STEPS; i += 2) pattern.chh[i] = true;
  // Gentle off-beat open hat
  pattern.ohh[10] = true;
  // Soft clap layered with snare
  pattern.clap[4] = true; pattern.clap[12] = true;
  // Perc taste
  pattern.perc[14] = true;
  return pattern;
}

// Create Tone.js nodes per instrument
function useAudioEngine() {
  const readyRef = useRef(false);
  const masterRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mediaDestRef = useRef(null);

  const nodesRef = useRef({});

  const ensure = async () => {
    if (readyRef.current) return;
    await Tone.start();

    // Master bus
    const master = new Tone.Gain(0.9);
    master.connect(Tone.Destination);

    // Recorder tap
    const ctx = Tone.getContext().rawContext;
    const mediaDest = ctx.createMediaStreamDestination();
    master.connect(mediaDest);
    mediaDestRef.current = mediaDest;

    // Build instruments
    const makeVol = () => new Tone.Volume(-6).connect(master);

    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 5,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.0, release: 0.1 },
    });
    kick.connect(makeVol());

    // Snare = noise through filter + fast env
    const snareNoise = new Tone.Noise("white");
    const snareFilter = new Tone.Filter(1800, "bandpass");
    const snareEnv = new Tone.Envelope({ attack: 0.001, decay: 0.12, sustain: 0.0, release: 0.03 });
    snareNoise.connect(snareFilter);
    snareFilter.connect(makeVol());

    // Closed HH
    const chhNoise = new Tone.Noise("white");
    const chhFilter = new Tone.Filter(9000, "highpass");
    const chhEnv = new Tone.AmplitudeEnvelope({ attack: 0.001, decay: 0.04, sustain: 0.0, release: 0.02 });
    chhNoise.connect(chhFilter);
    const chhOut = makeVol();
    chhFilter.connect(chhEnv).connect(chhOut);

    // Open HH
    const ohhNoise = new Tone.Noise("white");
    const ohhFilter = new Tone.Filter(8000, "highpass");
    const ohhEnv = new Tone.AmplitudeEnvelope({ attack: 0.001, decay: 0.15, sustain: 0.0, release: 0.08 });
    ohhNoise.connect(ohhFilter);
    const ohhOut = makeVol();
    ohhFilter.connect(ohhEnv).connect(ohhOut);

    // Clap (short multi-burst noise)
    const clapNoise = new Tone.Noise("white");
    const clapFilter = new Tone.Filter(1500, "bandpass");
    const clapEnv = new Tone.AmplitudeEnvelope({ attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 });
    clapNoise.connect(clapFilter);
    const clapOut = makeVol();
    clapFilter.connect(clapEnv).connect(clapOut);

    // Metal perc
    const metal = new Tone.MetalSynth({
      frequency: 200,
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    });
    metal.connect(makeVol());

    nodesRef.current = {
      kick: { synth: kick, vol: kick.output?.volume || new Tone.Volume(), mute: false, solo: false },
      snare: { synth: { noise: snareNoise, env: snareEnv, filter: snareFilter }, vol: snareFilter.volume || new Tone.Volume(), mute: false, solo: false },
      chh: { synth: { noise: chhNoise, env: chhEnv }, vol: chhOut, mute: false, solo: false },
      ohh: { synth: { noise: ohhNoise, env: ohhEnv }, vol: ohhOut, mute: false, solo: false },
      clap: { synth: { noise: clapNoise, env: clapEnv }, vol: clapOut, mute: false, solo: false },
      perc: { synth: metal, vol: metal.output?.volume || new Tone.Volume(), mute: false, solo: false },
    };

    masterRef.current = master;
    readyRef.current = true;

    // Recorder setup
    const stream = mediaDest.stream;
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    recorderRef.current = recorder;
  };

  const trigger = (which, time) => {
    const node = nodesRef.current[which];
    if (!node) return;
    
    const t = time || Tone.now();
    
    if (which === "kick") {
      node.synth.triggerAttackRelease("C1", "16n", t);
    } else if (which === "perc") {
      node.synth.triggerAttackRelease("D2", "16n", t);
    } else {
      // Noise-based instruments
      const { noise, env } = node.synth;
      noise.start(t);
      env.triggerAttackRelease("16n", t);
      noise.stop(t + 0.2);
    }
  };

  const setVolume = (key, db) => {
    const n = nodesRef.current[key];
    if (n) n.vol.volume.value = db;
  };

  const setMute = (key, mute) => {
    const n = nodesRef.current[key];
    n.vol.mute = mute;
  };

  const setSolo = (key, solo) => {
    const n = nodesRef.current[key];
    n.solo = solo;
    // If any track is solo'd, mute all others
    const anySolo = Object.values(nodesRef.current).some((x) => x.solo);
    Object.entries(nodesRef.current).forEach(([k, node]) => {
      node.vol.mute = anySolo ? !node.solo : false;
    });
  };

  const startRecording = () => recorderRef.current?.start();
  const stopRecording = () => new Promise((resolve) => {
    const rec = recorderRef.current;
    if (!rec) return resolve(new Blob());
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      chunksRef.current = [];
      resolve(blob);
    };
    rec.stop();
  });

  return {
    ensure,
    trigger,
    setVolume,
    setMute,
    setSolo,
    startRecording,
    stopRecording,
  };
}

function BeatboxMixerApp() {
  const [pattern, setPattern] = useState(defaultPattern);
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(85);
  const [bars, setBars] = useState(1);
  const [currentStep, setCurrentStep] = useState(-1);
  const [backingFile, setBackingFile] = useState(null);
  const [recording, setRecording] = useState(false);

  const playerRef = useRef(null);
  const backingPlayerRef = useRef(null);

  const engine = useAudioEngine();

  const loopLength = bars * STEPS;

  useEffect(() => {
    engine.ensure();
  }, []);

  // Transport + loop
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [bpm]);

  const togglePlay = () => {
    if (playing) {
      Tone.Transport.stop();
      setPlaying(false);
      setCurrentStep(-1);
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    } else {
      setPlaying(true);
      setCurrentStep(0);
      
      // Schedule the pattern
      const schedulePattern = () => {
        if (playerRef.current) playerRef.current.dispose();
        
        playerRef.current = new Tone.Sequence(
          (time, step) => {
            setCurrentStep(step);
            INSTRUMENTS.forEach(({ key }) => {
              if (pattern[key][step]) {
                engine.trigger(key, time);
              }
            });
          },
          Array.from({ length: loopLength }, (_, i) => i),
          "16n"
        );
        
        playerRef.current.start(0);
      };
      
      schedulePattern();
      Tone.Transport.start();
    }
  };

  const toggleCell = (instrKey, i) => {
    setPattern((p) => ({ ...p, [instrKey]: p[instrKey].map((v, idx) => (idx === i ? !v : v)) }));
  };

  const clearAll = () => setPattern(defaultPattern());

  const randomize = () => {
    setPattern((p) => {
      const np = {};
      INSTRUMENTS.forEach((inst) => {
        np[inst.key] = p[inst.key].map((_, i) => {
          const baseProb = inst.key === "kick" ? 0.25 : inst.key === "snare" ? (i % 4 === 0 ? 0.1 : 0.05) : 0.2;
          return Math.random() < baseProb;
        });
      });
      return np;
    });
  };

  const savePattern = () => {
    const data = JSON.stringify({ pattern, bpm, bars });
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "beatbox-pattern.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVolume = (key, e) => {
    const val = parseFloat(e.target.value);
    engine.setVolume(key, val);
  };

  const handleMute = (key, mute) => engine.setMute(key, mute);
  const handleSolo = (key, solo) => engine.setSolo(key, solo);

  const handleBacking = async (file) => {
    await engine.ensure();
    if (!file) return;
    
    if (backingPlayerRef.current) {
      backingPlayerRef.current.dispose();
      backingPlayerRef.current = null;
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = await Tone.getContext().decodeAudioData(arrayBuffer);
    backingPlayerRef.current = new Tone.Player(buffer).toDestination();
  };

  const toggleBacking = () => {
    const player = backingPlayerRef.current;
    if (!player) return;
    
    if (player.state === "started") {
      player.stop();
    } else {
      player.start();
    }
  };

  const exportAudio = async () => {
    if (recording) {
      // Stop recording
      const blob = await engine.stopRecording();
      setRecording(false);
      
      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "beatbox-mix.webm";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Start recording
      engine.startRecording();
      setRecording(true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setBackingFile(file);
    handleBacking(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold mb-2">🥁 Beatbox Mixer</h1>
          <p className="text-slate-300">Crea ritmos lo-fi con síntesis en tiempo real</p>
        </header>

        {/* Transport */}
        <section className="rounded-2xl bg-slate-800/60 shadow p-4">
          <div className="flex flex-wrap items-center gap-4 justify-center">
            <button onClick={togglePlay} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${playing ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
              {playing ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? "Stop" : "Play"}
            </button>
            
            <div className="flex items-center gap-2">
              <label className="text-sm">BPM:</label>
              <input type="range" min={60} max={140} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-20" />
              <span className="text-sm w-8">{bpm}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm">Compases:</label>
              <input type="range" min={1} max={4} value={bars} onChange={(e) => setBars(Number(e.target.value))} className="w-16" />
              <span className="text-sm w-4">{bars}</span>
            </div>
            
            <button onClick={clearAll} className="px-3 py-2 rounded-xl bg-slate-700 hover:opacity-90">Limpiar</button>
            <button onClick={randomize} className="px-3 py-2 rounded-xl bg-purple-600 hover:opacity-90 flex items-center gap-1"><Wand2 className="h-4 w-4" />Random</button>
            <button onClick={savePattern} className="px-3 py-2 rounded-xl bg-blue-600 hover:opacity-90 flex items-center gap-1"><Save className="h-4 w-4" />Save</button>
            <button onClick={exportAudio} className={`px-3 py-2 rounded-xl flex items-center gap-1 ${recording ? "bg-red-600" : "bg-green-600"} hover:opacity-90`}>
              <Download className="h-4 w-4" />
              {recording ? "Stop Rec" : "Record"}
            </button>
          </div>
        </section>

        {/* Pattern grid */}
        <section className="rounded-2xl bg-slate-800/60 shadow p-4">
          <div className="flex items-center gap-2 mb-4"><Drum className="h-5 w-5" /><h2 className="font-semibold">Secuenciador</h2></div>
          <div className="grid gap-2">
            {INSTRUMENTS.map((inst) => (
              <React.Fragment key={inst.key}>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="flex items-center gap-2 w-20">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${inst.color}`}></span>
                    <span>{inst.label}</span>
                  </div>
                  <div className="grid grid-cols-16 gap-1 flex-1">
                    {pattern[inst.key].slice(0, loopLength).map((on, i) => {
                      const accent = i % 4 === 0;
                      return (
                        <button
                          key={i}
                          onClick={() => toggleCell(inst.key, i)}
                          className={`h-8 rounded-lg transition-all ${on ? "bg-emerald-600" : accent ? "bg-slate-700/60" : "bg-slate-700/30"} ${currentStep === i ? "ring-2 ring-emerald-300" : ""}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Backing track */}
        <section>
          <div className="p-4 rounded-2xl bg-slate-800/60 shadow">
            <div className="flex items-center gap-2 mb-3"><Music className="h-4 w-4"/><h2 className="font-semibold">Backing (opcional)</h2></div>
            <input type="file" accept="audio/*" onChange={handleFileChange} />
            <div className="mt-3 flex gap-2">
              <button onClick={toggleBacking} className="px-3 py-2 rounded-xl bg-indigo-600 hover:opacity-90">Play/Stop backing</button>
            </div>
          </div>
        </section>

        {/* Mixers */}
        <section className="rounded-2xl bg-slate-800/60 shadow p-4">
          <h2 className="font-semibold mb-4">Mezcla</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {INSTRUMENTS.map((inst) => (
              <div key={inst.key} className="p-3 rounded-xl bg-slate-900/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><span className={`inline-block h-2.5 w-2.5 rounded-full ${inst.color}`}></span><span className="font-medium">{inst.label}</span></div>
                  <div className="flex items-center gap-1">
                    <button onClick={()=>handleMute(inst.key, true)} className="px-2 py-1 rounded bg-slate-700/60" title="Mute"><VolumeX className="h-4 w-4"/></button>
                    <button onClick={()=>handleMute(inst.key, false)} className="px-2 py-1 rounded bg-slate-700/60" title="Unmute"><Volume2 className="h-4 w-4"/></button>
                    <button onClick={()=>handleSolo(inst.key, true)} className="px-2 py-1 rounded bg-slate-700/60" title="Solo">S</button>
                    <button onClick={()=>handleSolo(inst.key, false)} className="px-2 py-1 rounded bg-slate-700/60" title="Unsolo">A</button>
                  </div>
                </div>
                <label className="text-xs opacity-70">Vol (dB)</label>
                <input type="range" min={-36} max={6} defaultValue={-6} onChange={(e)=>handleVolume(inst.key, e)} className="w-full"/>
              </div>
            ))}
          </div>
        </section>

        <footer className="text-xs opacity-60 text-center pt-2">Tip: exporta 4 compases y repítelos en tu DAW. Evita mezclar audio con material con copyright salvo uso legítimo.</footer>
      </div>
    </div>
  );
}

export default BeatboxMixerApp;