import React from 'react';
import { OllamaParameters } from '../types';
import { Sliders, RotateCcw } from 'lucide-react';

interface ParameterPanelProps {
  parameters: OllamaParameters;
  onChange: (params: OllamaParameters) => void;
  onClose: () => void;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  parameters,
  onChange,
  onClose,
}) => {
  const updateParam = <K extends keyof OllamaParameters>(key: K, value: OllamaParameters[K]) => {
    onChange({
      ...parameters,
      [key]: value,
    });
  };

  const resetDefaults = () => {
    onChange({
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      num_ctx: 4096,
      repeat_penalty: 1.1,
    });
  };

  return (
    <div className="absolute right-4 top-16 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-zinc-800 dark:text-zinc-200">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-orange-500" />
          <h3 className="font-semibold text-xs tracking-tight">Model Parameters</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetDefaults}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="text-xs font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        {/* Temperature */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-medium text-zinc-600 dark:text-zinc-300">Temperature</span>
            <span className="font-mono text-orange-600 dark:text-orange-400 font-semibold">{parameters.temperature}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={parameters.temperature}
            onChange={(e) => updateParam('temperature', parseFloat(e.target.value))}
            className="w-full accent-orange-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
            <span>Precise (0.0)</span>
            <span>Creative (2.0)</span>
          </div>
        </div>

        {/* Top P */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-medium text-zinc-600 dark:text-zinc-300">Top P</span>
            <span className="font-mono text-orange-600 dark:text-orange-400 font-semibold">{parameters.top_p}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={parameters.top_p}
            onChange={(e) => updateParam('top_p', parseFloat(e.target.value))}
            className="w-full accent-orange-500 cursor-pointer"
          />
        </div>

        {/* Top K */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-medium text-zinc-600 dark:text-zinc-300">Top K</span>
            <span className="font-mono text-orange-600 dark:text-orange-400 font-semibold">{parameters.top_k ?? 40}</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={parameters.top_k ?? 40}
            onChange={(e) => updateParam('top_k', parseInt(e.target.value, 10))}
            className="w-full accent-orange-500 cursor-pointer"
          />
        </div>

        {/* Context Window (num_ctx) */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-medium text-zinc-600 dark:text-zinc-300">Context Window (num_ctx)</span>
            <span className="font-mono text-orange-600 dark:text-orange-400 font-semibold">{parameters.num_ctx}</span>
          </div>
          <select
            value={parameters.num_ctx}
            onChange={(e) => updateParam('num_ctx', parseInt(e.target.value, 10))}
            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value={2048}>2048 tokens</option>
            <option value={4096}>4096 tokens</option>
            <option value={8192}>8192 tokens</option>
            <option value={16384}>16384 tokens</option>
            <option value={32768}>32768 tokens</option>
          </select>
        </div>

        {/* Repeat Penalty */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-medium text-zinc-600 dark:text-zinc-300">Repeat Penalty</span>
            <span className="font-mono text-orange-600 dark:text-orange-400 font-semibold">{parameters.repeat_penalty ?? 1.1}</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="2.0"
            step="0.05"
            value={parameters.repeat_penalty ?? 1.1}
            onChange={(e) => updateParam('repeat_penalty', parseFloat(e.target.value))}
            className="w-full accent-orange-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
