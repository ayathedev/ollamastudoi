import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutOverlay: React.FC<ShortcutOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl+Enter', action: 'Send Message' },
    { key: 'Ctrl+L', action: 'Toggle Live Voice' },
    { key: 'Ctrl+K', action: 'Clear Chat' },
    { key: 'Ctrl+,', action: 'Open Settings' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-orange-500" /> Shortcuts
          </h3>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2">
          {shortcuts.map(s => (
            <div key={s.key} className="flex justify-between text-xs p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
              <span className="font-mono text-orange-500">{s.key}</span>
              <span className="text-zinc-600 dark:text-zinc-400">{s.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
