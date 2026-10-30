const iconProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '28.766',
  height: '28.766',
  viewBox: '0 0 28.766 28.766',
  'aria-hidden': 'true',
}

export function FlaskIcon() {
  return (
    <svg {...iconProps}>
      <path
        d="M18.493,0H8.219a2.055,2.055,0,1,0,0,4.109v8.527a4.1,4.1,0,0,1-.61,2.151L.661,26.082a4.457,4.457,0,0,0,3.795,6.793H24.31A4.457,4.457,0,0,0,28.1,26.082L21.157,14.794a4.114,4.114,0,0,1-.61-2.151V4.109a2.055,2.055,0,1,0,0-4.109ZM12.328,12.637V4.109h4.109v8.527a8.234,8.234,0,0,0,1.22,4.309l2.215,3.6H8.893l2.215-3.6A8.234,8.234,0,0,0,12.328,12.637Z"
        fill="#3a6dee"
      />
    </svg>
  )
}

export function ClockIcon() {
  return (
    <svg {...iconProps}>
      <path
        d="M4.214,4.214,2.3,2.3a1.35,1.35,0,0,0-2.3.95V9.439a1.345,1.345,0,0,0,1.348,1.348H7.534a1.35,1.35,0,0,0,.955-2.3l-1.73-1.73A10.786,10.786,0,1,1,8.22,23.238a1.8,1.8,0,0,0-2.062,2.95A14.387,14.387,0,1,0,4.214,4.214ZM14.383,7.192A1.345,1.345,0,0,0,13.035,8.54v5.843a1.347,1.347,0,0,0,.393.955l4.045,4.045a1.347,1.347,0,0,0,1.9-1.9l-3.652-3.652V8.54a1.345,1.345,0,0,0-1.348-1.348Z"
        fill="#3a6dee"
      />
    </svg>
  )
}

export function FilmIcon() {
  return (
    <svg {...iconProps}>
      <path
        d="M0,35.6A3.6,3.6,0,0,1,3.6,32H25.171a3.6,3.6,0,0,1,3.6,3.6V53.575a3.6,3.6,0,0,1-3.6,3.6H3.6a3.6,3.6,0,0,1-3.6-3.6ZM2.7,50.878v1.8a.9.9,0,0,0,.9.9h1.8a.9.9,0,0,0,.9-.9v-1.8a.9.9,0,0,0-.9-.9H3.6A.9.9,0,0,0,2.7,50.878Zm20.676-.9a.9.9,0,0,0-.9.9v1.8a.9.9,0,0,0,.9.9h1.8a.9.9,0,0,0,.9-.9v-1.8a.9.9,0,0,0-.9-.9ZM2.7,43.686v1.8a.9.9,0,0,0,.9.9h1.8a.9.9,0,0,0,.9-.9v-1.8a.9.9,0,0,0-.9-.9H3.6A.9.9,0,0,0,2.7,43.686Zm20.676-.9a.9.9,0,0,0-.9.9v1.8a.9.9,0,0,0,.9.9h1.8a.9.9,0,0,0,.9-.9v-1.8a.9.9,0,0,0-.9-.9ZM2.7,36.495v1.8a.9.9,0,0,0,.9.9h1.8a.9.9,0,0,0,.9-.9v-1.8a.9.9,0,0,0-.9-.9H3.6A.9.9,0,0,0,2.7,36.495Zm20.676-.9a.9.9,0,0,0-.9.9v1.8a.9.9,0,0,0,.9.9h1.8a.9.9,0,0,0,.9-.9v-1.8a.9.9,0,0,0-.9-.9Zm-14.383,1.8v3.6a1.8,1.8,0,0,0,1.8,1.8h7.192a1.8,1.8,0,0,0,1.8-1.8v-3.6a1.8,1.8,0,0,0-1.8-1.8H10.787A1.8,1.8,0,0,0,8.989,37.394Zm1.8,8.989a1.8,1.8,0,0,0-1.8,1.8v3.6a1.8,1.8,0,0,0,1.8,1.8h7.192a1.8,1.8,0,0,0,1.8-1.8v-3.6a1.8,1.8,0,0,0-1.8-1.8Z"
        transform="translate(0 -32)"
        fill="#3a6dee"
      />
    </svg>
  )
}

export function TrainerIcon({ name }) {
  if (name === 'flask') return <FlaskIcon />
  if (name === 'film') return <FilmIcon />
  return <ClockIcon />
}

export function AngleLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15.5 4.5 8 12l7.5 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function AngleRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8.5 4.5 16 12l-7.5 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LongArrowRightIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
      <path
        d="M1 6h13M10 2l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
