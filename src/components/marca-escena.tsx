"use client";

import { useEffect } from "react";

// A scene page says which scene it is on <html> while it is on screen — and only then. Next keeps a
// page alive, hidden, after she leaves it (so «back» is instant); a CSS `:has([data-escena])` still
// found the hidden garden and painted «mensajes» with sand (Brian, 2026-10-25). Effects stop while a
// page is hidden, so this mark leaves with it.
export function MarcaEscena({ nombre }: { nombre: string }) {
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.escena = nombre;
    return () => {
      if (html.dataset.escena === nombre) delete html.dataset.escena;
    };
  }, [nombre]);
  return null;
}
