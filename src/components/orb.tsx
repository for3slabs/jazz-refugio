export function Orb({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div aria-hidden className={`relative ${className}`} style={style}>
      <div className="orb-halo absolute -inset-[45%] rounded-full" />
      <div className="orb absolute inset-0 rounded-full" />
    </div>
  );
}
