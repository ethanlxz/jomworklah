/* Small inline icon set, drawn in the same 24px stroke style as js/app.js. */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false
};

export function SearchIcon({ size = 18 }) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  );
}

export function ArrowIcon({ size = 16 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M5 12h13" />
      <path d="M12.5 5.5 19 12l-6.5 6.5" />
    </svg>
  );
}

export function PinIcon({ size = 16 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M12 21s6.5-6.2 6.5-11a6.5 6.5 0 1 0-13 0C5.5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

export function UserIcon({ size = 22 }) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </svg>
  );
}

export function CheckIcon({ size = 14 }) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2.2}>
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  );
}

export function LockIcon({ size = 17 }) {
  return (
    <svg {...base} width={size} height={size}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </svg>
  );
}

export function MailIcon({ size = 17 }) {
  return (
    <svg {...base} width={size} height={size}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
    </svg>
  );
}

export function CloseIcon({ size = 18 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
