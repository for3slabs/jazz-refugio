// One flower per time she came back. Each one is a little different — petals, shade and
// tilt come from its number, so the same flower always looks the same.
const shades = ["#7c3aed", "#8b5cf6", "#a78bfa", "#6d28d9", "#c084fc", "#9333ea"];

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
      <circle cx="20" cy="20" r="4.6" fill="#fde68a" />
      <circle cx="20" cy="20" r="4.6" fill="none" stroke="#2a1b47" strokeOpacity={0.12} />
    </svg>
  );
}
