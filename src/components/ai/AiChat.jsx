import { useEffect, useRef, useState } from 'react';
import AiAvatar from './AiAvatar';

function TypingDots() {
  return (
    <span className="ai-chat__typing" aria-label="Thinking">
      <span />
      <span />
      <span />
    </span>
  );
}

/**
 * MuseTalk talk UI (same layout/API flow as Tour AiChat, without browser OpenAI).
 */
export default function AiChat({
  title,
  subtitle,
  destinationName,
  destinationImage,
  messages,
  isLoading,
  error,
  prompts = [],
  onSend,
  onReset,
  placeholder = 'Ask anything…',
  responseVideoUrl = null,
  responseVideoMuted = false,
  responseVideoRef = null,
  avatarStatus = 'idle',
  isSpeakingExternal = false,
  isTypingExternal = false,
  idleVideoSrc = '/videos/idle.mp4',
  guideName = null,
}) {
  const [input, setInput] = useState('');
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  const isSpeaking = isSpeakingExternal;
  const isTyping = isTypingExternal;
  const isThinking = isLoading || avatarStatus === 'thinking';
  const busy = isLoading || isSpeaking || isTyping;

  useEffect(() => {
    const box = messagesRef.current;
    if (!box) return;
    box.scrollTo({
      top: box.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading, isSpeaking, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    onSend(input);
    setInput('');
  };

  const handlePrompt = (prompt) => {
    if (busy) return;
    onSend(prompt);
  };

  const handleReset = () => {
    onReset?.();
    inputRef.current?.focus();
  };

  const showEmpty = messages.length === 0;
  const hasUserMessage = messages.some((msg) => msg.role === 'user');
  const showPrompts = prompts.length > 0 && !busy && !hasUserMessage;

  return (
    <div className="ai-guide-stage">
      <aside className="ai-guide-stage__avatar">
        <AiAvatar
          mouth={{ openness: 0 }}
          viseme="rest"
          isSpeaking={isSpeaking}
          isThinking={isThinking}
          isAnimating={false}
          speechProgress={null}
          responseVideoUrl={responseVideoUrl}
          responseVideoMuted={responseVideoMuted}
          responseVideoRef={responseVideoRef}
          idleVideoSrc={idleVideoSrc}
          destinationName={destinationName}
          guideName={guideName}
        />
      </aside>

      <section className="ai-chat" aria-label="Historical conversation">
        <header className="ai-chat__header">
          <div className="ai-chat__header-main">
            {destinationImage && (
              <div
                className="ai-chat__dest-thumb"
                style={{ backgroundImage: `url(${destinationImage})` }}
                aria-hidden="true"
              />
            )}
            <div>
              <h2 className="ai-chat__title">{title}</h2>
              {subtitle && <p className="ai-chat__subtitle">{subtitle}</p>}
            </div>
          </div>
          <div className="ai-chat__header-actions">
            <span className="ai-chat__badge ai-chat__badge--live">
              <span className="ai-chat__live-dot" />
              Live
            </span>
            {onReset && (
              <button
                type="button"
                className="ai-chat__icon-btn"
                onClick={handleReset}
                disabled={busy}
                title="Start a new conversation"
              >
                New chat
              </button>
            )}
          </div>
        </header>

        <div className="ai-chat__messages" ref={messagesRef}>
          {showEmpty && (
            <div className="ai-chat__empty">
              <p className="ai-chat__empty-title">Ready to talk</p>
              <p className="ai-chat__empty-text">
                Ask about my life, work, and era
                {destinationName ? ` — ${destinationName}` : ''}. Replies play with lip-sync.
              </p>
            </div>
          )}

          {messages.map((msg, index) => {
            const isLast = index === messages.length - 1;
            const waiting =
              msg.role === 'assistant' && !msg.content && isLoading && isLast;
            const typewriting = msg.role === 'assistant' && msg._typing;
            return (
              <div
                key={msg.id}
                className={`ai-chat__bubble-wrap ai-chat__bubble-wrap--${msg.role}${
                  isSpeaking && isLast && msg.role === 'assistant'
                    ? ' ai-chat__bubble-wrap--speaking'
                    : ''
                }${typewriting ? ' ai-chat__bubble-wrap--typing' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <span className="ai-chat__avatar-mark" aria-hidden="true">
                    {(guideName || 'H').charAt(0)}
                  </span>
                )}
                <div
                  className={`ai-chat__bubble ai-chat__bubble--${msg.role}${
                    waiting ? ' ai-chat__bubble--typing' : ''
                  }`}
                >
                  {waiting ? (
                    <TypingDots />
                  ) : (
                    <>
                      {msg.content}
                      {typewriting && (
                        <span className="ai-chat__cursor" aria-hidden="true" />
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="ai-chat__error" role="alert">
            {error}
          </div>
        )}

        {showPrompts && (
          <div className="ai-chat__prompts" aria-label="Suggested questions">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="ai-chat__prompt-btn"
                onClick={() => handlePrompt(prompt)}
                disabled={busy}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form className="ai-chat__input-row" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="ai-chat__input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={busy}
            autoComplete="off"
            aria-label="Message"
          />
          <button
            className="ai-chat__send"
            type="submit"
            disabled={busy || !input.trim()}
          >
            {isLoading
              ? 'Sending…'
              : isTyping
                ? 'Typing…'
                : isSpeaking
                  ? 'Speaking…'
                  : 'Send'}
          </button>
        </form>
      </section>
    </div>
  );
}
