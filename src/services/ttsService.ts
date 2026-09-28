export interface TTSConfig {
  engine: 'kokoro' | 'supersonic' | 'browser';
  url: string; // e.g. http://localhost:8880 for Kokoro or http://localhost:8000 for Supersonic
  voice: string; // e.g. af_heart
  speed: number; // 0.5 to 2.0
}

export async function checkTTSConnection(url: string): Promise<boolean> {
  try {
    const cleanUrl = url.replace(/\/$/, '');
    const res = await fetch(`${cleanUrl}/v1/models`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    return res.ok;
  } catch (e) {
    try {
      // Fallback health check
      const cleanUrl = url.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/`, { method: 'GET' });
      return res.status < 500;
    } catch (err) {
      return false;
    }
  }
}

export async function synthesizeAndPlayTTS(
  text: string,
  config: TTSConfig,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): Promise<() => void> {
  const cleanText = text
    .replace(/```[\s\S]*?```/g, ' [code block] ')
    .replace(/`([^`]+)`/g, '$1');

  if (config.engine === 'browser') {
    if (!('speechSynthesis' in window)) {
      throw new Error('Browser speech synthesis not supported.');
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = config.speed;
    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = (e) => {
      if (onError) onError(e);
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utterance);
    return () => {
      window.speechSynthesis.cancel();
      if (onEnd) onEnd();
    };
  }

  const endpoint = config.url.replace(/\/$/, '') + '/v1/audio/speech';
  if (onStart) onStart();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.engine === 'supersonic' ? 'supersonic' : 'kokoro',
        input: cleanText,
        voice: config.voice || 'af_heart',
        speed: config.speed || 1.0,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS server responded with ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.playbackRate = config.speed;

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      if (onEnd) onEnd();
    };
    audio.onerror = (e) => {
      URL.revokeObjectURL(audioUrl);
      if (onError) onError(e);
      if (onEnd) onEnd();
    };

    await audio.play();
    return () => {
      audio.pause();
      audio.currentTime = 0;
      URL.revokeObjectURL(audioUrl);
      if (onEnd) onEnd();
    };
  } catch (err) {
    console.warn('Kokoro/Supersonic TTS API failed, falling back to browser SpeechSynthesis:', err);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = config.speed;
      if (onStart) utterance.onstart = onStart;
      if (onEnd) utterance.onend = onEnd;
      utterance.onerror = (e) => {
        if (onError) onError(e);
        if (onEnd) onEnd();
      };
      window.speechSynthesis.speak(utterance);
      return () => {
        window.speechSynthesis.cancel();
        if (onEnd) onEnd();
      };
    } else {
      if (onError) onError(err);
      if (onEnd) onEnd();
      throw err;
    }
  }
}
