import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, OllamaParameters, OllamaModel } from '../types';
import Markdown from 'react-markdown';
import {
  Send,
  StopCircle,
  Sliders,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Terminal,
  Cpu,
  User,
  Bot,
  Zap,
  Info
} from 'lucide-react';

interface ChatAreaProps {
  session: ChatSession | null;
  onSendMessage: (content: string) => void;
  onStopGeneration: () => void;
  isGenerating: boolean;
  onOpenParameters: () => void;
  selectedModel: string;
  models: OllamaModel[];
  onRegenerate: () => void;
}

const STARTER_PROMPTS = [
  { title: 'Explain Quantum Computing', prompt: 'Explain quantum computing in simple terms for a high school student.' },
  { title: 'Write a Python script', prompt: 'Write a robust Python script to fetch stock prices and plot them using matplotlib.' },
  { title: 'Creative Writing', prompt: 'Write a short science fiction story about an AI discovering silence for the first time.' },
  { title: 'Code Review & Refactor', prompt: 'What are the best practices for structuring a React and TypeScript application?' },
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  session,
  onSendMessage,
  onStopGeneration,
  isGenerating,
  onOpenParameters,
  selectedModel,
  models,
  onRegenerate,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeModelObj = models.find((m) => m.name === selectedModel);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputMessage]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isGenerating) return;
    onSendMessage(inputMessage);
    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 relative overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 font-semibold text-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{selectedModel || 'No model selected'}</span>
              {activeModelObj?.details?.parameter_size && (
                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full text-[10px] font-mono">
                  {activeModelObj.details.parameter_size}
                </span>
              )}
            </h2>
            <p className="text-[10px] text-zinc-400">Local Offline Ollama Instance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenParameters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-orange-500/50 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-orange-500" />
            Parameters
          </button>
        </div>
      </header>

      {/* Message List or Empty State */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {!session || session.messages.length === 0 ? (
          <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">How can Ollama Studio help you today?</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
                Chat securely and privately with your local Ollama models with zero cloud dependency.
              </p>
            </div>

            {/* Starter Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
              {STARTER_PROMPTS.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(sp.prompt)}
                  className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 bg-zinc-50/50 dark:bg-zinc-900/40 text-left transition space-y-1 group hover:shadow-md"
                >
                  <h4 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                    {sp.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{sp.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {session.messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id || index}
                  className={`flex gap-4 p-4 rounded-2xl ${
                    isUser
                      ? 'bg-zinc-100/80 dark:bg-zinc-800/40 ml-12'
                      : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mr-12 shadow-sm'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isUser
                        ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-orange-600 text-white shadow-md'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex-1 space-y-2 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                        {isUser ? 'You' : selectedModel || 'Ollama'}
                      </span>
                      <div className="flex items-center gap-2">
                        {!isUser && msg.evalDuration && msg.evalCount && (
                          <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500" />
                            {((msg.evalCount / (msg.evalDuration / 1e9))).toFixed(1)} tok/s
                          </span>
                        )}
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 prose dark:prose-invert max-w-none">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Box Area */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shrink-0">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSend}
            className="relative bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/50"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${selectedModel || 'Ollama'}... (Shift+Enter for newline)`}
              className="w-full bg-transparent p-3.5 pr-14 text-xs focus:outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 resize-none max-h-48"
            />

            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="w-8 h-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md transition active:scale-95"
                  title="Stop generation"
                >
                  <StopCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="w-8 h-8 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white flex items-center justify-center shadow-md transition active:scale-95"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-zinc-400">
            <span>Ollama local chat runs entirely offline via API.</span>
            <span>{selectedModel ? `Model: ${selectedModel}` : 'No model selected'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
