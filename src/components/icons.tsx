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

// «no arranco»: a dot where she stands and the first stretch of a road out of it.
export const Start = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="5.5" cy="18.5" r="1.8" />
    <path d="M8.5 16.5c2.5-1.5 3.5-4 5.5-6.5s3.5-3.5 5.5-4" />
    <path d="M15.5 5.5 19.5 6l-.8 3.9" />
  </svg>
);

// A mission: a diamond with its tick — and the tick alone, for the button that completes it.
export const Diamond = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 3.5 20.5 12 12 20.5 3.5 12Z" />
    <path d="m9.2 12 2 2 3.8-3.8" />
  </svg>
);

export const Check = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="m6.5 12.5 3.6 3.6 7.4-7.6" />
  </svg>
);

export const More = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="6" cy="12" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="18" cy="12" r="1.2" />
  </svg>
);

export const Gift = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <rect x="4.5" y="10" width="15" height="10" rx="1.5" />
    <rect x="3.5" y="7" width="17" height="3" rx="1" />
    <path d="M12 7v13" />
    <path d="M12 7c-1.4-2.8-4.8-3.1-4.6-.9.2 1.2 2.6.9 4.6.9Zm0 0c1.4-2.8 4.8-3.1 4.6-.9-.2 1.2-2.6.9-4.6.9Z" />
  </svg>
);

// Her canvas: a painter's palette.
export const Palette = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 1.9-.9 1.6-1.9-.4-1.2.3-2.4 1.6-2.4h1.9a3.4 3.4 0 0 0 3.4-3.4c0-5-3.8-9.3-8.5-9.3Z" />
    <circle cx="8" cy="11" r="1.1" />
    <circle cx="10.5" cy="7.5" r="1.1" />
    <circle cx="14.8" cy="8" r="1.1" />
  </svg>
);

export const Pencil = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4.5 19.5 5.6 15 16 4.6a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L9 18.4l-4.5 1.1Z" />
    <path d="m14.5 6.1 3.4 3.4" />
  </svg>
);

export const Undo = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M9 14 4.5 9.5 9 5" />
    <path d="M4.5 9.5H14a5.5 5.5 0 0 1 0 11h-3" />
  </svg>
);

export const Close = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const Chevron = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="m7 10 5 5 5-5" />
  </svg>
);

export const Plus = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 6v12M6 12h12" />
  </svg>
);

export const Trash = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M5 7h14M10 4h4M7 7l.8 11.2A2 2 0 0 0 9.8 20h4.4a2 2 0 0 0 2-1.8L17 7M10.5 11v5M13.5 11v5" />
  </svg>
);

export const Share = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="17.5" cy="6" r="2.5" />
    <circle cx="6.5" cy="12" r="2.5" />
    <circle cx="17.5" cy="18" r="2.5" />
    <path d="m8.7 10.8 6.6-3.6M8.7 13.2l6.6 3.6" />
  </svg>
);

export const Lock = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
