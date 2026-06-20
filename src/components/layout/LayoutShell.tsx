"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";

const PANEL_ROUTES = ["/admin", "/dashboard", "/client", "/auth/accept-invite"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPanel = PANEL_ROUTES.some((route) => pathname.startsWith(route));

  if (isPanel) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
