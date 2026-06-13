"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "About", href: "/about" },
  { name: "Articles", href: "/articles" },
  { name: "Tools", href: "/tools" },
  { name: "FAQ", href: "/faq" },
];

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90 z-50">
          <Image
            src="/logo.svg"
            width={32}
            height={32}
            alt="Duely Logo"
            className="h-8 w-8 rounded-md shadow-sm"
          />
          <span className="text-xl font-semibold tracking-tight text-zinc-50">Duely</span>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden sm:flex items-center gap-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === item.href || pathname?.startsWith(item.href + "/")
                  ? "bg-white/[0.04] text-zinc-100"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              }`}
            >
              {item.name}
            </Link>
          ))}
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-zinc-50">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="shadow-lg shadow-indigo-500/20">Get started</Button>
          </Link>
        </div>

        {/* Mobile Toggle & Actions */}
        <div className="flex sm:hidden items-center gap-3 z-50">
          <Link href="/signup">
            <Button size="sm" className="h-8 text-xs px-3 shadow-lg shadow-indigo-500/20">Get started</Button>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 -mr-2 text-zinc-400 hover:text-zinc-100 focus:outline-none flex items-center justify-center min-h-[44px] min-w-[44px]"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </Container>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-zinc-950 px-6 py-6 sm:hidden overflow-y-auto">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-lg font-medium p-3 -mx-2 min-h-[44px] flex items-center rounded-lg transition-colors ${
                  pathname === item.href || pathname?.startsWith(item.href + "/")
                    ? "text-zinc-100 bg-white/[0.04]"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.02]"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3">
              <Link href="/login">
                <Button variant="secondary" className="w-full justify-center h-12 text-base">
                  Sign in
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
