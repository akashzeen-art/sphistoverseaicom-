function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Pace typewriter — snappy so the first reply feels immediate. */
export function computeTypewriterTiming(textLength) {
  const len = Math.max(1, textLength);
  const targetMs = Math.min(1800, Math.max(280, len * 14));
  const batch = len > 48 ? 3 : 2;
  const steps = Math.ceil(len / batch);
  return { batch, tickMs: Math.max(8, Math.floor(targetMs / steps)) };
}

/**
 * Reveal text character-by-character.
 * @param {string} text
 * @param {{ onUpdate: (partial: string, done: boolean) => void, shouldContinue?: () => boolean, batch?: number, tickMs?: number }} options
 */
export async function runTypewriter(text, options) {
  const full = (text || '').trim();
  if (!full) {
    options.onUpdate('', true);
    return true;
  }

  const timing =
    options.batch && options.tickMs
      ? { batch: options.batch, tickMs: options.tickMs }
      : computeTypewriterTiming(full.length);

  for (let i = 0; i < full.length; i += timing.batch) {
    if (options.shouldContinue && !options.shouldContinue()) return false;
    const end = Math.min(i + timing.batch, full.length);
    const partial = full.slice(0, end);
    const done = end >= full.length;
    options.onUpdate(partial, done);
    if (!done) await sleep(timing.tickMs);
  }
  return true;
}
