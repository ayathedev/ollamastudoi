import React, { useState } from 'react';
import { ChatSession, ConnectionStatus, OllamaModel } from '../types';
import {
  MessageSquare,
  Plus,
  Settings,
  Download,
  Trash2,
  Search,
  Cpu,
  RefreshCw,
  Terminal,
  ExternalLink,
  Moon,
  Sun,
  HardDrive
} from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  onOpenModelPull: () => void;
  connectionStatus: ConnectionStatus;
  models: OllamaModel[];
  selectedModel: string;
  onSelectModel: (modelName: string) => void;
  onRefreshModels: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onOpenSettings,
  onOpenModelPull,
  connectionStatus,
  models,
  selectedModel,
  onSelectModel,
  onRefreshModels,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  return (
    <aside className="w-80 flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 select-none transition-colors">
      {/* Top Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-600 dark:bg-orange-500 flex items-center justify-center text-white shadow-md">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight">Ollama Studio</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionStatus.status === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : connectionStatus.status === 'connecting'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 capitalize">
                {connectionStatus.status}
                {connectionStatus.version ? ` (${connectionStatus.version})` : ''}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Model Selector & Quick Actions */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2.5 bg-white/50 dark:bg-zinc-900/30">
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 px-1">
            <span>ACTIVE MODEL</span>
            <button
              onClick={onRefreshModels}
              className="hover:text-zinc-800 dark:hover:text-zinc-200 transition flex items-center gap-1"
              title="Refresh models list"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value)}
              className="w-full appearance-none bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 pr-8 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-zinc-800 dark:text-zinc-100 cursor-pointer"
            >
              {models.length === 0 ? (
                <option value="">No local models found</option>
              ) : (
                models.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} {m.size ? `(${formatSize(m.size)})` : ''}
                  </option>
                ))
              )}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onNewChat}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg py-2 px-3 text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
          <button
            onClick={onOpenModelPull}
            className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg py-2 px-3 text-xs font-medium flex items-center justify-center gap-1.5 transition"
            title="Download/Pull Model"
          >
            <Download className="w-3.5 h-3.5" />
            Pull
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
          />
        </div>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 px-4 text-zinc-400 text-xs">
            No chat history. Start a new conversation above!
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition ${
                  isActive
                    ? 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-400'}`} />
                  <span className="truncate">{session.title || 'Untitled Chat'}</span>
                </div>
                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 rounded transition"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Settings */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/30 flex items-center justify-between">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition py-1 px-2 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
        >
          <Settings className="w-4 h-4 text-zinc-500" />
          Settings & Endpoint
        </button>
        <div className="text-[10px] text-zinc-400">
          Ollama Offline
        </div>
      </div>
    </aside>
  );
};
