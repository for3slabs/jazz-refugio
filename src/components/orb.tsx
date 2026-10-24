import type { ModoId } from "@/lib/modos";

// The orb takes the colour of her mode (globals.css · [data-modo]); with no mode it keeps
// her purple. Children sit on top of it — the light layers stay hidden from screen readers.
export function Orb({
  className = "",
  style,
  modo = null,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  modo?: ModoId | null;
  children?: React.ReactNode;
}) {
  return (
    <div className={`orb-tint relative ${className}`} style={style} data-modo={modo ?? undefined}>
      <div aria-hidden className="orb-halo absolute -inset-[45%] rounded-full" />
      <div aria-hidden className="orb absolute inset-0 rounded-full" />
      {children}
    </div>
  );
}
