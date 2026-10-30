import { useEffect, useRef, useState } from 'react';
import {
  AVATAR,
  getCharacterImage,
  getMouthRegion,
  getPortraitFallbackImage,
  visemeToImage,
} from '../../config/avatar';

export default function AiAvatar({
  mouth,
  viseme = 'rest',
  isSpeaking,
  isThinking,
  isAnimating,
  speechProgress,
  responseVideoUrl = null,
  responseVideoMuted = false,
  responseVideoRef = null,
  idleVideoSrc = AVATAR.video.idle,
  destinationName = null,
  guideName = null,
}) {
  const m = getMouthRegion();
  const { video, frame } = AVATAR;
  const isFullBody = frame.mode === 'fullbody';
  const hasResponseUrl = Boolean(responseVideoUrl);
  const active = hasResponseUrl || isSpeaking || isAnimating;

  const [imgSrc, setImgSrc] = useState(getCharacterImage());
  const [visemesReady, setVisemesReady] = useState(false);
  const [idleReady, setIdleReady] = useState(false);
  const [idleSrcResolved, setIdleSrcResolved] = useState(idleVideoSrc || video.idle);
  /** Only overlay response after first frame — idle stays underneath (no blank flash). */
  const [responseReady, setResponseReady] = useState(false);
  const idleVideoElRef = useRef(null);
  const speakVideoElRef = useRef(null);
  const localResponseRef = useRef(null);

  const setResponseRef = (node) => {
    localResponseRef.current = node;
    if (typeof responseVideoRef === 'function') {
      responseVideoRef(node);
    } else if (responseVideoRef && 'current' in responseVideoRef) {
      responseVideoRef.current = node;
    }
  };

  const idleSrc = idleSrcResolved || video.idle;
  const useSpeakVideo = false;
  const useIdleVideo = Boolean(idleSrc);
  const showResponse = Boolean(responseVideoUrl);
  const hasVideoSurface = useIdleVideo || showResponse;

  const displayViseme = active ? viseme : 'closed';
  const visemeSrc = visemeToImage(displayViseme);

  useEffect(() => {
    let cancelled = false;
    const probe = new Image();
    probe.onload = () => {
      if (!cancelled) setVisemesReady(true);
    };
    probe.onerror = () => {
      if (!cancelled) setVisemesReady(false);
    };
    probe.src = AVATAR.visemes.closed;
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setIdleSrcResolved(idleVideoSrc || video.idle);
    setIdleReady(false);
  }, [idleVideoSrc, video.idle]);

  useEffect(() => {
    const el = idleVideoElRef.current;
    if (!el || !idleSrc) return undefined;

    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');

    const tryPlay = () => {
      const playPromise = el.play();
      if (playPromise?.catch) playPromise.catch(() => {});
    };

    const onReady = () => {
      setIdleReady(true);
      tryPlay();
    };

    if (el.readyState >= 2) onReady();
    else el.addEventListener('loadeddata', onReady, { once: true });

    tryPlay();
    return () => {
      el.removeEventListener('loadeddata', onReady);
    };
  }, [idleSrc]);

  // Keep idle looping under the response layer.
  useEffect(() => {
    if (!useIdleVideo) return;
    const el = idleVideoElRef.current;
    if (!el) return;
    el.muted = true;
    el.play()?.catch(() => {});
  }, [useIdleVideo, showResponse]);

  // Keep response <video> src in sync with React state (authoritative).
  useEffect(() => {
    const el = localResponseRef.current;
    if (!el) return undefined;

    if (!responseVideoUrl) {
      setResponseReady(false);
      el.pause();
      el.removeAttribute('src');
      try {
        el.load();
      } catch {
        // ignore
      }
      return undefined;
    }

    const absoluteUrl = /^https?:\/\//i.test(responseVideoUrl)
      ? responseVideoUrl
      : new URL(responseVideoUrl, window.location.origin).href;

    let cancelled = false;
    const markReady = () => {
      if (!cancelled) setResponseReady(true);
    };

    const current = el.currentSrc || el.src || '';
    if (current !== absoluteUrl) {
      el.src = absoluteUrl;
      el.load();
    }

    el.playsInline = true;
    el.muted = Boolean(responseVideoMuted);
    el.defaultMuted = Boolean(responseVideoMuted);

    if (el.readyState >= 2) markReady();
    el.addEventListener('loadeddata', markReady);
    el.addEventListener('canplay', markReady);
    el.addEventListener('playing', markReady);
    const fallback = window.setTimeout(markReady, 200);

    const playPromise = el.play();
    if (playPromise?.catch) playPromise.catch(() => {});

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      el.removeEventListener('loadeddata', markReady);
      el.removeEventListener('canplay', markReady);
      el.removeEventListener('playing', markReady);
    };
  }, [responseVideoUrl, responseVideoMuted]);

  useEffect(() => {
    const el = speakVideoElRef.current;
    if (!el || !useSpeakVideo) return;
    el.muted = true;
    el.playsInline = true;
    el.play()?.catch(() => {});
  }, [useSpeakVideo, video.speak]);

  const handleImageError = () => {
    if (isFullBody && imgSrc !== getPortraitFallbackImage()) {
      setImgSrc(getPortraitFallbackImage());
    }
  };

  const showVisemeOverlay =
    isFullBody && visemesReady && !showResponse && !useSpeakVideo && !useIdleVideo;

  let statusLabel = 'Ready';
  let statusClass = '';
  if (isThinking && !showResponse) {
    statusLabel = 'Preparing reply…';
    statusClass = 'ai-avatar__status-pill--think';
  } else if (showResponse || active) {
    statusLabel = showResponse ? 'Speaking with lip-sync' : 'Speaking';
    statusClass = 'ai-avatar__status-pill--speak';
  }

  return (
    <div
      className={`ai-avatar${isFullBody ? ' ai-avatar--fullbody' : ''}${hasVideoSurface ? ' ai-avatar--video' : ''}${showResponse ? ' ai-avatar--speaking' : ''}${isThinking && !showResponse ? ' ai-avatar--thinking' : ''}`}
    >
      <div className={`ai-avatar__frame${idleReady || showResponse ? ' is-ready' : ''}`}>
        <div className="ai-avatar__glow" aria-hidden="true" />
        <div className="ai-avatar__vignette" aria-hidden="true" />

        {/* Idle always underneath — prevents blank flash during response swaps */}
        {idleSrc && (
          <video
            ref={idleVideoElRef}
            src={idleSrc}
            className="ai-avatar__video ai-avatar__video--idle is-active"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={() => {
              if (idleSrcResolved !== video.idle) {
                setIdleSrcResolved(video.idle);
              }
            }}
          />
        )}

        {/* Response lip-sync layer — always above idle when URL is set */}
        <video
          ref={setResponseRef}
          className={`ai-avatar__video ai-avatar__video--response${showResponse ? ' is-active' : ''}`}
          playsInline
          controls={false}
          preload="auto"
          style={
            showResponse
              ? { opacity: 1, zIndex: 5, visibility: 'visible' }
              : { opacity: 0, zIndex: 2, visibility: 'hidden' }
          }
        />

        {!hasVideoSurface && (
          <>
            <img
              src={imgSrc}
              alt={AVATAR.name}
              className="ai-avatar__image"
              draggable={false}
              onError={handleImageError}
            />

            {showVisemeOverlay ? (
              <div
                className="ai-avatar__mouth-clip ai-avatar__mouth-clip--viseme"
                style={{
                  left: `${m.left}%`,
                  top: `${m.top}%`,
                  width: `${m.width}%`,
                  height: `${m.height}%`,
                }}
              >
                <img
                  key={visemeSrc}
                  src={visemeSrc}
                  alt=""
                  className="ai-avatar__viseme-layer"
                  draggable={false}
                />
              </div>
            ) : (
              !isFullBody && (
                <div
                  className="ai-avatar__mouth-clip"
                  style={{
                    left: `${m.left}%`,
                    top: `${m.top}%`,
                    width: `${m.width}%`,
                    height: `${m.height}%`,
                  }}
                >
                  <img
                    src={imgSrc}
                    alt=""
                    className="ai-avatar__mouth-layer"
                    draggable={false}
                    onError={handleImageError}
                    style={{
                      width: `${(100 / m.width) * 100}%`,
                      height: `${(100 / m.height) * 100}%`,
                      left: `${(-m.left / m.width) * 100}%`,
                      top: `${(-m.top / m.height) * 100}%`,
                      transform: `scale(${mouth.scaleX}, ${mouth.scaleY})`,
                    }}
                  />
                </div>
              )
            )}
          </>
        )}

        {showResponse && (
          <>
            <div className="ai-avatar__speak-ring" aria-hidden="true" />
            <div className="ai-avatar__eq" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </>
        )}
      </div>

      <div className="ai-avatar__info">
        <div className="ai-avatar__name">{guideName || AVATAR.name}</div>
        <div className="ai-avatar__role">
          {destinationName ? `${destinationName} guide` : AVATAR.role}
        </div>
        <div className="ai-avatar__status">
          <span className={`ai-avatar__status-pill ${statusClass}`}>
            {showResponse && <span className="ai-chat__speaking-dot" />}
            {statusLabel}
          </span>
        </div>

        {showResponse && speechProgress?.chunkText && (
          <p className="ai-avatar__caption" aria-live="polite">
            {speechProgress.chunkText}
          </p>
        )}
      </div>
    </div>
  );
}
