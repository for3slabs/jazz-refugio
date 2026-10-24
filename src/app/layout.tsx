import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { Notifications } from "@/components/notifications";
import "./globals.css";

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

// Applies the saved theme and motion choice before the first paint, so nothing flashes.
const prefsScript = `try{var t=localStorage.getItem("refugio:theme");if(t==="light")document.documentElement.dataset.theme=t;var m=localStorage.getItem("refugio:motion");if(m)document.documentElement.dataset.motion=m}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${bricolage.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefsScript }} />
      </head>
      <body className="min-h-full font-sans">
        {children}
        <Notifications />
      </body>
    </html>
  );
}
