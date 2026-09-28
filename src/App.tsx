import React, { useState, useEffect, useRef } from 'react';
import { checkOllamaConnection, fetchModels, streamChat } from './services/ollamaService';
import Markdown from 'react-markdown';
import { Send, Server, RefreshCw, Bot, User, Trash2, AlertCircle, AlertTriangle, CheckCircle2, Info, MessageSquareText, ChevronDown, ChevronUp, Sliders, Code, FileText, Copy, Check, Paperclip, File, X, Volume2, Mic, MicOff, Radio, Ear, Settings, Keyboard, BookOpen, Download, Upload } from 'lucide-react';
import { ParameterPanel } from './components/ParameterPanel';
import { TTSPanel } from './components/TTSPanel';
import { HearingPanel } from './components/HearingPanel';
import { GeneralSettingsPanel } from './components/GeneralSettingsPanel';
import { PromptLibrary } from './components/PromptLibrary';
import { ShortcutOverlay } from './components/ShortcutOverlay';
import { SpeakingVisualizer } from './components/SpeakingVisualizer';
import { TTSConfig, synthesizeAndPlayTTS } from './services/ttsService';
import { Message, OllamaModel, ConnectionStatus, OllamaParameters, HearingConfig, AppSettings, SavedPrompt, ThemeType, ChatSession } from './types';

import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
// Import a prism theme? Or use custom styles?
// Since I cannot create CSS files, I will use Tailwind to mimic a simple theme or just rely on prism classes.
// I will just use prism to highlight.

