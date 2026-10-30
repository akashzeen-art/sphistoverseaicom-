/**
 * Per-figure MuseTalk / TTS settings for HistoVerse Talk pages.
 * Voices are tts-1 only: male = onyx/echo, female = nova/shimmer.
 * (ash/sage/coral are gpt-4o-mini-tts voices and often fall back to female nova.)
 */

const FEMALE_SLUGS = new Set(['agatha-christie', 'serena-williams']);

const FIGURE_VOICE = {
  1: { voice: 'echo', accent: 'Elizabethan English, eloquent and dramatic' },
  2: { voice: 'nova', accent: 'British English, witty and observant' },
  5: { voice: 'echo', accent: 'British Victorian English, vivid storyteller' },
  7: { voice: 'onyx', accent: 'British English, resolute and witty' },
  9: { voice: 'onyx', accent: 'American English, measured and dignified' },
  10: { voice: 'echo', accent: 'South African English, calm and inspiring' },
  12: { voice: 'onyx', accent: 'American English, lively and bold' },
  13: { voice: 'onyx', accent: 'American English, confident and poetic' },
  14: { voice: 'echo', accent: 'Brazilian-accented English, joyful and proud' },
  15: { voice: 'shimmer', accent: 'American English, strong and focused' },
  17: { voice: 'echo', accent: 'Austrian-accented English, brilliant and lively' },
  19: { voice: 'echo', accent: 'American Southern English, charismatic and warm' },
  20: { voice: 'echo', accent: 'American English, energetic and creative' },
  23: { voice: 'onyx', accent: 'British English, precise and thoughtful' },
};

export const FIGURE_PROMPTS = [
  'Tell me about your early life',
  'What inspired your greatest work?',
  'Share a surprising fact about you',
];

function isFemaleProfile(profile) {
  if (FEMALE_SLUGS.has(profile?.avatarRegion)) return true;
  if (/\b(agatha|serena)\b/i.test(profile?.name || '')) return true;
  return false;
}

/**
 * @param {object} profile
 * @param {string|number} [id]
 */
export function resolveFigureVoice(profile, id) {
  const key = Number(id);
  const preset = FIGURE_VOICE[key] || null;
  const female = isFemaleProfile(profile);
  const voice = preset?.voice || (female ? 'nova' : 'onyx');
  const accent =
    preset?.accent ||
    (female
      ? 'Natural English, warm and clear'
      : 'Natural English, thoughtful and clear');

  const genderLine = female
    ? 'Speak as an adult woman in a natural female voice.'
    : 'Speak as an adult man in a natural male voice. Never sound female.';

  return {
    voice,
    forceFemale: female,
    speed: 1.08,
    instructions: [
      genderLine,
      accent,
      `Stay fully in character as ${profile.name}.`,
      'Pronounce clearly. Warm, expressive, and easy to understand.',
      'Do not rush; keep natural pacing with light emotion.',
    ].join(' '),
    speakLang: 'en-US',
  };
}

/**
 * @param {object} profile
 */
export function buildFigureSystemPrompt(profile) {
  const name = profile.name || 'Historical Figure';
  const job = profile.job || profile.category || 'historical figure';
  const short = profile.shortName || name.split(' ')[0];
  const category = profile.category || 'history';
  const female = isFemaleProfile(profile);
  const genderLine = female
    ? 'You are a woman. Speak in a female first-person voice.'
    : 'You are a man. Speak in a male first-person voice.';

  return [
    `You are ${name}, speaking out loud in first person as yourself on HistoVerse AI.`,
    genderLine,
    `Your role or field: ${job}. Category: ${category}.`,
    `Users know you as ${short}. Stay fully in character for your known life, era, work, personality, and speaking style.`,
    'Answer with vivid, specific, historically grounded detail from your own life and work.',
    'If asked about modern unrelated topics, briefly redirect to your world with wit.',
    'Write only complete spoken sentences that are easy to hear: everyday words, no markdown, lists, or emoji.',
    'End every sentence with . ! or ?',
    'Start with one short hook sentence of about 6 to 12 words.',
    'Then add 2 to 4 more short spoken sentences with concrete names, places, feelings, or turning points.',
    'Sound personal and memorable, not generic. Never break character or mention being an AI.',
  ].join(' ');
}

/**
 * @param {object} profile
 */
export function buildFigureGreeting(profile) {
  const name = profile.name || 'a friend from history';
  return `Good day! I am ${name}. Tell me, what would you like to discover about my life?`;
}

/**
 * @param {object} profile
 */
export function resolveFigureIdleVideo(profile) {
  if (profile?.idleVideo) return profile.idleVideo;
  return '/videos/idle.mp4';
}
