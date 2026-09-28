import React, { useState } from 'react';
import { ConnectionStatus } from '../types';
import { checkOllamaConnection } from '../services/ollamaService';
import { Server, CheckCircle2, AlertTriangle, ShieldCheck, Terminal, HelpCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseUrl: string;
  onSaveBaseUrl: (url: string) => void;
  connectionStatus: ConnectionStatus;
  onCheckConnection: () => void;
  defaultSystemPrompt: string;
  onSaveSystemPrompt: (prompt: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  baseUrl,
  onSaveBaseUrl,
  connectionStatus,
  onCheckConnection,
  defaultSystemPrompt,
  onSaveSystemPrompt,
}) => {
  const [urlInput, setUrlInput] = useState(baseUrl);
  const [systemPromptInput, setSystemPromptInput] = useState(defaultSystemPrompt);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string; version?: string } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await checkOllamaConnection(urlInput);
    setTestResult(res);
    setTesting(false);
  };

  const handleSave = () => {
    onSaveBaseUrl(urlInput);
    onSaveSystemPrompt(systemPromptInput);
    onCheckConnection();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-zinc-800 dark:text-zinc-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-sm">Ollama Connection & Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-sm font-bold p-1 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Base URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Ollama Endpoint URL</span>
              <span className="text-[10px] text-zinc-400 font-mono">Default: http://localhost:11434</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:11434"
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-zinc-800 dark:text-zinc-100"
              />
              <button
                onClick={handleTest}
                disabled={testing}
                className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-4 py-2.5 rounded-xl text-xs font-medium transition disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
            {testResult && (
              <div
                className={`mt-2 p-3 rounded-xl text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                )}
                <div>
                  {testResult.success ? (
                    <p className="font-medium">Successfully connected to Ollama (v{testResult.version})!</p>
                  ) : (
                    <div>
                      <p className="font-semibold">Connection failed</p>
                      <p className="text-[11px] mt-0.5 opacity-90">{testResult.error}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CORS Help Box */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Important: CORS Configuration for Browser Access</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              Since this app runs in your browser, Ollama must allow cross-origin requests from web applications. Set the <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono">OLLAMA_ORIGINS</code> environment variable before running Ollama:
            </p>
            <div className="bg-black/80 text-emerald-400 font-mono p-2.5 rounded-xl text-[11px] select-all">
              OLLAMA_ORIGINS="*" ollama serve
            </div>
            <p className="text-[10px] opacity-75">
              On macOS/Linux, you can also configure it in system preferences or launch daemon plist.
            </p>
          </div>

          {/* Default System Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Default System Prompt (Optional)
            </label>
            <textarea
              rows={3}
              value={systemPromptInput}
              onChange={(e) => setSystemPromptInput(e.target.value)}
              placeholder="e.g., You are a helpful AI assistant. Be concise, accurate, and helpful."
              className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-zinc-800 dark:text-zinc-100 resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-medium bg-orange-600 hover:bg-orange-700 text-white shadow-md transition active:scale-[0.98]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
