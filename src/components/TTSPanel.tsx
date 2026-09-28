import React, { useState, useEffect } from 'react';
import { TTSConfig, checkTTSConnection } from '../services/ttsService';
import { Volume2, X, Check, Terminal, Copy, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface TTSPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: TTSConfig;
  onSave: (config: TTSConfig) => void;
}

export const TTSPanel: React.FC<TTSPanelProps> = ({ isOpen, onClose, config, onSave }) => {
  const [engine, setEngine] = useState<TTSConfig['engine']>(config.engine);
  const [url, setUrl] = useState<string>(config.url);
  const [voice, setVoice] = useState<string>(config.voice);
  const [speed, setSpeed] = useState<number>(config.speed);
  const [saved, setSaved] = useState(false);

  const [isChecking, setIsChecking] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && engine !== 'browser') {
      testConnection();
    }
  }, [isOpen, url, engine]);

  if (!isOpen) return null;

  const testConnection = async () => {
    setIsChecking(true);
    const ok = await checkTTSConnection(url);
    setIsConnected(ok);
    setIsChecking(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ engine, url, voice, speed });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(label);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const kokoroDockerCmd = `docker run -d -p 8880:8880 ghcr.io/remsky/kokoro-fastapi:v0.1.1`;
  const kokoroPipCmd = `pip install kokoro-fastapi && kokoro-fastapi`;
  const supersonicPipCmd = `pip install supertonic && supertonic serve`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-sm">Kokoro & Supersonic TTS Installer & Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              TTS Engine Selection
            </label>
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as any)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="kokoro">Kokoro TTS (Local FastAPI / OpenAI-compatible)</option>
              <option value="supersonic">Supersonic / Supertonic TTS</option>
              <option value="browser">Browser Speech Synthesis (Fallback)</option>
            </select>
          </div>

          {engine !== 'browser' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    TTS Server URL & Installation Status
                  </label>
                  <button
                    type="button"
                    onClick={testConnection}
                    disabled={isChecking}
                    className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                    Test Connection
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={engine === 'kokoro' ? 'http://localhost:8880' : 'http://localhost:8000'}
                    className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <div className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 ${
                    isConnected === true
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : isConnected === false
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                  }`}>
                    {isConnected === true ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Connected</span>
                      </>
                    ) : isConnected === false ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Not Running</span>
                      </>
                    ) : (
                      <span>Checking...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Download / Installation Guide */}
              <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <Terminal className="w-4 h-4 text-orange-500" />
                  <span>How to Install & Download {engine === 'kokoro' ? 'Kokoro TTS' : 'Supersonic TTS'}</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {engine === 'kokoro' ? (
                    <>
                      Kokoro-FastAPI provides ultra-fast neural text-to-speech. Run it locally via Docker or Python to enable high fidelity voice generation.
                    </>
                  ) : (
                    <>
                      Supersonic (Supertonic) TTS runs locally on your machine for zero-latency private audio generation.
                    </>
                  )}
                </p>

                {engine === 'kokoro' ? (
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-medium text-zinc-400 mb-1">
                        <span>Option 1: Docker (Recommended)</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(kokoroDockerCmd, 'kokoro-docker')}
                          className="text-orange-500 hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedCommand === 'kokoro-docker' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre className="bg-zinc-900 text-zinc-200 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto">
                        {kokoroDockerCmd}
                      </pre>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[10px] font-medium text-zinc-400 mb-1">
                        <span>Option 2: Python Pip</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(kokoroPipCmd, 'kokoro-pip')}
                          className="text-orange-500 hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedCommand === 'kokoro-pip' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre className="bg-zinc-900 text-zinc-200 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto">
                        {kokoroPipCmd}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-medium text-zinc-400 mb-1">
                      <span>Python Installation</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(supersonicPipCmd, 'supersonic-pip')}
                        className="text-orange-500 hover:underline flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedCommand === 'supersonic-pip' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className="bg-zinc-900 text-zinc-200 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto">
                      {supersonicPipCmd}
                    </pre>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Voice ID
                </label>
                <input
                  type="text"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  placeholder="e.g. af_heart, af_alloy, am_fenrir"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </>
          )}

          <div>
            <div className="flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              <span>Speech Speed</span>
              <span className="font-mono text-orange-500">{speed}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
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
