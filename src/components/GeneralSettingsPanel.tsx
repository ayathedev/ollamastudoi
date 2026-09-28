import React, { useState } from 'react';
import { AppSettings, ThemeType } from '../types';
import { Settings, X, Check, MapPin, BarChart3, Palette, Type, LayoutGrid, Info } from 'lucide-react';

interface GeneralSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppSettings;
  onSave: (config: AppSettings) => void;
}

const THEMES: { id: ThemeType; label: string; colors: string }[] = [
  { id: 'classic', label: 'Classic Studio', colors: 'bg-zinc-100 dark:bg-zinc-800' },
  { id: 'midnight', label: 'Midnight OLED', colors: 'bg-black' },
  { id: 'forest', label: 'Deep Forest', colors: 'bg-emerald-950' },
  { id: 'sunset', label: 'Crimson Sunset', colors: 'bg-rose-950' },
  { id: 'industrial', label: 'Industrial Steel', colors: 'bg-slate-900' },
  { id: 'nordic', label: 'Nordic Frost', colors: 'bg-indigo-950' },
];

export const GeneralSettingsPanel: React.FC<GeneralSettingsPanelProps> = ({ isOpen, onClose, config, onSave }) => {
  const [theme, setTheme] = useState<ThemeType>(config.theme);
  const [enableLocation, setEnableLocation] = useState(config.enableLocation);
  const [enableTelemetry, setEnableTelemetry] = useState(config.enableTelemetry);
  const [fontSize, setFontSize] = useState(config.fontSize);
  const [uiDensity, setUiDensity] = useState(config.uiDensity);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...config, theme, enableLocation, enableTelemetry, fontSize, uiDensity });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-sm">General Application Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Themes Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              Custom Workspace Themes
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    theme === t.id
                      ? 'border-orange-500 bg-orange-500/5 ring-1 ring-orange-500'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className={`w-full h-8 rounded-lg ${t.colors} border border-zinc-200 dark:border-zinc-700 shadow-inner`} />
                  <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Visuals */}
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" />
                  Font Scaling
                </label>
                <div className="flex bg-zinc-50 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFontSize(size)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all capitalize ${
                        fontSize === size
                          ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white'
                          : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Interface Density
                </label>
                <div className="flex bg-zinc-50 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  {(['compact', 'comfortable'] as const).map((density) => (
                    <button
                      key={density}
                      type="button"
                      onClick={() => setUiDensity(density)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all capitalize ${
                        uiDensity === density
                          ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white'
                          : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Privacy & Data */}
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Location Services
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold block">Share Location</span>
                    <span className="text-[9px] text-zinc-400 block leading-tight">Allow model access to GPS context</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableLocation(!enableLocation)}
                    className={`w-8 h-4 rounded-full transition-colors relative ${
                      enableLocation ? 'bg-orange-500' : 'bg-zinc-300 dark:bg-zinc-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${enableLocation ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  App Telemetry
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold block">Usage Analytics</span>
                    <span className="text-[9px] text-zinc-400 block leading-tight">Send anonymous crash & usage data</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableTelemetry(!enableTelemetry)}
                    className={`w-8 h-4 rounded-full transition-colors relative ${
                      enableTelemetry ? 'bg-orange-500' : 'bg-zinc-300 dark:bg-zinc-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${enableTelemetry ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 flex gap-2.5">
            <Info className="w-4 h-4 text-orange-500 shrink-0" />
            <p className="text-[10px] text-orange-800 dark:text-orange-200 leading-relaxed">
              Theme changes and UI density adjustments are applied instantly to the workspace. Location access is requested via the browser's native security context.
            </p>
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
