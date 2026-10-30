/**
 * HistoVerse characters with avatar video + portrait assets only.
 * Image: /images/figures/{id}.png
 * Video: /videos/avatars/{slug}-idle.mp4
 */

export const FIGURE_CATEGORIES = [
  'Authors',
  'Politics',
  'Sports',
  'Music',
  'Education',
];

function figureImage(id) {
  return `/images/figures/${id}.png`;
}

/** @type {Array<{ id: number, slug: string, name: string, job: string, category: string, shortName: string, image: string, idleVideo: string, avatarRegion: string }>} */
export const HISTORY_FIGURES = [
  // Authors
  {
    id: 1,
    slug: 'william-shakespeare',
    name: 'William Shakespeare',
    job: 'Playwright',
    category: 'Authors',
    shortName: 'William',
    image: figureImage(1),
    idleVideo: '/videos/avatars/william-shakespeare-idle.mp4',
    avatarRegion: 'william-shakespeare',
  },
  {
    id: 2,
    slug: 'agatha-christie',
    name: 'Agatha Christie',
    job: 'Mystery Author',
    category: 'Authors',
    shortName: 'Agatha',
    image: figureImage(2),
    idleVideo: '/videos/avatars/agatha-christie-idle.mp4',
    avatarRegion: 'agatha-christie',
  },
  {
    id: 5,
    slug: 'charles-dickens',
    name: 'Charles Dickens',
    job: 'Author',
    category: 'Authors',
    shortName: 'Charles',
    image: figureImage(5),
    idleVideo: '/videos/avatars/charles-dickens-idle.mp4',
    avatarRegion: 'charles-dickens',
  },
  // Politics
  {
    id: 7,
    slug: 'winston-churchill',
    name: 'Winston Churchill',
    job: 'Prime Minister',
    category: 'Politics',
    shortName: 'Winston',
    image: figureImage(7),
    idleVideo: '/videos/avatars/winston-churchill-idle.mp4',
    avatarRegion: 'winston-churchill',
  },
  {
    id: 9,
    slug: 'abraham-lincoln',
    name: 'Abraham Lincoln',
    job: 'U.S. President',
    category: 'Politics',
    shortName: 'Abraham',
    image: figureImage(9),
    idleVideo: '/videos/avatars/abraham-lincoln-idle.mp4',
    avatarRegion: 'abraham-lincoln',
  },
  {
    id: 10,
    slug: 'nelson-mandela',
    name: 'Nelson Mandela',
    job: 'President & Activist',
    category: 'Politics',
    shortName: 'Nelson',
    image: figureImage(10),
    idleVideo: '/videos/avatars/nelson-mandela-idle.mp4',
    avatarRegion: 'nelson-mandela',
  },
  // Sports
  {
    id: 12,
    slug: 'babe-ruth',
    name: 'Babe Ruth',
    job: 'Baseball Player',
    category: 'Sports',
    shortName: 'Babe',
    image: figureImage(12),
    idleVideo: '/videos/avatars/babe-ruth-idle.mp4',
    avatarRegion: 'babe-ruth',
  },
  {
    id: 13,
    slug: 'muhammad-ali',
    name: 'Muhammad Ali',
    job: 'Boxer',
    category: 'Sports',
    shortName: 'Muhammad',
    image: figureImage(13),
    idleVideo: '/videos/avatars/muhammad-ali-idle.mp4',
    avatarRegion: 'muhammad-ali',
  },
  {
    id: 14,
    slug: 'pele',
    name: 'Pelé',
    job: 'Football Legend',
    category: 'Sports',
    shortName: 'Pelé',
    image: figureImage(14),
    idleVideo: '/videos/avatars/pele-idle.mp4',
    avatarRegion: 'pele',
  },
  {
    id: 15,
    slug: 'serena-williams',
    name: 'Serena Williams',
    job: 'Tennis Champion',
    category: 'Sports',
    shortName: 'Serena',
    image: figureImage(15),
    idleVideo: '/videos/avatars/serena-williams-idle.mp4',
    avatarRegion: 'serena-williams',
  },
  // Music
  {
    id: 17,
    slug: 'wolfgang-mozart',
    name: 'Wolfgang Amadeus Mozart',
    job: 'Composer',
    category: 'Music',
    shortName: 'Wolfgang',
    image: figureImage(17),
    idleVideo: '/videos/avatars/wolfgang-mozart-idle.mp4',
    avatarRegion: 'wolfgang-mozart',
  },
  {
    id: 19,
    slug: 'elvis-presley',
    name: 'Elvis Presley',
    job: 'Musician',
    category: 'Music',
    shortName: 'Elvis',
    image: figureImage(19),
    idleVideo: '/videos/avatars/elvis-presley-idle.mp4',
    avatarRegion: 'elvis-presley',
  },
  {
    id: 20,
    slug: 'michael-jackson',
    name: 'Michael Jackson',
    job: 'Musician',
    category: 'Music',
    shortName: 'Michael',
    image: figureImage(20),
    idleVideo: '/videos/avatars/michael-jackson-idle.mp4',
    avatarRegion: 'michael-jackson',
  },
  // Education
  {
    id: 23,
    slug: 'isaac-newton',
    name: 'Isaac Newton',
    job: 'Physicist',
    category: 'Education',
    shortName: 'Isaac',
    image: figureImage(23),
    idleVideo: '/videos/avatars/isaac-newton-idle.mp4',
    avatarRegion: 'isaac-newton',
  },
];

const byId = new Map(HISTORY_FIGURES.map((f) => [f.id, f]));

export function getFigureById(id) {
  const key = Number(id);
  return byId.get(key) || null;
}

export function getFiguresByCategory(category) {
  return HISTORY_FIGURES.filter((f) => f.category === category);
}

export function getTalkProfile(id) {
  const figure = getFigureById(id);
  if (!figure) return null;
  return {
    name: figure.name,
    job: figure.job,
    shortName: figure.shortName,
    image: figure.image,
    category: figure.category,
    idleVideo: figure.idleVideo,
    avatarRegion: figure.avatarRegion,
  };
}

/** Home slider — one featured figure per category */
export const homeFigures = [1, 7, 12, 17, 23]
  .map((id) => getFigureById(id))
  .filter(Boolean)
  .map(({ id, name, job, image }) => ({ id, name, job, image }));

/** Home brain-trainer row — one per category */
export const homeTrainers = [2, 9, 14, 19, 23]
  .map((id) => getFigureById(id))
  .filter(Boolean)
  .map(({ id, category, image, name }) => ({
    id,
    title: category,
    name,
    image,
    icon:
      category === 'Education'
        ? 'flask'
        : category === 'Authors'
          ? 'film'
          : 'clock',
  }));

export const talkUrl = (id) => `/talk/${id}`;
