import { OllamaModel, OllamaParameters, ModelDetailsResponse } from '../types';

export async function checkOllamaConnection(baseUrl: string): Promise<{ success: boolean; version?: string; error?: string }> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/version`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return { success: false, error: `HTTP error! status: ${res.status}` };
    }

    const data = await res.json();
    return { success: true, version: data.version || 'unknown' };
  } catch (err: any) {
    let msg = err.message || 'Failed to connect to Ollama';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS')) {
      msg = 'CORS or Network Error. Ensure Ollama is running and OLLAMA_ORIGINS="*" is configured.';
    }
    return { success: false, error: msg };
  }
}

export async function fetchModels(baseUrl: string): Promise<OllamaModel[]> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/tags`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch models: ${res.statusText}`);
  }

  const data = await res.json();
  return data.models || [];
}

export async function fetchModelDetails(baseUrl: string, modelName: string): Promise<ModelDetailsResponse> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/show`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName }),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch model details: ${res.statusText}`);
  }

  return await res.json();
}

export async function pullModel(
  baseUrl: string,
  modelName: string,
  onProgress: (status: string, completed?: number, total?: number) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName, stream: true }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to pull model: ${errText || res.statusText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Response body reader not available');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        onProgress(json.status || 'Downloading...', json.completed, json.total);
      } catch (e) {
        // ignore parse error on partial lines
      }
    }
  }
}

export async function deleteModel(baseUrl: string, modelName: string): Promise<void> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to delete model: ${errText || res.statusText}`);
  }
}

export async function streamChat(
  baseUrl: string,
  model: string,
  messages: { role: string; content: string }[],
  options?: {
    system?: string;
    parameters?: OllamaParameters;
  },
  onChunk?: (
    text: string,
    done: boolean,
    stats?: { evalCount?: number; evalDuration?: number; promptEvalCount?: number }
  ) => void,
  signal?: AbortSignal
): Promise<string> {
  const formattedMessages = [...messages];
  if (options?.system) {
    formattedMessages.unshift({ role: 'system', content: options.system });
  }

  const body: any = {
    model,
    messages: formattedMessages,
    stream: true,
  };

  if (options?.parameters) {
    body.options = {
      temperature: options.parameters.temperature,
      top_p: options.parameters.top_p,
      top_k: options.parameters.top_k,
      num_predict: options.parameters.num_predict,
      num_ctx: options.parameters.num_ctx,
      repeat_penalty: options.parameters.repeat_penalty,
      seed: options.parameters.seed,
    };
  }

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama API error (${res.status}): ${errText || res.statusText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Response body reader not available');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        const content = json.message?.content || '';
        fullText += content;

        if (json.done) {
          onChunk?.(fullText, true, {
            evalCount: json.eval_count,
            evalDuration: json.eval_duration,
            promptEvalCount: json.prompt_eval_count,
          });
        } else {
          onChunk?.(fullText, false);
        }
      } catch (e) {
        // ignore JSON parse error on incomplete chunks
      }
    }
  }

  return fullText;
}
