// One flower per time she came back. Each one is a little different — petals, shade and
// tilt come from its number, so the same flower always looks the same.
const shades = [
  "oklch(0.62 0.24 308)",
  "oklch(0.7 0.2 315)",
  "oklch(0.78 0.15 312)",
  "oklch(0.55 0.24 322)",
  "oklch(0.74 0.18 330)",
  "oklch(0.66 0.23 340)",
];

export function Flower({ n, className = "" }: { n: number; className?: string }) {
  const petals = 5 + (n % 3);
  const color = shades[(n * 7) % shades.length];
  const tilt = ((n * 37) % 30) - 15;
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden style={{ transform: `rotate(${tilt}deg)` }}>
      {Array.from({ length: petals }, (_, i) => (
        <ellipse
          key={i}
          cx="20"
          cy="11.5"
          rx="5"
          ry="8.5"
          fill={color}
          fillOpacity={0.78}
          transform={`rotate(${(360 / petals) * i} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="4.6" fill="oklch(0.9 0.11 95)" />
      <circle cx="20" cy="20" r="4.6" fill="none" stroke="oklch(0.25 0.065 315)" strokeOpacity={0.12} />
    </svg>
  );
}
