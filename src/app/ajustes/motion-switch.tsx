"use client";

import { useEffect, useState } from "react";
import { prefs } from "@/lib/local";

export function MotionSwitch() {
  const [off, setOff] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the choice is stored in her browser
  useEffect(() => setOff(prefs.motionOff()), []);
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5">
      <span>
        <span className="block">menos movimiento</span>
        <span className="text-sm text-ink-soft">para los días en que todo se siente mucho</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={off}
        onChange={(e) => {
          prefs.setMotionOff(e.target.checked);
          setOff(e.target.checked);
        }}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  );
}
