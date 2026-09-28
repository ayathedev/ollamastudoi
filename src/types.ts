export type Role = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  evalCount?: number;
  evalDuration?: number; // in nanoseconds
  promptEvalCount?: number;
  attachments?: { name: string; content: string; size: number }[];
}

export interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  updatedAt: number;
  title?: string;
  model?: string;
  createdAt?: number;
  systemPrompt?: string;
  parameters?: OllamaParameters;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    parent_model?: string;
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface OllamaParameters {
  temperature: number;
  top_p: number;
  top_k?: number;
  num_predict?: number;
  num_ctx: number;
  repeat_penalty?: number;
  seed?: number;
}

export interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  url: string;
  version?: string;
  error?: string;
}

export interface ModelDetailsResponse {
  license?: string;
  modelfile?: string;
  parameters?: string;
  template?: string;
  details?: OllamaModel['details'];
  model_info?: Record<string, any>;
}

export interface HearingConfig {
  deviceId: string;
  silenceTimeout: number; // in ms
  volumeThreshold: number; // 0-100
  language: string;
}

export interface SavedPrompt {
  id: string;
  name: string;
  content: string;
  category: string;
}

export type ThemeType = 'classic' | 'midnight' | 'forest' | 'sunset' | 'industrial' | 'nordic';

export interface AppSettings {
  theme: ThemeType;
  enableLocation: boolean;
  enableTelemetry: boolean;
  fontSize: 'small' | 'medium' | 'large';
  uiDensity: 'compact' | 'comfortable';
  savedPrompts: SavedPrompt[];
  useSystemTheme: boolean;
}
