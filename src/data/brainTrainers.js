import {
  FIGURE_CATEGORIES,
  HISTORY_FIGURES,
} from './figuresCatalog.js'

export const ACTIVE_CATEGORIES = FIGURE_CATEGORIES.filter((category) =>
  HISTORY_FIGURES.some((figure) => figure.category === category),
)

export const BRAIN_TRAINERS_PER_PAGE = 5
export const BRAIN_TRAINERS_TOTAL_PAGES = ACTIVE_CATEGORIES.length

function trainerIcon(category) {
  if (category === 'Education') return 'flask'
  if (category === 'Authors') return 'film'
  return 'clock'
}

export const brainTrainersCatalog = HISTORY_FIGURES.map((figure) => ({
  id: figure.id,
  category: figure.category,
  name: figure.name,
  image: figure.image,
  icon: trainerIcon(figure.category),
  page: ACTIVE_CATEGORIES.indexOf(figure.category) + 1,
}))

export function getBrainTrainersPage(page = 1) {
  const current = Math.min(
    Math.max(Number(page) || 1, 1),
    BRAIN_TRAINERS_TOTAL_PAGES,
  )
  const category = ACTIVE_CATEGORIES[current - 1]
  return {
    page: current,
    totalPages: BRAIN_TRAINERS_TOTAL_PAGES,
    category,
    items: brainTrainersCatalog.filter((item) => item.category === category),
  }
}
