import React, { useState } from 'react';
import { SavedPrompt } from '../types';
import { BookOpen, X, Trash2, Plus, Check } from 'lucide-react';

interface PromptLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: SavedPrompt[];
  onSave: (prompts: SavedPrompt[]) => void;
  onSelect: (content: string) => void;
}

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ isOpen, onClose, prompts, onSave, onSelect }) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!name || !content || !category) return;
    onSave([...prompts, { id: crypto.randomUUID(), name, content, category }]);
    setName('');
    setContent('');
    setCategory('');
  };

  const handleDelete = (id: string) => {
    onSave(prompts.filter(p => p.id !== id));
  };

  const categories = ['All', ...Array.from(new Set(prompts.map(p => p.category)))];
  const filteredPrompts = filterCategory === 'All' ? prompts : prompts.filter(p => p.category === filterCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-500" /> System Prompt Library
          </h2>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <input placeholder="Prompt Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg text-xs" />
            <input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg text-xs" />
            <textarea placeholder="Prompt Content" value={content} onChange={e => setContent(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg text-xs h-24" />
            <button onClick={handleAdd} className="w-full bg-orange-600 text-white p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2">
              <Plus className="w-3 h-3" /> Add Prompt
            </button>
          </div>

          <div className="flex gap-2">
            {categories.map(c => (
                <button key={c} onClick={() => setFilterCategory(c)} className={`px-2 py-1 rounded text-[10px] ${filterCategory === c ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                    {c}
                </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredPrompts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <div className="flex flex-col">
                    <button onClick={() => onSelect(p.content)} className="text-xs font-medium hover:text-orange-500">{p.name}</button>
                    <span className="text-[9px] text-zinc-500">{p.category}</span>
                </div>
                <button onClick={() => handleDelete(p.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
