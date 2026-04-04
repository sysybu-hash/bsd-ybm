"use client";

import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function SiteWizardChrome({ children }: Props) {
  return <>{children}</>;
}
