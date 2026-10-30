import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrontendChat } from '../hooks/useFrontendChat';
import {
  FIGURE_PROMPTS,
  buildFigureGreeting,
  buildFigureSystemPrompt,
} from '../data/figureGuide';

function firstName(profile) {
  return profile.shortName || (profile.name || 'Friend').split(' ')[0];
}

export default function TalkPanel({ profile, figureId }) {
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  const name = useMemo(() => firstName(profile), [profile]);
  const systemPrompt = useMemo(() => buildFigureSystemPrompt(profile), [profile]);
  const greeting = useMemo(() => buildFigureGreeting(profile), [profile]);

  const { messages, isLoading, isSpeaking, isPaused, error, sendMessage, resetChat, togglePause } =
    useFrontendChat(systemPrompt, '', profile, figureId);

  useEffect(() => {
    setStarted(false);
    setInput('');
    resetChat('');
  }, [figureId, resetChat]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isLoading, isSpeaking]);

  const busy = isLoading || isSpeaking;
  const hasUserMessage = messages.some((m) => m.role === 'user');
  const showPrompts = started && !busy && !hasUserMessage && !error;

  const handleStart = () => {
    setStarted(true);
    resetChat(greeting);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    sendMessage(text);
  };

  if (!started) {
    return (
      <div className="ht-talk-intro hv-fade">
        <div className="ht-talk-intro__era">{profile.category}</div>
        <h2 className="ht-talk-intro__name">{profile.name}</h2>
        <p className="ht-talk-intro__job">{profile.job}</p>
        <p className="ht-talk-intro__tagline">
          Entra en la historia. Pregúntame lo que quieras sobre mi vida, mi época y mi legado.
        </p>
        <button type="button" className="ht-talk-intro__btn hv-rise" onClick={handleStart}>
          Iniciar conversación
        </button>
      </div>
    );
  }

  const statusLabel = isLoading ? 'Pensando…' : isPaused ? 'En pausa' : isSpeaking ? 'Hablando…' : 'En vivo';

  return (
    <div className="ht-talk hv-fade">
      <div className="ht-talk__header">
        <span className={`ht-talk__live-dot${isSpeaking ? ' ht-talk__live-dot--speaking' : ''}`} />
        <span className="ht-talk__name">{name}</span>
        <span className="ht-talk__status">{statusLabel}</span>
        {isSpeaking && (
          <button
            type="button"
            className={`ht-talk__pause${isPaused ? ' ht-talk__pause--paused' : ''}`}
            onClick={togglePause}
            aria-label={isPaused ? 'Reanudar' : 'Pausar'}
          >
            {isPaused ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3 2l9 5-9 5V2z"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="2" y="2" width="4" height="10" rx="1"/>
                <rect x="8" y="2" width="4" height="10" rx="1"/>
              </svg>
            )}
            {isPaused ? 'Reanudar' : 'Pausar'}
          </button>
        )}
        <button
          type="button"
          className="ht-talk__reset"
          disabled={busy}
          onClick={() => resetChat(greeting)}
        >
          Nueva conversación
        </button>
      </div>

      <div className="ht-talk__messages" ref={listRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`ht-talk__bubble ht-talk__bubble--${msg.role === 'user' ? 'user' : 'bot'}${msg._pending ? ' ht-talk__bubble--pending' : ''}${msg._typing ? ' ht-talk__bubble--typing' : ''}`}
          >
            {msg._pending ? (
              <span className="ht-talk__dots">
                <span /><span /><span />
              </span>
            ) : msg.content}
            {msg._typing && <span className="ht-talk__cursor" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="ht-talk__error" role="alert">{error}</div>
      )}

      {showPrompts && (
        <div className="ht-talk__prompts">
          {FIGURE_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              className="ht-talk__chip"
              onClick={() => sendMessage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <form className="ht-talk__composer" onSubmit={handleSend}>
        <input
          className="ht-talk__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Pregunta a ${name} lo que quieras…`}
          disabled={busy}
          autoComplete="off"
        />
        <button
          type="submit"
          className="ht-talk__send"
          disabled={busy || !input.trim()}
        >
          {isLoading ? 'Pensando…' : isSpeaking ? 'Hablando…' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
