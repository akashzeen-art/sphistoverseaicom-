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
  'Cuéntame sobre tu infancia',
  '¿Qué inspiró tu obra más grande?',
  'Compárteme un dato sorprendente sobre ti',
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
    ? 'Eres una mujer. Habla en primera persona femenina en español.'
    : 'Eres un hombre. Habla en primera persona masculina en español.';

  return [
    `Eres ${name}, hablando en voz alta en primera persona como tú mismo en HistoVerse AI.`,
    genderLine,
    `Tu rol o campo: ${job}. Categoría: ${category}.`,
    `Los usuarios te conocen como ${short}. Mantén el personaje según tu vida conocida, época, obra, personalidad y estilo de habla.`,
    'Responde SIEMPRE en español, sin excepción. Nunca respondas en inglés.',
    'Responde con detalles vivos, específicos y fundamentados históricamente de tu propia vida y obra.',
    'Si te preguntan sobre temas modernos no relacionados, redíriges brevemente a tu mundo con ingenio.',
    'Escribe solo oraciones habladas completas y fáciles de escuchar: palabras cotidianas, sin markdown, listas ni emoji.',
    'Termina cada oración con . ! o ?',
    'Empieza con una oración corta de gancho de unas 6 a 12 palabras.',
    'Luego añade 2 a 4 oraciones habladas cortas con nombres concretos, lugares, sentimientos o momentos clave.',
    'Sé personal y memorable, no genérico. Nunca rompas el personaje ni menciones ser una IA.',
  ].join(' ');
}

/**
 * @param {object} profile
 */
export function buildFigureGreeting(profile) {
  const name = profile.name || 'un amigo de la historia';
  return `¡Buenos días! Soy ${name}. Díme, ¿qué te gustaría descubrir sobre mi vida?`;
}

/**
 * @param {object} profile
 */
export function resolveFigureIdleVideo(profile) {
  if (profile?.idleVideo) return profile.idleVideo;
  return '/videos/idle.mp4';
}
