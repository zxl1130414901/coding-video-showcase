import type { JSX } from 'react';

export type IconName =
  | 'logo'
  | 'grid'
  | 'table'
  | 'clock'
  | 'search'
  | 'close'
  | 'play'
  | 'copy'
  | 'external'
  | 'folder'
  | 'check'
  | 'chevron'
  | 'star'
  | 'film'
  | 'alert'
  | 'arrow-right'
  | 'reset'
  | 'compare';

const PATHS: Record<IconName, JSX.Element> = {
  logo: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M8 12h3l2-3 2 6 1.5-3H19" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M3 14h18M9 4v16M15 4v16" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  play: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5l6 3.5-6 3.5z" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4L11 13" />
      <path d="M19 14v5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19V6.5A1.5 1.5 0 0 1 5.5 5h5" />
    </>
  ),
  folder: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </>
  ),
  check: <path d="M5 12l5 5L19 7" />,
  chevron: <path d="M8 10l4 4 4-4" />,
  star: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z" />,
  film: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3l9 17H3z" />
      <path d="M12 9v5M12 17.5v.5" />
    </>
  ),
  'arrow-right': <path d="M4 12h15M13 6l6 6-6 6" />,
  reset: (
    <>
      <path d="M4 4v6h6" />
      <path d="M5.5 15a8 8 0 1 0 .5-7" />
    </>
  ),
  compare: (
    <>
      <path d="M12 3v18" />
      <path d="M7 8l-4 5 4 5M17 8l4 5-4 5" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 18, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
