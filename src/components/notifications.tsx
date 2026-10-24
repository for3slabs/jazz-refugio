"use client";

import { Toaster } from "./notify";

// The floating notices, mounted once for every screen; what calls them comes later.
export function Notifications() {
  return <Toaster position="top-center" />;
}
