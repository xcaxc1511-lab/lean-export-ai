import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { FloatingContact } from "@/components/FloatingContact";

export function Layout({ children }: { children: ReactNode }) {
  const pathname = useLocation({ select: (location) => location.pathname });

  // The admin area has its own shell — no public header, footer or chat buttons.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return <div className="min-h-screen bg-gray-50 text-foreground">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer />
      <FloatingContact />
    </div>
  );
}
