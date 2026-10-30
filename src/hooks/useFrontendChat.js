import { useCallback, useRef, useState } from 'react';
import { OPENAI_API_KEY } from '../config/sharedApi';
import { resolveFigureVoice } from '../data/figureGuide';

let msgId = 0;
const nextId = () => `m${++msgId}`;

async function fetchTTS(text, voice, speed) {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice || 'onyx',
      speed: speed || 1.0,
      response_format: 'mp3',
    }),
  });
  if (!res.ok) throw new Error('TTS failed');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

function typewriterWords(text, onUpdate, onDone, cancelRef) {
  const words = text.split(' ');
  let i = 0;
  // pace: spread words evenly over ~85% of expected audio duration
  // fallback: 60ms per word
  const interval = setInterval(() => {
    if (cancelRef.current) {
      clearInterval(interval);
      return;
    }
    i += 1;
    onUpdate(words.slice(0, i).join(' '));
    if (i >= words.length) {
      clearInterval(interval);
      onDone();
    }
  }, 62);
  return () => clearInterval(interval);
}

export function useFrontendChat(systemPrompt, _greeting, profile, figureId) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const historyRef = useRef([]);
  const audioRef = useRef(null);
  const cancelTypeRef = useRef(false);
  const objectUrlsRef = useRef([]);

  const stopAudio = useCallback(() => {
    cancelTypeRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrlsRef.current = [];
    setIsSpeaking(false);
  }, []);

  const resetChat = useCallback((newGreeting) => {
    stopAudio();
    historyRef.current = [];
    cancelTypeRef.current = false;
    setMessages(
      newGreeting ? [{ id: nextId(), role: 'assistant', content: newGreeting }] : [],
    );
    setError(null);
    setIsLoading(false);
  }, [stopAudio]);

  const sendMessage = useCallback(async (content) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading || isSpeaking) return;

    stopAudio();
    cancelTypeRef.current = false;

    const userMsg = { id: nextId(), role: 'user', content: trimmed };
    const botId = nextId();
    const botMsg = { id: botId, role: 'assistant', content: '', _pending: true };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setIsLoading(true);
    setError(null);

    historyRef.current = [...historyRef.current, { role: 'user', content: trimmed }];

    try {
      // 1) Get text reply
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyRef.current,
          ],
          max_tokens: 300,
          temperature: 0.85,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `OpenAI error ${res.status}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || '…';
      historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];

      // 2) Fetch TTS in parallel — both start immediately
      const voiceConfig = profile ? resolveFigureVoice(profile, figureId) : {};
      const [audioUrl] = await Promise.all([
        fetchTTS(reply, voiceConfig.voice || 'onyx', voiceConfig.speed || 1.0),
      ]);

      objectUrlsRef.current.push(audioUrl);
      setIsLoading(false);
      setIsSpeaking(true);

      // 3) Start audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // 4) Start typewriter in sync with audio
      // Show first word immediately, then stream rest word by word
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId ? { ...m, content: '', _pending: false, _typing: true } : m,
        ),
      );

      await new Promise((resolve) => {
        audio.addEventListener('ended', resolve, { once: true });
        audio.addEventListener('error', resolve, { once: true });

        // Start typewriter timed to audio duration
        audio.addEventListener('loadedmetadata', () => {
          const duration = audio.duration || (reply.split(' ').length * 0.38);
          const msPerWord = (duration * 1000 * 0.88) / reply.split(' ').length;
          const words = reply.split(' ');
          let i = 0;
          const iv = setInterval(() => {
            if (cancelTypeRef.current) { clearInterval(iv); return; }
            i += 1;
            const partial = words.slice(0, i).join(' ');
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botId ? { ...m, content: partial, _typing: i < words.length } : m,
              ),
            );
            if (i >= words.length) clearInterval(iv);
          }, msPerWord);
        }, { once: true });

        // Fallback: if metadata never fires, show text immediately
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId ? { ...m, content: reply, _typing: false } : m,
            ),
          );
        }, 800);

        audio.play().catch(resolve);
      });

      // Ensure full text shown after audio ends
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId ? { ...m, content: reply, _typing: false } : m,
        ),
      );
      setIsSpeaking(false);
      if (audioRef.current === audio) audioRef.current = null;

    } catch (err) {
      setError(err.message || 'Failed to get response');
      setMessages((prev) => prev.filter((m) => !m._pending));
      historyRef.current = historyRef.current.slice(0, -1);
      setIsLoading(false);
      setIsSpeaking(false);
    }
  }, [isLoading, isSpeaking, systemPrompt, profile, figureId, stopAudio]);

  return { messages, isLoading, isSpeaking, error, sendMessage, resetChat };
}
