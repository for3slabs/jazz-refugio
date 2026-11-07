"use client";

import { useEffect, useState, useTransition } from "react";
import { guardarAviso, quitarAviso } from "@/app/actions";
import { Bell } from "./icons";

// «recibir avisos»: this phone asks for notifications about gifts (Brian, 2026-11-06) — a gift for
// you, yours was opened, yours was accepted, one can be opened now. One switch, in «regalos» and in
// «ajustes». The browser asks for permission only when she taps it, never on its own. The service
// worker (/sw.js) only shows the notification and opens «regalos» when tapped: it caches nothing.

type Estado = "cargando" | "no-soporta" | "bloqueados" | "apagados" | "encendidos";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function llave(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const soporta = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

async function registro() {
  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export function Avisos({ className = "", fila = false }: { className?: string; fila?: boolean }) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!KEY || !soporta()) return void (vivo && setEstado("no-soporta"));
      if (Notification.permission === "denied") return void (vivo && setEstado("bloqueados"));
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (vivo) setEstado(sub && Notification.permission === "granted" ? "encendidos" : "apagados");
    })().catch(() => vivo && setEstado("apagados"));
    return () => {
      vivo = false;
    };
  }, []);

  function encender() {
    setError(null);
    start(async () => {
      try {
        const permiso = await Notification.requestPermission();
        if (permiso !== "granted") return setEstado(permiso === "denied" ? "bloqueados" : "apagados");
        const reg = await registro();
        await navigator.serviceWorker.ready;
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: llave(KEY!) }));
        const r = await guardarAviso(sub.toJSON());
        if (!r.ok) {
          await sub.unsubscribe();
          return setError(r.error);
        }
        setEstado("encendidos");
      } catch {
        setError("Este navegador no dejó encender los avisos. Inténtalo otra vez.");
      }
    });
  }

  function apagar() {
    setError(null);
    start(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration("/");
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          await quitarAviso(sub.endpoint);
          await sub.unsubscribe();
        }
        setEstado("apagados");
      } catch {
        setError("No se pudo apagar. Inténtalo otra vez.");
      }
    });
  }

  if (estado === "cargando" || estado === "no-soporta") return null;
  const on = estado === "encendidos";

  return (
    <div className={`${fila ? "px-6 py-5" : "rounded-2xl border border-line bg-surface px-4 py-3"} ${className}`}>
      <label className={`flex items-center justify-between gap-4 ${estado === "bloqueados" ? "" : "cursor-pointer"}`}>
        <span className="flex items-center gap-3">
          <Bell className={`size-6 shrink-0 ${on ? "text-accent" : "text-ink-soft"}`} />
          <span>
            <span className="block">recibir avisos de regalos</span>
            <span className="text-sm text-ink-soft">
              {estado === "bloqueados"
                ? "están bloqueados: actívalos en los permisos del sitio en tu navegador"
                : on
                  ? "te llegan aquí: regalos nuevos, abiertos y aceptados"
                  : "cuando te llegue uno, o abran o acepten el tuyo"}
            </span>
          </span>
        </span>
        {estado !== "bloqueados" && (
          <>
            <input
              type="checkbox"
              role="switch"
              checked={on}
              disabled={pending}
              onChange={(e) => (e.target.checked ? encender() : apagar())}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className="relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-accent peer-disabled:opacity-60 peer-focus-visible:ring-2 peer-focus-visible:ring-accent after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition-transform peer-checked:after:translate-x-5"
            />
          </>
        )}
      </label>
      {error && (
        <p role="status" className="mt-2 text-sm text-ink">
          {error}
        </p>
      )}
    </div>
  );
}
