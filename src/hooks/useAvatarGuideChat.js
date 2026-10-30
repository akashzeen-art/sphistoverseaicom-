import { useCallback, useEffect, useRef, useState } from 'react';
import { avatarChatApi } from '../services/avatarChatApi';
import { runTypewriter } from '../utils/typewriter';

let messageId = 0;
function nextId() {
  messageId += 1;
  return `msg-${messageId}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeSpeech(text) {
  return String(text || '')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isDuplicateSpeech(nextText, alreadySpoken) {
  const next = normalizeSpeech(nextText);
  const spoken = normalizeSpeech(alreadySpoken);
  if (!next || !spoken) return false;
  if (next === spoken) return true;
  if (spoken.startsWith(next) && next.length / spoken.length >= 0.72) return true;
  if (next.startsWith(spoken) && spoken.length / next.length >= 0.72) return true;
  return false;
}

/**
 * Guide chat via shared backend + MuseTalk lip-sync video.
 * First cut starts ASAP; while it plays, the next cut is fetched + polled in parallel.
 * @param {string} guideContext - destination-specific system context
 * @param {{ voice?: string, instructions?: string, avatarRegion?: string, speed?: number }} [voiceOptions]
 */
export function useAvatarGuideChat(guideContext, voiceOptions = {}) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [responseVideoUrl, setResponseVideoUrl] = useState(null);
  const [responseVideoMuted, setResponseVideoMuted] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState('idle'); // idle | thinking | speaking

  const sessionIdRef = useRef(null);
  const seqRef = useRef(0);
  const videoRef = useRef(null);
  const assistantBubbleIdRef = useRef(null);
  const mediaPrewarmRef = useRef(null);
  const videoPollRef = useRef(new Map());
  const speechAudioRef = useRef(null);
  const objectUrlsRef = useRef([]);

  const resetChat = useCallback((greeting) => {
    seqRef.current += 1;
    setIsLoading(false);
    setIsTyping(false);
    setIsSpeaking(false);
    setError(null);
    setResponseVideoUrl(null);
    setResponseVideoMuted(false);
    setAvatarStatus('idle');
    sessionIdRef.current = null;
    assistantBubbleIdRef.current = null;
    mediaPrewarmRef.current = null;
    videoPollRef.current.clear();
    if (speechAudioRef.current) {
      speechAudioRef.current.pause();
      speechAudioRef.current = null;
    }
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
    setMessages(
      greeting ? [{ id: nextId(), role: 'assistant', content: greeting }] : [],
    );
  }, []);

  const revealTypewriterText = useCallback(async (text, { append = false, sequenceId, instant = false }) => {
    let chunk = (text || '').trim();
    const bubbleId = assistantBubbleIdRef.current;
    if (!chunk || !bubbleId || sequenceId !== seqRef.current) return false;

    let baseContent = '';
    setMessages((prev) => {
      const current = prev.find((m) => m.id === bubbleId);
      baseContent = append && current?.content ? current.content.trim() : '';
      return prev.map((m) =>
        m.id === bubbleId
          ? { ...m, content: baseContent, _pending: false, _typing: true }
          : m,
      );
    });

    if (append && baseContent) {
      const normBase = normalizeSpeech(baseContent);
      const normChunk = normalizeSpeech(chunk);
      if (!normChunk || normBase === normChunk) return true;
      if (normBase.includes(normChunk)) return true;
      const rawBase = baseContent.trim();
      const rawChunk = chunk.trim();
      if (
        rawBase &&
        rawChunk.toLowerCase().startsWith(rawBase.toLowerCase()) &&
        rawChunk.length > rawBase.length
      ) {
        const suffix = rawChunk.slice(rawBase.length).trim();
        if (!suffix) return true;
        chunk = suffix;
      }
    }

    if (append && baseContent && (baseContent.includes(chunk) || baseContent.endsWith(chunk))) {
      return true;
    }

    const spacer = baseContent ? ' ' : '';
    const showInstant = instant || (!append && chunk.length <= 96);

    if (showInstant) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === bubbleId
            ? {
                ...m,
                content: `${baseContent}${spacer}${chunk}`.trim(),
                _typing: false,
                _pending: false,
              }
            : m,
        ),
      );
      setIsTyping(false);
      return true;
    }

    setIsTyping(true);

    const ok = await runTypewriter(chunk, {
      shouldContinue: () => sequenceId === seqRef.current,
      onUpdate: (partial, done) => {
        const gap = baseContent && partial ? ' ' : '';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === bubbleId
              ? {
                  ...m,
                  content: `${baseContent}${gap}${partial}`,
                  _typing: !done,
                  _pending: false,
                }
              : m,
          ),
        );
      },
    });

    setIsTyping(false);

    if (!ok || sequenceId !== seqRef.current) return false;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === bubbleId
          ? {
              ...m,
              content: `${baseContent}${spacer}${chunk}`.trim(),
              _typing: false,
              _pending: false,
            }
          : m,
      ),
    );
    return true;
  }, []);

  const playVideoUrl = useCallback(async (url, videoEl, options = {}) => {
    if (!url || !videoEl) return false;
    const {
      muted = false,
      startAt = 0,
      keepSpeechAudio = false,
      awaitEnd = true,
    } = options;
    const absoluteUrl = /^https?:\/\//i.test(url)
      ? url
      : new URL(url, window.location.origin).href;

    // Stop TTS unless this is a muted lip-sync handoff (TTS stays the sound track).
    if (!keepSpeechAudio && speechAudioRef.current) {
      try {
        speechAudioRef.current.pause();
        speechAudioRef.current.src = '';
      } catch {
        // ignore
      }
      speechAudioRef.current = null;
    }

    setResponseVideoMuted(Boolean(muted));
    setResponseVideoUrl(absoluteUrl);
    setIsSpeaking(true);
    setAvatarStatus('speaking');

    // Let React mount/bind the response layer before driving the element.
    await sleep(30);
    const el = videoRef.current || videoEl;
    if (!el) return false;

    if (!awaitEnd) {
      let played = false;
      const tryPlay = () => {
        el.muted = Boolean(muted);
        el.defaultMuted = Boolean(muted);
        el.playsInline = true;
        if (startAt > 0.12) {
          try {
            if (Number.isFinite(el.duration) && startAt < el.duration) {
              el.currentTime = startAt;
            }
          } catch {
            // ignore
          }
        }
        const playPromise = el.play();
        if (playPromise?.catch) playPromise.catch(() => {});
        played = true;
      };
      const onLoaded = () => tryPlay();
      el.addEventListener('loadeddata', onLoaded, { once: true });
      el.addEventListener('canplay', onLoaded, { once: true });
      el.playsInline = true;
      el.preload = 'auto';
      el.muted = Boolean(muted);
      el.defaultMuted = Boolean(muted);
      const current = el.currentSrc || el.src || '';
      if (current !== absoluteUrl) {
        el.src = absoluteUrl;
        el.load();
      }
      if (el.readyState >= 2) tryPlay();
      return played;
    }

    await new Promise((resolve, reject) => {
      let settled = false;
      const finish = (fn) => (event) => {
        if (settled) return;
        settled = true;
        cleanup();
        fn(event);
      };
      const onEnded = finish(() => resolve());
      const onError = finish(() =>
        reject(new Error('Avatar video playback failed')),
      );
      const tryPlay = () => {
        el.muted = Boolean(muted);
        el.defaultMuted = Boolean(muted);
        el.playsInline = true;
        if (startAt > 0.12) {
          try {
            if (Number.isFinite(el.duration) && startAt < el.duration) {
              el.currentTime = startAt;
            }
          } catch {
            // ignore seek errors
          }
        }
        const playPromise = el.play();
        if (playPromise?.catch) {
          playPromise.catch(() => {
            requestAnimationFrame(() => {
              el.play().catch(onError);
            });
          });
        }
      };
      const cleanup = () => {
        el.removeEventListener('ended', onEnded);
        el.removeEventListener('error', onError);
        el.removeEventListener('loadeddata', onLoaded);
        el.removeEventListener('canplay', onLoaded);
        el.removeEventListener('loadedmetadata', onMeta);
      };
      const onLoaded = () => {
        tryPlay();
      };
      const onMeta = () => {
        if (startAt > 0.12) {
          try {
            el.currentTime = startAt;
          } catch {
            // ignore
          }
        }
      };

      el.addEventListener('ended', onEnded);
      el.addEventListener('error', onError);
      el.addEventListener('loadeddata', onLoaded, { once: true });
      el.addEventListener('canplay', onLoaded, { once: true });
      el.addEventListener('loadedmetadata', onMeta, { once: true });
      el.playsInline = true;
      el.preload = 'auto';
      el.muted = Boolean(muted);
      el.defaultMuted = Boolean(muted);

      const current = el.currentSrc || el.src || '';
      if (current !== absoluteUrl) {
        el.src = absoluteUrl;
        el.load();
      }
      if (el.readyState >= 2) {
        tryPlay();
      }
    });
    return true;
  }, []);

  const waitForVideoElement = useCallback(async (timeoutMs = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (videoRef.current) return videoRef.current;
      await sleep(50);
    }
    return videoRef.current;
  }, []);

  const startVideoPoll = useCallback((jobId, sequenceId) => {
    if (!jobId || sequenceId !== seqRef.current) return null;
    const existing = videoPollRef.current.get(jobId);
    if (existing) return existing;

    const pollPromise = avatarChatApi
      .pollUntilComplete(jobId, {
        intervalMs: 35,
        timeoutMs: 300_000,
      })
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        videoPollRef.current.delete(jobId);
      });

    videoPollRef.current.set(jobId, pollPromise);
    return pollPromise;
  }, []);

  const srcFromMedia = useCallback((media) => {
    if (media?.audioBase64) {
      const binary = Uint8Array.from(atob(media.audioBase64), (c) =>
        c.charCodeAt(0),
      );
      const url = URL.createObjectURL(
        new Blob([binary], { type: media.audioMime || 'audio/mpeg' }),
      );
      objectUrlsRef.current.push(url);
      return url;
    }
    return avatarChatApi.resolveMediaUrl(media?.audioUrl);
  }, []);

  /**
   * Text is shown first by the caller. Wait for MuseTalk, then play
   * lip-sync video from the start (audio + lips together, no mid-speech join).
   */
  const playAudioWithLipSync = useCallback(
    async (media, sequenceId) => {
      if (!media || sequenceId !== seqRef.current) return;

      const resolvePlayUrl = (jobOrUrl) => {
        if (!jobOrUrl) return null;
        if (typeof jobOrUrl === 'string' && jobOrUrl.includes('/')) {
          return jobOrUrl;
        }
        return avatarChatApi.getDownloadUrl(jobOrUrl);
      };

      const playLipsyncFromStart = async (jobOrUrl) => {
        const playUrl = resolvePlayUrl(jobOrUrl);
        if (!playUrl) return false;
        setResponseVideoMuted(false);
        setResponseVideoUrl(
          /^https?:\/\//i.test(playUrl)
            ? playUrl
            : new URL(playUrl, window.location.origin).href,
        );
        await sleep(35);
        const videoEl = await waitForVideoElement();
        if (!videoEl) return false;
        await playVideoUrl(playUrl, videoEl, {
          muted: false,
          startAt: 0,
          awaitEnd: true,
        });
        return true;
      };

      if (
        (media.mediaPending ||
          (!media.videoJobId &&
            !media.videoUrl &&
            !media.lipsyncReady &&
            !media.audioUrl &&
            !media.audioBase64)) &&
        media.replyId &&
        sessionIdRef.current
      ) {
        try {
          const latest = await avatarChatApi.waitMedia({
            replyId: media.replyId,
            sessionId: sessionIdRef.current,
            chunkIndex: media.chunkIndex ?? 0,
          });
          media = { ...media, ...latest, mediaPending: false };
        } catch {
          // continue
        }
      }

      if (sequenceId !== seqRef.current) return;

      setIsSpeaking(true);
      setAvatarStatus('thinking');

      if (speechAudioRef.current) {
        try {
          speechAudioRef.current.pause();
          speechAudioRef.current.src = '';
        } catch {
          // ignore
        }
        speechAudioRef.current = null;
      }

      const lipRef = {
        jobId: media.videoJobId || null,
        videoUrl: media.videoUrl || null,
      };

      if (lipRef.jobId && !media.lipsyncReady) {
        startVideoPoll(lipRef.jobId, sequenceId);
      }

      let ready = Boolean(media.lipsyncReady && (lipRef.jobId || lipRef.videoUrl));
      const deadline = Date.now() + 90_000;

      while (!ready && Date.now() < deadline && sequenceId === seqRef.current) {
        if (lipRef.jobId) {
          ready =
            (await (videoPollRef.current.get(lipRef.jobId) ||
              startVideoPoll(lipRef.jobId, sequenceId))) === true;
          if (ready) break;
        }
        if (!media.replyId || !sessionIdRef.current) break;
        await sleep(60);
        try {
          const latest = await avatarChatApi.waitMedia({
            replyId: media.replyId,
            sessionId: sessionIdRef.current,
            chunkIndex: media.chunkIndex ?? 0,
          });
          lipRef.jobId = latest.videoJobId || lipRef.jobId;
          if (latest.videoUrl) lipRef.videoUrl = latest.videoUrl;
          if (latest.lipsyncReady && (lipRef.jobId || lipRef.videoUrl)) {
            ready = true;
            break;
          }
          if (lipRef.jobId) {
            ready =
              (await (videoPollRef.current.get(lipRef.jobId) ||
                startVideoPoll(lipRef.jobId, sequenceId))) === true;
            if (ready) break;
          }
        } catch {
          // keep waiting
        }
      }

      if (sequenceId !== seqRef.current) return;

      if (ready && (lipRef.jobId || lipRef.videoUrl)) {
        const ok = await playLipsyncFromStart(lipRef.jobId || lipRef.videoUrl);
        if (ok) return;
      }

      // Fallback only if MuseTalk failed — audio without lips.
      const audioSrc = srcFromMedia(media);
      if (!audioSrc) {
        setIsSpeaking(false);
        setAvatarStatus('idle');
        setResponseVideoUrl(null);
        return;
      }
      setAvatarStatus('speaking');
      const audio = new Audio(audioSrc);
      audio.preload = 'auto';
      speechAudioRef.current = audio;
      await new Promise((resolve) => {
        const finish = () => {
          audio.removeEventListener('ended', finish);
          audio.removeEventListener('error', finish);
          resolve();
        };
        audio.addEventListener('ended', finish);
        audio.addEventListener('error', finish);
        audio.play().catch(finish);
      });
      if (speechAudioRef.current === audio) speechAudioRef.current = null;
    },
    [playVideoUrl, srcFromMedia, startVideoPoll, waitForVideoElement],
  );

  const applyMediaMeta = useCallback((current, media) => {
    if (!media) return current;
    return {
      ...current,
      ...media,
      mediaPending: false,
      content: media.speechText || media.content || current.content,
      replyId: media.replyId || current.replyId || null,
      chunkIndex: media.chunkIndex ?? current.chunkIndex ?? 0,
      hasMore: Boolean(media.hasMore),
    };
  }, []);

  const beginMediaPrewarm = useCallback(
    (result, sequenceId) => {
      if (!result.mediaPending || !result.replyId || !result.sessionId) {
        if (result.videoJobId && !result.lipsyncReady) {
          startVideoPoll(result.videoJobId, sequenceId);
        }
        return null;
      }

      const kickPoll = (media) => {
        if (sequenceId !== seqRef.current) return;
        if (media?.videoJobId && !media.lipsyncReady) {
          startVideoPoll(media.videoJobId, sequenceId);
        }
      };

      const promise = avatarChatApi
        .waitMedia({
          replyId: result.replyId,
          sessionId: result.sessionId,
          chunkIndex: result.chunkIndex ?? 0,
        })
        .then((media) => {
          kickPoll(media);
          // If job id not yet attached, poll wait-media briefly in background.
          if (!media?.videoJobId && media?.audioUrl) {
            (async () => {
              for (let i = 0; i < 40 && sequenceId === seqRef.current; i++) {
                await sleep(150);
                try {
                  const latest = await avatarChatApi.waitMedia({
                    replyId: result.replyId,
                    sessionId: result.sessionId,
                    chunkIndex: result.chunkIndex ?? 0,
                  });
                  if (latest?.videoJobId) {
                    kickPoll(latest);
                    break;
                  }
                } catch {
                  break;
                }
              }
            })();
          }
          return media;
        })
        .catch((err) => {
          mediaPrewarmRef.current = null;
          throw err;
        });

      mediaPrewarmRef.current = promise;
      return promise;
    },
    [startVideoPoll],
  );

  const waitForChunkMedia = useCallback(async (chunk, sequenceId) => {
    if (chunk._prewarmPromise) {
      return chunk._prewarmPromise;
    }
    if (!chunk.mediaPending || !chunk.replyId || !sessionIdRef.current) {
      return null;
    }
    return avatarChatApi.waitMedia({
      replyId: chunk.replyId,
      sessionId: sessionIdRef.current,
      chunkIndex: chunk.chunkIndex ?? 0,
    });
  }, []);

  const prepareChunkMedia = useCallback(
    async (chunk, sequenceId, { waitForLipsync = true } = {}) => {
      let current = { ...chunk };

      if (current.mediaPending) {
        const media = await waitForChunkMedia(current, sequenceId);
        if (!media || sequenceId !== seqRef.current) return null;
        current = applyMediaMeta(current, media);
      }

      if (waitForLipsync) {
        const jobDeadline = Date.now() + 30_000;
        while (
          !current.videoJobId &&
          !current.videoUrl &&
          Date.now() < jobDeadline &&
          sequenceId === seqRef.current &&
          current.replyId &&
          sessionIdRef.current
        ) {
          await sleep(80);
          try {
            const media = await avatarChatApi.waitMedia({
              replyId: current.replyId,
              sessionId: sessionIdRef.current,
              chunkIndex: current.chunkIndex ?? 0,
            });
            current = applyMediaMeta(current, media);
          } catch {
            // keep waiting for MuseTalk job id
          }
        }
      }

      if (waitForLipsync && current.videoJobId && !current.lipsyncReady) {
        const pollPromise =
          videoPollRef.current.get(current.videoJobId) ||
          startVideoPoll(current.videoJobId, sequenceId);
        if (pollPromise) {
          const ok = await pollPromise;
          if (!ok || sequenceId !== seqRef.current) return null;
        }
        current = { ...current, lipsyncReady: true, lipsyncPending: false };
      } else if (
        !waitForLipsync &&
        current.videoJobId &&
        !current.lipsyncReady
      ) {
        startVideoPoll(current.videoJobId, sequenceId);
      }

      return current;
    },
    [applyMediaMeta, startVideoPoll, waitForChunkMedia],
  );

  const fetchNextPrepared = useCallback(
    async (replyId, sequenceId) => {
      if (!replyId || !sessionIdRef.current) return null;
      const next = await avatarChatApi.nextChunk({
        replyId,
        sessionId: sessionIdRef.current,
      });
      if (sequenceId !== seqRef.current) return null;
      if (next?.exhausted) return { exhausted: true };
      const hasAudio = Boolean(next?.audioUrl || next?.audioBase64);
      const hasVideo = Boolean(next?.videoJobId || next?.videoUrl);
      if (!next || (!hasAudio && !hasVideo && !next.message?.content)) {
        return { exhausted: true };
      }
      return prepareChunkMedia(
        {
          content: next.message?.content || next.content || '',
          audioUrl: next.audioUrl,
          audioBase64: next.audioBase64,
          audioMime: next.audioMime,
          videoUrl: next.videoUrl,
          videoJobId: next.videoJobId,
          lipsyncPending: Boolean(next.lipsyncPending),
          lipsyncReady: Boolean(next.lipsyncReady),
          replyId: next.replyId || replyId,
          chunkIndex: next.chunkIndex ?? 0,
          hasMore: Boolean(next.hasMore),
          mediaPending: false,
        },
        sequenceId,
        { waitForLipsync: true },
      );
    },
    [prepareChunkMedia],
  );

  const resolveAndPlayChunk = useCallback(
    async (chunk, sequenceId) => {
      let current = { ...chunk };
      let nextPreparedPromise = null;
      let isFirstCut = true;
      let lastSpoken = '';
      let typeChain = Promise.resolve();

      const queueType = (chunkText, append, instant = false) => {
        if (!chunkText) return typeChain;
        typeChain = typeChain.then(() =>
          revealTypewriterText(chunkText, { append, sequenceId, instant }),
        );
        return typeChain;
      };

      const kickNext = () => {
        if (current.hasMore && current.replyId && !nextPreparedPromise) {
          nextPreparedPromise = fetchNextPrepared(current.replyId, sequenceId);
        }
      };

      /** Return to idle loop while the next lip-sync cut is prepared. */
      const showIdleWhileWaiting = (waitingForMore) => {
        setResponseVideoUrl(null);
        setResponseVideoMuted(false);
        setIsSpeaking(false);
        setAvatarStatus(waitingForMore ? 'thinking' : 'idle');
      };

      while (current && sequenceId === seqRef.current) {
        const text =
          current.content ||
          current.message?.content ||
          current.speechText ||
          '';

        if (
          !current.videoJobId &&
          !current.videoUrl &&
          !current.audioUrl &&
          !current.audioBase64 &&
          current.mediaPending
        ) {
          // Text-only early return — still type while first TTS is built.
        } else if (
          !current.videoJobId &&
          !current.videoUrl &&
          !current.audioUrl &&
          !current.audioBase64 &&
          !text
        ) {
          break;
        }

        // Prefetch next cut while this one types + prepares.
        kickNext();

        const openingCut = isFirstCut;
        // Wait for MuseTalk so lips + voice start together from 0.
        const mediaPromise = prepareChunkMedia(current, sequenceId, {
          waitForLipsync: true,
        });
        const openerText = text.trim();

        // 1) Text first (opener is already in the bubble from sendMessage)
        if (openerText && !isDuplicateSpeech(openerText, lastSpoken)) {
          if (!openingCut) {
            queueType(openerText, true);
          }
        }

        setAvatarStatus('thinking');
        const prepared = await mediaPromise;
        isFirstCut = false;
        if (!prepared || sequenceId !== seqRef.current) return;

        current = prepared;

        const fullSpeech = (
          prepared.speechText ||
          prepared.content ||
          openerText
        ).trim();

        // Opening cut text is already in the bubble from /chat — only append follow-ups.
        if (
          !openingCut &&
          fullSpeech &&
          !isDuplicateSpeech(fullSpeech, lastSpoken)
        ) {
          queueType(fullSpeech, true);
        }

        if (fullSpeech && isDuplicateSpeech(fullSpeech, lastSpoken)) {
          const hasMoreDup = Boolean(current.hasMore && current.replyId);
          if (!hasMoreDup) break;
          kickNext();
          const nextDup =
            (await nextPreparedPromise) ||
            (await fetchNextPrepared(current.replyId, sequenceId));
          nextPreparedPromise = null;
          if (!nextDup || nextDup.exhausted) break;
          current = nextDup;
          continue;
        }

        if (fullSpeech) lastSpoken = fullSpeech;

        if (sequenceId !== seqRef.current) return;

        const canPlay = Boolean(
          current.audioUrl ||
            current.audioBase64 ||
            current.videoJobId ||
            current.videoUrl,
        );
        if (!canPlay) break;

        kickNext();
        // Lip-sync video from the start (muxed audio + mouth)
        await playAudioWithLipSync(current, sequenceId);
        if (sequenceId !== seqRef.current) return;

        const hasMore = Boolean(current.hasMore && current.replyId);
        showIdleWhileWaiting(hasMore);

        if (!hasMore) break;
        if (sequenceId !== seqRef.current) return;

        const next =
          (await nextPreparedPromise) ||
          (await fetchNextPrepared(current.replyId, sequenceId));
        nextPreparedPromise = null;
        if (sequenceId !== seqRef.current) return;
        if (!next || next.exhausted) break;

        current = next;
      }

      setAvatarStatus('idle');
      setIsSpeaking(false);
      setIsTyping(false);
      setResponseVideoUrl(null);
      setResponseVideoMuted(false);
    },
    [
      fetchNextPrepared,
      playAudioWithLipSync,
      prepareChunkMedia,
      revealTypewriterText,
    ],
  );

  const sendMessage = useCallback(
    async (content) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      const sequenceId = ++seqRef.current;
      setError(null);
      setIsLoading(true);
      setAvatarStatus('thinking');
      assistantBubbleIdRef.current = null;

      const userMessage = { id: nextId(), role: 'user', content: trimmed };
      const assistantPlaceholder = {
        id: nextId(),
        role: 'assistant',
        content: '',
        _pending: true,
      };
      assistantBubbleIdRef.current = assistantPlaceholder.id;
      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);

      try {
        const result = await avatarChatApi.sendMessage({
          message: trimmed,
          sessionId: sessionIdRef.current,
          guideContext,
          ttsVoice: voiceOptions.voice,
          ttsInstructions: voiceOptions.instructions,
          ttsSpeed: voiceOptions.speed,
          ttsForceFemale: voiceOptions.forceFemale === true,
          avatarRegion: voiceOptions.avatarRegion,
        });
        if (sequenceId !== seqRef.current) return;

        sessionIdRef.current = result.sessionId;

        const firstText = result.message?.content || result.fullText || '';
        setIsLoading(false);
        if (firstText && assistantBubbleIdRef.current) {
          const bubbleId = assistantBubbleIdRef.current;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === bubbleId
                ? { ...m, content: firstText, _pending: false, _typing: false }
                : m,
            ),
          );
        }

        const prewarmPromise = beginMediaPrewarm(result, sequenceId);

        await resolveAndPlayChunk(
          {
            content: firstText,
            videoUrl: result.videoUrl,
            videoJobId: result.videoJobId,
            lipsyncPending: Boolean(result.lipsyncPending),
            lipsyncReady: Boolean(result.lipsyncReady),
            mediaPending: Boolean(result.mediaPending),
            replyId: result.replyId,
            chunkIndex: result.chunkIndex ?? 0,
            hasMore: Boolean(result.hasMore),
            _prewarmPromise: prewarmPromise,
          },
          sequenceId,
        );
        mediaPrewarmRef.current = null;
        speechAudioRef.current = null;
      } catch (err) {
        if (sequenceId !== seqRef.current) return;
        setError(err.message || 'Failed to reach AI guide');
        setMessages((prev) => prev.filter((m) => !m._pending));
        setIsLoading(false);
        setIsTyping(false);
        setAvatarStatus('idle');
        assistantBubbleIdRef.current = null;
      }
    },
    [
      guideContext,
      isLoading,
      resolveAndPlayChunk,
      beginMediaPrewarm,
      voiceOptions.avatarRegion,
      voiceOptions.instructions,
      voiceOptions.speed,
      voiceOptions.voice,
    ],
  );

  useEffect(() => {
    seqRef.current += 1;
  }, [guideContext]);

  return {
    messages,
    isLoading,
    isTyping,
    isSpeaking,
    error,
    sendMessage,
    resetChat,
    responseVideoUrl,
    responseVideoMuted,
    avatarStatus,
    videoRef,
    setError,
  };
}
