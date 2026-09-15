import * as React from "react";
import { Header } from "./Header";
import { cn } from "@/libs/utils";

export interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      <Header />
      <main className={cn("container flex-1 py-6 px-4 sm:px-6 space-y-6", className)}>
        {children}
      </main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        <div className="container">
          <p>© 2026 horse-racing-calendar. JRA 重賞スケジュール</p>
        </div>
      </footer>
    </div>
  );
}
