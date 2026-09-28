import React, { useState } from 'react';
import { pullModel } from '../services/ollamaService';
import { Download, Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface ModelPullModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseUrl: string;
  onModelPulled: () => void;
}

const POPULAR_MODELS = [
  { name: 'llama3.2', description: 'Lightweight 3B model optimized for fast chat and instructions.' },
  { name: 'llama3.1', description: 'Powerful open-source model available in 8B and larger.' },
  { name: 'mistral', description: '7B model with strong reasoning and code generation capabilities.' },
  { name: 'phi3', description: 'Microsoft Phi-3 mini model with exceptional performance.' },
  { name: 'codellama', description: 'Specialized model for code generation, debugging, and review.' },
  { name: 'deepseek-r1', description: 'DeepSeek reasoning model for complex logical problem solving.' },
];

export const ModelPullModal: React.FC<ModelPullModalProps> = ({
  isOpen,
  onClose,
  baseUrl,
  onModelPulled,
}) => {
  const [modelNameInput, setModelNameInput] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [progress, setProgress] = useState<{ completed?: number; total?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePull = async (nameToPull: string) => {
    if (!nameToPull.trim()) return;
    setDownloading(true);
    setError(null);
    setSuccess(false);
    setStatusText(`Initiating pull for ${nameToPull}...`);
    setProgress(null);

    try {
      await pullModel(baseUrl, nameToPull.trim(), (status, completed, total) => {
        setStatusText(status);
        if (completed !== undefined && total !== undefined) {
          setProgress({ completed, total });
        }
      });
      setSuccess(true);
      setStatusText(`Successfully downloaded ${nameToPull}!`);
      onModelPulled();
    } catch (err: any) {
      setError(err.message || 'Failed to pull model');
    } finally {
      setDownloading(false);
    }
  };

  const percentage =
    progress && progress.total && progress.total > 0
      ? Math.round(((progress.completed || 0) / progress.total) * 100)
      : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-zinc-800 dark:text-zinc-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-sm">Download / Pull Ollama Model</h2>
          </div>
          <button
            onClick={onClose}
            disabled={downloading}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-sm font-bold p-1 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Custom Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Enter Model Name (from Ollama Library)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={modelNameInput}
                onChange={(e) => setModelNameInput(e.target.value)}
                placeholder="e.g., llama3.2:3b or mistral"
                disabled={downloading}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-zinc-800 dark:text-zinc-100 disabled:opacity-50"
              />
              <button
                onClick={() => handlePull(modelNameInput)}
                disabled={downloading || !modelNameInput.trim()}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-medium transition flex items-center gap-2 shadow-sm"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Pull Model
              </button>
            </div>
          </div>

          {/* Download Progress State */}
          {(downloading || success || error) && (
            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-2">
                  {downloading && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
                  {success && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {error && <AlertCircle className="w-4 h-4 text-rose-500" />}
                  <span>{statusText}</span>
                </span>
                {percentage !== null && <span className="font-mono">{percentage}%</span>}
              </div>

              {percentage !== null && (
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-orange-500 h-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )}

              {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-mono">{error}</p>}
            </div>
          )}

          {/* Popular Recommendations */}
          <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Recommended Models</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {POPULAR_MODELS.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 bg-zinc-50/50 dark:bg-zinc-900/30 transition group"
                >
                  <div className="space-y-0.5 pr-3">
                    <h4 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                      {m.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{m.description}</p>
                  </div>
                  <button
                    onClick={() => handlePull(m.name)}
                    disabled={downloading}
                    className="shrink-0 bg-zinc-200 dark:bg-zinc-800 hover:bg-orange-600 hover:text-white dark:hover:bg-orange-600 text-zinc-800 dark:text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    Pull
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
          <button
            onClick={onClose}
            disabled={downloading}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
