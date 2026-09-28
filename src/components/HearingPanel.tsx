import React, { useState, useEffect, useRef } from 'react';
import { HearingConfig } from '../types';
import { Ear, X, Check, Mic, Settings2, SlidersHorizontal, Languages } from 'lucide-react';

interface HearingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: HearingConfig;
  onSave: (config: HearingConfig) => void;
}

export const HearingPanel: React.FC<HearingPanelProps> = ({ isOpen, onClose, config, onSave }) => {
  const [deviceId, setDeviceId] = useState(config.deviceId);
  const [silenceTimeout, setSilenceTimeout] = useState(config.silenceTimeout);
  const [volumeThreshold, setVolumeThreshold] = useState(config.volumeThreshold);
  const [language, setLanguage] = useState(config.language);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [saved, setSaved] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDevices();
      startVolumeMeter();
    } else {
      stopVolumeMeter();
    }
    return () => stopVolumeMeter();
  }, [isOpen, deviceId]);

  const loadDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(device => device.kind === 'audioinput');
      setDevices(audioInputs);
    } catch (err) {
      console.error('Error loading audio devices:', err);
    }
  };

  const startVolumeMeter = async () => {
    try {
      stopVolumeMeter();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: deviceId ? { deviceId: { exact: deviceId } } : true 
      });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setCurrentVolume(normalized);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (err) {
      console.error('Error starting volume meter:', err);
    }
  };

  const stopVolumeMeter = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setCurrentVolume(0);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ deviceId, silenceTimeout, volumeThreshold, language });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Ear className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-sm">Hearing & Voice Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Microphone Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              Microphone Input
            </label>
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Default System Microphone</option>
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Volume Meter & Threshold */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Volume Threshold
              </span>
              <span className="font-mono text-orange-500">{volumeThreshold}%</span>
            </div>
            
            <div className="relative h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-2 overflow-hidden border border-zinc-200 dark:border-zinc-700">
              <div 
                className="absolute inset-y-0 left-0 bg-orange-500/20 transition-all duration-75"
                style={{ width: `${currentVolume}%` }}
              />
              <div 
                className="absolute inset-y-0 w-0.5 bg-orange-600 z-10 shadow-[0_0_8px_rgba(234,88,12,0.5)]"
                style={{ left: `${volumeThreshold}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-1 w-full flex gap-0.5 px-1 opacity-20">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="flex-1 bg-zinc-400 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
            
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={volumeThreshold}
              onChange={(e) => setVolumeThreshold(parseInt(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">
              Adjust the threshold to ignore background noise. The AI will only "hear" sounds above the orange line.
            </p>
          </div>

          {/* Silence Timeout */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" />
                Pause Length (Silence Timeout)
              </span>
              <span className="font-mono text-orange-500">{silenceTimeout}ms</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={silenceTimeout}
              onChange={(e) => setSilenceTimeout(parseInt(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <p className="text-[10px] text-zinc-400 mt-1.5">
              How long to wait after you stop speaking before sending the message.
            </p>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5" />
              Voice Recognition Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="en-US">English (United States)</option>
              <option value="en-GB">English (United Kingdom)</option>
              <option value="es-ES">Spanish (Spain)</option>
              <option value="fr-FR">French (France)</option>
              <option value="de-DE">German (Germany)</option>
              <option value="it-IT">Italian (Italy)</option>
              <option value="ja-JP">Japanese (Japan)</option>
              <option value="zh-CN">Chinese (Simplified)</option>
              <option value="pt-BR">Portuguese (Brazil)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-medium bg-orange-600 hover:bg-orange-700 text-white transition flex items-center gap-1.5 shadow-sm"
            >
              {saved ? <Check className="w-3.5 h-3.5 text-white" /> : null}
              <span>{saved ? 'Saved!' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
