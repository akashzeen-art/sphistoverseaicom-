export const AVATAR = {
  name: 'HistoVerse',
  role: 'Historical figure',
  image: '/images/albert_einstein.png',
  imageFullbody:
    import.meta.env.VITE_AVATAR_FULLBODY_IMAGE || '/images/albert_einstein.png',

  frame: {
    mode: import.meta.env.VITE_AVATAR_MODE || 'fullbody',
    aspectRatio: '16 / 9',
  },

  video: {
    idle: import.meta.env.VITE_AVATAR_IDLE_VIDEO || '/videos/idle.mp4',
    speak: null,
  },

  visemes: {
    closed: '/images/avatar/mouth-closed.png',
    half: '/images/avatar/mouth-half.png',
    open: '/images/avatar/mouth-open.png',
    wide: '/images/avatar/mouth-wide.png',
    smile: '/images/avatar/mouth-smile.png',
  },

  mouth: {
    left: 38.5,
    top: 54.5,
    width: 23,
    height: 9,
  },

  mouthFullbody: {
    left: 31,
    top: 8.5,
    width: 38,
    height: 14,
  },
};

export function getCharacterImage() {
  return AVATAR.frame.mode === 'fullbody' ? AVATAR.imageFullbody : AVATAR.image;
}

export function getPortraitFallbackImage() {
  return AVATAR.image;
}

export function getMouthRegion() {
  return AVATAR.frame.mode === 'fullbody' ? AVATAR.mouthFullbody : AVATAR.mouth;
}

export function visemeToImage(viseme) {
  const map = {
    closed: AVATAR.visemes.closed,
    rest: AVATAR.visemes.closed,
    open: AVATAR.visemes.open,
    wide: AVATAR.visemes.wide,
    smile: AVATAR.visemes.smile,
    narrow: AVATAR.visemes.half,
  };
  return map[viseme] || AVATAR.visemes.closed;
}

export const VISEMES = {
  closed: { scaleX: 1, scaleY: 0.35, label: 'M' },
  rest: { scaleX: 1, scaleY: 0.55, label: 'rest' },
  open: { scaleX: 1.05, scaleY: 1.15, label: 'AA' },
  wide: { scaleX: 1.2, scaleY: 1.45, label: 'O' },
  smile: { scaleX: 1.15, scaleY: 0.75, label: 'EE' },
  narrow: { scaleX: 0.85, scaleY: 1.05, label: 'U' },
};

export function charToViseme(char) {
  const c = (char || '').toLowerCase();
  if (!c || c === ' ') return 'rest';
  if ('mbpx'.includes(c)) return 'closed';
  if ('aáàâ'.includes(c)) return 'open';
  if ('oóòôuúù'.includes(c)) return 'wide';
  if ('eéèêiíì'.includes(c)) return 'smile';
  if ('fv'.includes(c)) return 'narrow';
  if ('w'.includes(c)) return 'wide';
  if ('tdkg'.includes(c)) return 'open';
  return 'rest';
}

export function lerpViseme(a, b, t) {
  return {
    scaleX: a.scaleX + (b.scaleX - a.scaleX) * t,
    scaleY: a.scaleY + (b.scaleY - a.scaleY) * t,
  };
}

export function visemeToTransform(name, openness = 1) {
  const v = VISEMES[name] || VISEMES.rest;
  const intensity = 0.4 + openness * 0.6;
  return {
    scaleX: 1 + (v.scaleX - 1) * intensity,
    scaleY: 0.4 + (v.scaleY - 0.4) * intensity,
  };
}
