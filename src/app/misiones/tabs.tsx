import { Tabs as Pills } from "@/components/tabs";

// Today and later, side by side on the title's line: a step moves from one to the other with «→ hoy».
export function Tabs({ vista }: { vista: "hoy" | "despues" }) {
  return (
    <Pills
      label="vista"
      compact
      current={vista}
      items={[
        { key: "hoy", href: "/misiones", label: "hoy" },
        { key: "despues", href: "/misiones?v=despues", label: "más adelante" },
      ]}
    />
  );
}
