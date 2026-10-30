import {
  API_BASE_URL,
  PROJECT_API_KEY,
  PROJECT_ID,
  OPENAI_API_KEY,
} from '../config/sharedApi';

const CHUNK_TIMEOUT_MS = 1_800_000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isWaitMediaRetryable(status, message = '') {
  return (
    status === 409 ||
    /preparing|not found|timed out/i.test(message)
  );
}

function projectHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'X-Project-Id': PROJECT_ID,
    ...(PROJECT_API_KEY ? { 'X-Api-Key': PROJECT_API_KEY } : {}),
    ...(OPENAI_API_KEY ? { 'X-Openai-Key': OPENAI_API_KEY } : {}),
    ...extra,
  };
}

async function parseJson(response, fallback) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // ignore
  }
  if (!response.ok) {
    throw new Error(payload?.message || fallback || `Request failed (${response.status})`);
  }
  if (!payload?.success || payload.data === undefined) {
    throw new Error(payload?.message || fallback || 'Invalid API response');
  }
  return payload.data;
}

export const avatarChatApi = {
  async sendMessage({ message, sessionId, guideContext, idleLoopPhase, ttsVoice, ttsInstructions, ttsSpeed, ttsForceFemale, avatarRegion }) {
    const body = { message };
    if (sessionId) body.sessionId = sessionId;
    if (guideContext) body.guideContext = guideContext;
    if (ttsVoice) body.ttsVoice = ttsVoice;
    if (ttsInstructions) body.ttsInstructions = ttsInstructions;
    if (ttsSpeed !== undefined && ttsSpeed !== null) body.ttsSpeed = ttsSpeed;
    if (ttsForceFemale !== undefined && ttsForceFemale !== null) {
      body.ttsForceFemale = Boolean(ttsForceFemale);
    }
    if (avatarRegion) body.avatarRegion = avatarRegion;
    if (idleLoopPhase !== undefined && idleLoopPhase !== null) {
      body.idleLoopPhase = idleLoopPhase;
    }
    if (OPENAI_API_KEY) body.openaiApiKey = OPENAI_API_KEY;

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: projectHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CHUNK_TIMEOUT_MS),
    });
    return parseJson(response, 'Failed to send message');
  },

  async waitMedia({ replyId, sessionId, idleLoopPhase, chunkIndex }, { retries = 24, retryMs = 35 } = {}) {
    const body = { replyId, sessionId };
    if (idleLoopPhase !== undefined && idleLoopPhase !== null) {
      body.idleLoopPhase = idleLoopPhase;
    }
    if (chunkIndex !== undefined && chunkIndex !== null) {
      body.chunkIndex = chunkIndex;
    }

    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const response = await fetch(`${API_BASE_URL}/chat/wait-media`, {
        method: 'POST',
        headers: projectHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(CHUNK_TIMEOUT_MS),
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        // ignore
      }

      if (response.ok && payload?.success && payload.data !== undefined) {
        return payload.data;
      }

      const message = payload?.message || 'Failed to load speech media';
      lastError = new Error(message);
      if (!isWaitMediaRetryable(response.status, message) || attempt >= retries) {
        throw lastError;
      }
      await sleep(retryMs + attempt * 12);
    }

    throw lastError || new Error('Failed to load speech media');
  },

  resolveMediaUrl(pathOrUrl) {
    if (!pathOrUrl) return null;
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const base = API_BASE_URL.replace(/\/$/, '');
    return `${base}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
  },

  async nextChunk({ replyId, sessionId, idleLoopPhase }) {
    const body = { replyId, sessionId };
    if (idleLoopPhase !== undefined && idleLoopPhase !== null) {
      body.idleLoopPhase = idleLoopPhase;
    }
    const response = await fetch(`${API_BASE_URL}/chat/next-chunk`, {
      method: 'POST',
      headers: projectHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CHUNK_TIMEOUT_MS),
    });
    const data = await parseJson(response, 'Failed to load next chunk');
    if (data?.exhausted) {
      return { ...data, hasMore: false, exhausted: true };
    }
    if (
      data?.hasMore === false &&
      !data?.videoUrl &&
      !data?.videoJobId &&
      !data?.audioUrl &&
      !data?.audioBase64
    ) {
      return { ...data, hasMore: false, exhausted: true };
    }
    return data;
  },

  async pollUntilComplete(jobId, { intervalMs = 20, timeoutMs = 180_000 } = {}) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const response = await fetch(`${API_BASE_URL}/avatar-video/status/${jobId}`, {
        headers: projectHeaders(),
      });
      const status = await parseJson(response, 'Failed to poll avatar video');
      if (status.status === 'completed' || status.downloadReady) return status;
      if (status.status === 'failed') {
        throw new Error(status.error || status.message || 'Avatar video failed');
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error('Avatar video timed out');
  },

  getDownloadUrl(jobId) {
    const base = API_BASE_URL.replace(/\/$/, '');
    const params = new URLSearchParams({ projectId: PROJECT_ID });
    if (PROJECT_API_KEY) params.set('apiKey', PROJECT_API_KEY);
    return `${base}/avatar-video/download/${jobId}?${params}`;
  },
};
