// Drawn icons instead of unicode glyphs: glyphs change shape from one font and device to
// another, and she would see it.
type P = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const Sparkle = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 3.5c.6 4.2 2.3 5.9 6.5 6.5-4.2.6-5.9 2.3-6.5 6.5-.6-4.2-2.3-5.9-6.5-6.5 4.2-.6 5.9-2.3 6.5-6.5Z" />
    <path d="M19 16.5c.2 1.4.8 2 2.2 2.2-1.4.2-2 .8-2.2 2.2-.2-1.4-.8-2-2.2-2.2 1.4-.2 2-.8 2.2-2.2Z" />
  </svg>
);

export const Bloom = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="12" cy="6.5" r="3" />
    <circle cx="17.2" cy="10.3" r="3" />
    <circle cx="15.2" cy="16.4" r="3" />
    <circle cx="8.8" cy="16.4" r="3" />
    <circle cx="6.8" cy="10.3" r="3" />
    <circle cx="12" cy="12" r="1.6" />
  </svg>
);

export const Letter = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="m4.5 7 7.5 6 7.5-6" />
  </svg>
);

export const Star = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="m12 3.8 2.4 5 5.4.7-4 3.7 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.7 5.4-.7L12 3.8Z" />
  </svg>
);

export const Moon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z" />
  </svg>
);

export const Sun = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </svg>
);

export const Gear = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </svg>
);

export const ArrowLeft = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const ArrowRight = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// The five modes — told apart by shape, since every color is the same purple family.
export const Focus = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1.2" />
  </svg>
);

export const Linked = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="9" cy="12" r="5.5" />
    <circle cx="15" cy="12" r="5.5" />
  </svg>
);

export const Ideas = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="6.5" cy="7.5" r="1.8" />
    <circle cx="16.5" cy="5.5" r="1.3" />
    <circle cx="12.5" cy="12.5" r="2.4" />
    <circle cx="6" cy="17.5" r="1.3" />
    <circle cx="18" cy="16.5" r="1.8" />
  </svg>
);

export const Waves = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M3.5 7.5c2.1-1.6 4.2-1.6 6.3 0s4.2 1.6 6.3 0 3.4-1.4 4.4-.8" />
    <path d="M3.5 12c2.1-1.6 4.2-1.6 6.3 0s4.2 1.6 6.3 0 3.4-1.4 4.4-.8" />
    <path d="M3.5 16.5c2.1-1.6 4.2-1.6 6.3 0s4.2 1.6 6.3 0 3.4-1.4 4.4-.8" />
  </svg>
);

export const Rest = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M16.5 15.8A6.6 6.6 0 0 1 8.7 6a7 7 0 1 0 7.8 9.8Z" />
    <path d="M18 4.5v3.5M16.25 6.25h3.5" />
  </svg>
);
