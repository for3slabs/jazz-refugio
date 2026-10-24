// A short burst of purple — the reward has to arrive the moment she comes back.
const colors = ["var(--accent)", "var(--spark)", "var(--ink)", "var(--glow)", "oklch(0.9 0.11 95)"];

export function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => {
    const left = (i * 37) % 100;
    const dx = ((i * 53) % 120) - 60;
    const rot = ((i * 97) % 540) - 270;
    const delay = (i % 7) * 70;
    const size = 6 + (i % 4) * 2;
    return { i, left, dx, rot, delay, size, color: colors[i % colors.length], round: i % 3 === 0 };
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.i}
          className="confetti absolute top-0"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 0.45,
              background: p.color,
              borderRadius: p.round ? 999 : 2,
              animationDelay: `${p.delay}ms`,
              "--dx": `${p.dx}px`,
              "--rot": `${p.rot}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
