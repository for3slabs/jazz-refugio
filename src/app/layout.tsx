import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { Notifications } from "@/components/notifications";
import "./globals.css";
import { SubirVueltas } from "@/components/subir-vueltas";

// One family, three voices (display · label · body) — see the t-* roles in globals.css.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "wdth"],
});

export const metadata: Metadata = {
  title: "tu lienzo mental",
  description: "un lugar para volver",
  // A private place: never indexed, never previewed.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "oklch(0.14 0.028 315)",
};

// Applies the saved theme, motion choice and her last mode (12 h) before the first paint, so nothing flashes.
const prefsScript = `try{var t=localStorage.getItem("refugio:theme");if(t==="light")document.documentElement.dataset.theme=t;var m=localStorage.getItem("refugio:motion");if(m)document.documentElement.dataset.motion=m;var e=JSON.parse(localStorage.getItem("refugio:modo")||"null");if(e&&typeof e.modo==="string"&&Date.now()-e.at<432e5)document.documentElement.dataset.modo=e.modo}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${bricolage.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefsScript }} />
      </head>
      <body className="min-h-full font-sans">
        {children}
        <Notifications />
        <SubirVueltas />
      </body>
    </html>
  );
}