function CodeBlock({ node, inline, className, children, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : 'text';
  const codeText = String(children).replace(/\n$/, '');
  
  const highlighted = Prism.highlight(codeText, Prism.languages[lang] || Prism.languages.text, lang);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code className="bg-zinc-200 dark:bg-zinc-800 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded font-mono text-[11px]" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-100 font-mono text-xs">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-zinc-400">
        <span className="text-[11px] font-medium uppercase tracking-wider">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition font-sans shadow-sm"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed">
        <code className={className} dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

export default function App() {
  const [baseUrl, setBaseUrl] = useState<string>(() => {
    return localStorage.getItem('ollama_simple_base_url') || 'http://localhost:11434';
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'connecting',
    url: baseUrl,
  });

  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('ollama_simple_selected_model') || '';
  });

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [customModelInput, setCustomModelInput] = useState<string>('');
  const [isUsingCustomModel, setIsUsingCustomModel] = useState<boolean>(false);

  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    return localStorage.getItem('ollama_simple_system_prompt') || 'You are a helpful, respectful, and concise AI assistant.';
  });
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState<boolean>(false);

  const [parameters, setParameters] = useState<OllamaParameters>(() => {
    const saved = localStorage.getItem('ollama_simple_parameters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      num_ctx: 4096,
      repeat_penalty: 1.1,
    };
  });
  const [isParameterPanelOpen, setIsParameterPanelOpen] = useState<boolean>(false);

  const [ttsConfig, setTtsConfig] = useState<TTSConfig>(() => {
    const saved = localStorage.getItem('ollama_simple_tts_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      engine: 'kokoro',
      url: 'http://localhost:8880',
      voice: 'af_heart',
      speed: 1.0,
    };
  });
  const [isTTSPanelOpen, setIsTTSPanelOpen] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const activeTTSStopRef = useRef<(() => void) | null>(null);

  const [hearingConfig, setHearingConfig] = useState<HearingConfig>(() => {
    const saved = localStorage.getItem('ollama_simple_hearing_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      deviceId: '',
      silenceTimeout: 1500,
      volumeThreshold: 15,
      language: 'en-US',
    };
  });
  const [isHearingPanelOpen, setIsHearingPanelOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ollama_simple_app_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      theme: 'classic',
      enableLocation: false,
      enableTelemetry: true,
      fontSize: 'medium',
      uiDensity: 'comfortable',
      useSystemTheme: true,
    };
  });
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);
  const [isLiveVoiceMode, setIsLiveVoiceMode] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const isCurrentlyListeningRef = useRef<boolean>(false);
  const lastSpeechTimeRef = useRef<number>(0);
  const silenceTimerRef = useRef<any>(null);
  const currentTranscriptRef = useRef<string>('');
  const isSoundAboveThresholdRef = useRef<boolean>(true);

  // Volume Monitoring for Thresholding
  useEffect(() => {
    if (!isLiveVoiceMode || isGenerating || playingMessageId) return;

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let stream: MediaStream | null = null;
    let animationFrame: number | null = null;

    const startMonitoring = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: hearingConfig.deviceId ? { deviceId: { exact: hearingConfig.deviceId } } : true 
        });
        
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const checkVolume = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          const normalized = Math.min(100, Math.round((average / 128) * 100));
          
          isSoundAboveThresholdRef.current = normalized >= hearingConfig.volumeThreshold;
          
          animationFrame = requestAnimationFrame(checkVolume);
        };
        
        checkVolume();
      } catch (err) {
        console.error('Error starting volume monitor:', err);
      }
    };

    startMonitoring();

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (audioContext) audioContext.close();
    };
  }, [isLiveVoiceMode, isGenerating, playingMessageId, hearingConfig.deviceId, hearingConfig.volumeThreshold]);

  useEffect(() => {
    localStorage.setItem('ollama_simple_tts_config', JSON.stringify(ttsConfig));
  }, [ttsConfig]);

  useEffect(() => {
    localStorage.setItem('ollama_simple_app_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  // System theme synchronization
  useEffect(() => {
    if (!appSettings.useSystemTheme) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => {
      if (mediaQuery.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [appSettings.useSystemTheme]);


  // Handle Location Permission Mock
  useEffect(() => {
    if (appSettings.enableLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => console.log('Location access granted', pos),
        (err) => console.warn('Location access denied or unavailable', err)
      );
    }
  }, [appSettings.enableLocation]);

  const handlePlayTTS = async (msgId: string, text: string) => {
    if (playingMessageId === msgId) {
      if (activeTTSStopRef.current) {
        activeTTSStopRef.current();
        activeTTSStopRef.current = null;
      }
      setPlayingMessageId(null);
      return;
    }

    if (activeTTSStopRef.current) {
      activeTTSStopRef.current();
      activeTTSStopRef.current = null;
    }

    setPlayingMessageId(msgId);
    try {
      const stopFn = await synthesizeAndPlayTTS(
        text,
        ttsConfig,
        () => {},
        () => {
          setPlayingMessageId(null);
          activeTTSStopRef.current = null;
        },
        (err) => {
          console.error('TTS error:', err);
          setPlayingMessageId(null);
          activeTTSStopRef.current = null;
        }
      );
      activeTTSStopRef.current = stopFn;
    } catch (e) {
      console.error('Failed to start TTS:', e);
      setPlayingMessageId(null);
      activeTTSStopRef.current = null;
    }
  };

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('ollama_simple_chat_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [{
      id: 'default',
      name: 'Default Chat',
      messages: [],
      updatedAt: Date.now()
    }];
  });
  const [activeSessionId, setActiveSessionId] = useState<string>('default');

  const messages = sessions.find(s => s.id === activeSessionId)?.messages || [];
  const setMessages = (newMessages: Message[] | ((prev: Message[]) => Message[])) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: typeof newMessages === 'function' ? newMessages(s.messages) : newMessages,
          updatedAt: Date.now()
        };
      }
      return s;
    }));
  };

  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>(baseUrl);
  const [rawMessageIds, setRawMessageIds] = useState<Record<string, boolean>>({});

  const toggleMessageViewMode = (id: string) => {
    setRawMessageIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const [attachedFiles, setAttachedFiles] = useState<{ name: string; content: string; size: number }[]>([]);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isShortcutOverlayOpen, setIsShortcutOverlayOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatImportRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now(), type, message });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputMessage]);

  const handleExportChat = () => {
    if (messages.length === 0) {
      showToast('info', 'No messages to export.');
      return;
    }
    try {
      const data = JSON.stringify(messages, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_history_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Chat history exported successfully!');
    } catch (err) {
      showToast('error', 'Failed to export chat.');
    }
  };

  const handleImportChat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          setMessages(data);
          showToast('success', `Imported ${data.length} messages successfully!`);
          setTimeout(() => textareaRef.current?.focus(), 100);
        } else {
          showToast('error', 'Invalid chat file format. Expected a JSON message array.');
        }
      } catch (e) {
        showToast('error', 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string || '';
        setAttachedFiles(prev => [...prev, { name: file.name, content, size: file.size }]);
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter to send
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSendMessage();
      }
      // Ctrl+K to clear chat
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (messages.length > 0) handleClearChat();
      }
      // Ctrl+L for Live Voice
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setIsLiveVoiceMode(prev => !prev);
      }
      // Ctrl+, for settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsAppSettingsOpen(true);
      }
      // Ctrl+Shift+? for shortcuts overlay
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '?') {
        e.preventDefault();
        setIsShortcutOverlayOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [messages.length, isLiveVoiceMode]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('ollama_simple_base_url', baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    localStorage.setItem('ollama_simple_selected_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('ollama_simple_system_prompt', systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    localStorage.setItem('ollama_simple_parameters', JSON.stringify(parameters));
  }, [parameters]);

  useEffect(() => {
    localStorage.setItem('ollama_simple_messages', JSON.stringify(messages));
  }, [messages]);

  // Speech Recognition Logic
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // Changed to true for custom silence detection
    recognition.lang = hearingConfig.language;

    recognition.onstart = () => {
      isCurrentlyListeningRef.current = true;
    };

    recognition.onend = () => {
      isCurrentlyListeningRef.current = false;
      // Restart if still in live mode
      if (isLiveVoiceMode && !isGenerating && !playingMessageId) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    recognition.onresult = (event: any) => {
      if (!isSoundAboveThresholdRef.current) return;

      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const fullTranscript = (finalTranscript + interimTranscript).trim();
      if (fullTranscript) {
        currentTranscriptRef.current = fullTranscript;
        lastSpeechTimeRef.current = Date.now();
        
        // Reset silence timer
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        silenceTimerRef.current = setTimeout(() => {
          if (currentTranscriptRef.current.trim() && isLiveVoiceMode) {
            handleSpeechMessage(currentTranscriptRef.current.trim());
            currentTranscriptRef.current = '';
          }
        }, hearingConfig.silenceTimeout);
      }
    };

    recognitionRef.current = recognition;

    if (isLiveVoiceMode && !isGenerating && !playingMessageId) {
      try {
        recognition.start();
      } catch (e) {}
    } else {
      try {
        recognition.stop();
      } catch (e) {}
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [isLiveVoiceMode, isGenerating, playingMessageId, hearingConfig]);

  const handleSpeechMessage = (text: string) => {
    // We update input message and trigger send
    setInputMessage(text);
    // Use a timeout to ensure state update is reflected if needed, 
    // or better yet, refactor handleSendMessage to take an optional override
    setTimeout(() => {
      const submitBtn = document.getElementById('send-message-btn');
      submitBtn?.click();
    }, 100);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Check connection and fetch models
  const checkConnectionAndFetchModels = async (urlToTest: string) => {
    setConnectionStatus({ status: 'connecting', url: urlToTest });
    const res = await checkOllamaConnection(urlToTest);

    if (res.success) {
      setConnectionStatus({ status: 'connected', url: urlToTest, version: res.version });
      try {
        const fetchedModels = await fetchModels(urlToTest);
        setModels(fetchedModels);
        if (fetchedModels.length > 0 && !selectedModel) {
          setSelectedModel(fetchedModels[0].name);
        }
      } catch (err) {
        console.error('Failed to fetch models', err);
      }
    } else {
      setConnectionStatus({ status: 'error', url: urlToTest, error: res.error });
    }
  };

  useEffect(() => {
    checkConnectionAndFetchModels(baseUrl);
  }, [baseUrl]);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setBaseUrl(urlInput.trim());
    setIsEditingUrl(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const textToSend = inputMessage.trim();
    const activeModel = isUsingCustomModel ? customModelInput.trim() : selectedModel;

    if ((!textToSend && attachedFiles.length === 0) || isGenerating) return;
    if (!activeModel) {
      alert('Please select or enter an Ollama model name.');
      return;
    }

    const userMsg: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: textToSend || 'Please analyze the attached file(s).',
      timestamp: Date.now(),
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    const assistantMsgId = `msg_${Date.now()}_assistant`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg, assistantMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
    setIsGenerating(true);

    abortControllerRef.current = new AbortController();

    try {
      const apiMessages = updatedMessages.slice(0, -1).map(m => {
        let content = m.content;
        if (m.attachments && m.attachments.length > 0) {
          const fileContexts = m.attachments.map(f => `File: ${f.name}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n');
          content = `${fileContexts}\n\n${content}`;
        }
        return {
          role: m.role,
          content: content,
        };
      });

      await streamChat(
        baseUrl,
        activeModel,
        apiMessages,
        {
          system: systemPrompt,
          parameters: parameters,
        },
        (fullText) => {
          setMessages(prev =>
            prev.map(m => (m.id === assistantMsgId ? { ...m, content: fullText } : m))
          );
        },
        abortControllerRef.current.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: `⚠️ Error: ${err.message || 'Failed to communicate with Ollama server.'}` }
              : m
          )
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Clear Chat Messages',
      message: 'Are you sure you want to clear all messages in the current conversation? This action cannot be undone.',
      confirmLabel: 'Clear Chat',
      isDestructive: true,
      onConfirm: () => {
        setMessages([]);
        setConfirmModal(null);
        showToast('info', 'Chat history cleared.');
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    });
  };

  const activeModelName = isUsingCustomModel ? customModelInput : selectedModel;

  return (
    <div className={`flex flex-col h-screen w-screen theme-container ${appSettings.theme !== 'classic' ? `theme-${appSettings.theme} bg-theme` : 'bg-zinc-50 dark:bg-zinc-950'} text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden relative ${appSettings.fontSize === 'small' ? 'text-[11px]' : appSettings.fontSize === 'large' ? 'text-[14px]' : 'text-[13px]'}`}>
      {/* Top Header / Server Configuration Bar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm tracking-tight">Ollama Messenger</h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus.status === 'connected'
                      ? 'bg-emerald-500 animate-pulse'
                      : connectionStatus.status === 'connecting'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="capitalize font-medium text-zinc-600 dark:text-zinc-300">
                  {connectionStatus.status}
                  {connectionStatus.version ? ` (v${connectionStatus.version})` : ''}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              URL: <span className="font-mono">{baseUrl}</span>
            </p>
          </div>
        </div>

        {/* Server URL & Model Settings */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Parameters Button */}
          <button
            onClick={() => {
              setIsParameterPanelOpen(!isParameterPanelOpen);
              if (isSystemPromptOpen) setIsSystemPromptOpen(false);
            }}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-orange-500/50 bg-zinc-100 dark:bg-zinc-800/60 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition flex items-center gap-1.5 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-orange-500" />
            Parameters
          </button>

          <div className="flex items-center gap-2">
            <input 
              placeholder="Search chat..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs w-36 focus:ring-1 focus:ring-orange-500 transition-all focus:outline-none"
              aria-label="Search chat messages"
            />
            <span className="text-[10px] text-zinc-500 font-mono">
              {messages.reduce((acc, m) => acc + (m.content.split(' ').length), 0)} tokens
            </span>
            <button
              onClick={() => setIsShortcutOverlayOpen(true)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 hover:border-orange-500/50 transition shadow-sm"
              title="Keyboard Shortcuts (?)"
              aria-label="Open keyboard shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPromptLibraryOpen(true)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 hover:border-orange-500/50 transition shadow-sm"
              title="Prompt Library"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <input type="file" ref={chatImportRef} onChange={handleImportChat} className="hidden" accept=".json" />
            <button
              onClick={() => chatImportRef.current?.click()}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 hover:border-orange-500/50 transition shadow-sm"
              title="Import Chat"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportChat}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 hover:border-orange-500/50 transition shadow-sm"
              title="Export Chat"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAppSettingsOpen(true)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 hover:border-orange-500/50 transition shadow-sm"
              title="General Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsTTSPanelOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-orange-500/50 bg-zinc-100 dark:bg-zinc-800/60 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition flex items-center gap-1.5 shadow-sm"
              title="Configure Kokoro & Supersonic TTS"
            >
              <Volume2 className="w-3.5 h-3.5 text-orange-500" />
              TTS: <span className="capitalize font-semibold">{ttsConfig.engine}</span>
            </button>
          </div>

          {/* Live Voice Toggle */}
          <div className="flex items-center">
            <button
              onClick={() => setIsLiveVoiceMode(!isLiveVoiceMode)}
              className={`px-3 py-1.5 rounded-l-lg border transition flex items-center gap-1.5 shadow-sm text-xs font-medium ${
                isLiveVoiceMode 
                  ? 'bg-rose-500/10 border-rose-500/50 text-rose-600 dark:text-rose-400' 
                  : 'bg-zinc-100 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-orange-500/50'
              }`}
              title={isLiveVoiceMode ? "Disable Live Voice Mode" : "Enable Live Voice Mode"}
            >
              {isLiveVoiceMode ? (
                <>
                  <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  <span>ON AIR</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Live Voice</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsHearingPanelOpen(true)}
              className={`px-2 py-1.5 border-y border-r transition flex items-center gap-1.5 shadow-sm text-xs font-medium rounded-r-lg ${
                isLiveVoiceMode
                  ? 'bg-rose-500/10 border-rose-500/50 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-orange-500/50'
              }`}
              title="Hearing & Voice Settings"
            >
              <Ear className="w-3.5 h-3.5 text-orange-500" />
            </button>
          </div>

          {/* System Prompt Toggle Button */}
          <button
            onClick={() => {
              setIsSystemPromptOpen(!isSystemPromptOpen);
              if (isParameterPanelOpen) setIsParameterPanelOpen(false);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
              systemPrompt.trim()
                ? 'border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-300'
                : 'border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5 text-orange-500" />
            System Prompt
            {isSystemPromptOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {isEditingUrl ? (
            <form onSubmit={handleSaveUrl} className="flex items-center gap-1.5">
              <input
                type="text"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="http://localhost:11434"
                className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500 w-52"
              />
              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setUrlInput(baseUrl);
                  setIsEditingUrl(false);
                }}
                className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 px-2.5 py-1.5 rounded-lg text-xs transition"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setUrlInput(baseUrl);
                setIsEditingUrl(true);
              }}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-orange-500 bg-zinc-100 dark:bg-zinc-800/60 text-xs font-medium transition flex items-center gap-1.5"
            >
              <Server className="w-3.5 h-3.5 text-orange-500" />
              Configure URL
            </button>
          )}

          {/* Model Selector */}
          <div className="flex items-center gap-1.5">
            {!isUsingCustomModel ? (
              <select
                value={selectedModel}
                onChange={e => {
                  if (e.target.value === '__custom__') {
                    setIsUsingCustomModel(true);
                    setCustomModelInput(selectedModel);
                  } else {
                    setSelectedModel(e.target.value);
                  }
                }}
                className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                {selectedModel && !models.some(m => m.name === selectedModel) && (
                  <option value={selectedModel}>{selectedModel}</option>
                )}
                {models.length === 0 && !selectedModel ? (
                  <option value="">No models found</option>
                ) : (
                  models.map(m => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))
                )}
                <option value="__custom__">+ Enter custom model name...</option>
              </select>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={customModelInput}
                  onChange={e => setCustomModelInput(e.target.value)}
                  placeholder="e.g. llama3.2"
                  className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono w-32 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <button
                  onClick={() => setIsUsingCustomModel(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-1"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              onClick={() => checkConnectionAndFetchModels(baseUrl)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="Refresh connection & models"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-rose-500/10 hover:text-rose-500 text-zinc-400 transition"
              title="Clear chat history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Floating Parameter Panel */}
      {isParameterPanelOpen && (
        <ParameterPanel
          parameters={parameters}
          onChange={setParameters}
          onClose={() => setIsParameterPanelOpen(false)}
        />
      )}

      {/* System Prompt Header Dropdown / Input Area */}
      {isSystemPromptOpen && (
        <div className="bg-orange-500/5 dark:bg-zinc-900 border-b border-orange-500/20 px-4 py-3 shrink-0 animate-in slide-in-from-top duration-150 z-10">
          <div className="max-w-4xl mx-auto space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <MessageSquareText className="w-3.5 h-3.5 text-orange-500" />
                System Prompt (Sent with every chat request)
              </label>
              <span className="text-[10px] text-zinc-400">Auto-saved to browser storage</span>
            </div>
            <textarea
              rows={2}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="e.g. You are a precise, technical coding assistant. Answer concisely with code snippets."
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-zinc-800 dark:text-zinc-100 resize-none shadow-sm"
            />
          </div>
        </div>
      )}

      {/* CORS Notice if connection fails */}
      {connectionStatus.status === 'error' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Could not connect to Ollama at <code className="font-mono bg-amber-500/20 px-1 py-0.5 rounded">{baseUrl}</code>. Ensure Ollama is running and CORS is enabled: <code className="font-mono bg-amber-500/20 px-1 py-0.5 rounded">OLLAMA_ORIGINS="*" ollama serve</code>
            </span>
          </div>
          <button
            onClick={() => checkConnectionAndFetchModels(baseUrl)}
            className="underline font-semibold ml-4 shrink-0 hover:text-amber-700 dark:hover:text-amber-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Bot className="w-6 h-6" />
            </div>
            <h2 className="font-semibold text-sm">Start chatting with {activeModelName || 'Ollama'}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Type a message below to chat with your local Ollama instance securely and privately.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())).map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 p-4 rounded-2xl ${
                    isUser
                      ? 'bg-zinc-100 dark:bg-zinc-900/60 ml-8'
                      : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mr-8 shadow-sm'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isUser
                        ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-orange-600 text-white'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 overflow-hidden space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">
                        {isUser ? 'You' : activeModelName || 'Ollama'}
                      </span>
                      {!isUser && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handlePlayTTS(msg.id, msg.content)}
                            className={`px-2 py-0.5 rounded border text-[10px] font-medium transition flex items-center gap-1 ${
                              playingMessageId === msg.id
                                ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                            title="Listen with Kokoro/Supersonic TTS"
                          >
                            <SpeakingVisualizer isActive={playingMessageId === msg.id} />
                            <Volume2 className={`w-3 h-3 ${playingMessageId === msg.id ? 'hidden' : ''}`} />
                            {playingMessageId === msg.id ? 'Playing' : 'Listen'}
                          </button>
                          <button
                            onClick={() => toggleMessageViewMode(msg.id)}
                            className="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[10px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1 text-zinc-600 dark:text-zinc-400"
                            title={rawMessageIds[msg.id] ? "Switch to Rendered Markdown" : "Switch to Raw Text"}
                          >
                            {rawMessageIds[msg.id] ? (
                              <>
                                <FileText className="w-3 h-3 text-orange-500" />
                                Markdown
                              </>
                            ) : (
                              <>
                                <Code className="w-3 h-3 text-orange-500" />
                                Raw Text
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-xs leading-relaxed prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200">
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {msg.attachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-zinc-200/70 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md text-[11px] text-zinc-700 dark:text-zinc-300">
                              <File className="w-3 h-3 text-orange-500 shrink-0" />
                              <span className="font-medium truncate max-w-[150px]">{att.name}</span>
                              <span className="text-[9px] text-zinc-400">({Math.round(att.size / 1024)} KB)</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {isUser || !rawMessageIds[msg.id] ? (
                        msg.content === '' && isGenerating && msg === messages[messages.length - 1] ? (
                          <div className="flex items-center gap-1.5 py-1.5 text-zinc-400">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            <span className="text-[11px] ml-1 text-zinc-400 font-medium">Thinking...</span>
                          </div>
                        ) : (
                          <Markdown components={{ code: CodeBlock }}>{msg.content}</Markdown>
                        )
                      ) : (
                        <pre className="whitespace-pre-wrap font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] overflow-x-auto text-zinc-800 dark:text-zinc-200">
                          {msg.content}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 space-y-3">
        {attachedFiles.length > 0 && (
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg text-xs">
                <File className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">{file.name}</span>
                <span className="text-[10px] text-zinc-400">({Math.round(file.size / 1024)} KB)</span>
                <button
                  type="button"
                  onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                  className="text-zinc-400 hover:text-rose-500 transition ml-1"
                  title="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition shrink-0 disabled:opacity-50 h-[42px] flex items-center justify-center"
            title="Attach files"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <div className="flex-1 relative flex items-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent transition">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if ((inputMessage.trim() || attachedFiles.length > 0) && !isGenerating) {
                    handleSendMessage();
                  }
                }
              }}
              placeholder={`Message ${activeModelName || 'Ollama'}... (Enter to send, Shift+Enter for newline)`}
              disabled={isGenerating}
              className="w-full bg-transparent px-4 py-2.5 text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 disabled:opacity-50 resize-none outline-none max-h-44 min-h-[42px] leading-relaxed custom-scrollbar"
            />
          </div>
          {isGenerating ? (
            <button
              type="button"
              onClick={handleStop}
              className="bg-rose-600 hover:bg-rose-700 text-white px-5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shadow-sm h-[42px] shrink-0"
            >
              Stop
            </button>
          ) : (
            <button
              id="send-message-btn"
              type="submit"
              disabled={!inputMessage.trim() && attachedFiles.length === 0}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shadow-sm h-[42px] shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          )}
        </form>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs animate-in slide-in-from-bottom-2 fade-in duration-150">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-orange-500 shrink-0" />}
          <span className="font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded transition"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{confirmModal.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{confirmModal.message}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmModal.onConfirm()}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition"
              >
                {confirmModal.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <TTSPanel
        isOpen={isTTSPanelOpen}
        onClose={() => setIsTTSPanelOpen(false)}
        config={ttsConfig}
        onSave={setTtsConfig}
      />

      <HearingPanel
        isOpen={isHearingPanelOpen}
        onClose={() => setIsHearingPanelOpen(false)}
        config={hearingConfig}
        onSave={setHearingConfig}
      />

      <GeneralSettingsPanel
        isOpen={isAppSettingsOpen}
        onClose={() => setIsAppSettingsOpen(false)}
        config={appSettings}
        onSave={setAppSettings}
      />
      
      <PromptLibrary
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        prompts={appSettings.savedPrompts || []}
        onSave={(prompts) => setAppSettings(prev => ({ ...prev, savedPrompts: prompts }))}
        onSelect={(content) => {
          setSystemPrompt(content);
          setIsPromptLibraryOpen(false);
          setIsSystemPromptOpen(true);
        }}
      />

      <ShortcutOverlay
        isOpen={isShortcutOverlayOpen}
        onClose={() => setIsShortcutOverlayOpen(false)}
      />
    </div>
  );
}
