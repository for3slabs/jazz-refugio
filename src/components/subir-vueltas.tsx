"use client";

import { useEffect } from "react";
import { subirMisVueltas } from "@/app/actions";
import { moments, vueltasSubidas } from "@/lib/local";

// Once per device: the «volver» flowers this browser kept before the DB go up, so the PC and
// the phone count the same garden. Retries on the next page until it works (e.g. before login).
export function SubirVueltas() {
  useEffect(() => {
    if (vueltasSubidas.get()) return;
    const list = moments.all();
    if (!list.length) return vueltasSubidas.set();
    subirMisVueltas(list).then((ok) => ok && vueltasSubidas.set());
  }, []);
  return null;
}
