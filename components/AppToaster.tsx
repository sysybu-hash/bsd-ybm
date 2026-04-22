"use client";

import { Toaster } from "sonner";

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      dir="rtl"
      toastOptions={{ classNames: { toast: "font-sans" } }}
    />
  );
}
