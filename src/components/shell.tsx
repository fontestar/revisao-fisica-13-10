"use client";

/* ============================================================================
   LAYOUT E NAVEGAÇÃO
   ============================================================================
   A "casca" do site: lista de links do menu, barra lateral (desktop),
   cabeçalho com menu recolhível (celular) e o invólucro que fornece o
   progresso salvo para todas as páginas.
   ============================================================================ */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  GraduationCap,
  Home,
  Layers,
  Menu,
  PenLine,
  PlaySquare,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn, review } from "@/content";
import { ProgressProvider } from "@/progress";
import { ProgressSummary } from "./study";

/* ──────────────────────────────
   LINKS DO MENU  ← edite aqui para adicionar/remover páginas
   ────────────────────────────── */

const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/partes", label: "Partes", icon: Layers },
  { href: "/discursivas", label: "Discursivas", icon: PenLine },
  { href: "/gabaritos", label: "Gabaritos", icon: ClipboardList },
  { href: "/videoaulas", label: "Videoaulas", icon: PlaySquare },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ──────────────────────────────
   BARRA LATERAL (telas grandes)
   ────────────────────────────── */

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-border bg-surface px-6 py-8 lg:flex">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-contrast">
          <GraduationCap className="h-4.5 w-4.5" aria-hidden />
        </span>
        <span className="font-display text-base font-medium text-ink">{review.kicker}</span>
      </Link>

      <nav aria-label="Navegação principal" className="mt-10">
        <ul className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-soft text-brand-strong"
                      : "text-ink-soft hover:bg-surface-muted hover:text-ink",
                  )}
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-10 rounded-card border border-border p-4">
        <ProgressSummary compact />
      </div>

      {/* Data da prova, quando definida em `review.identifier`. */}
      {review.identifier ? (
        <p className="mt-auto pt-6 text-xs text-ink-faint">{review.identifier}</p>
      ) : null}
    </aside>
  );
}

/* ──────────────────────────────
   CABEÇALHO + MENU (celular)
   ────────────────────────────── */

function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  // Fecha o menu ao trocar de página.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Fecha com Esc e trava a rolagem do fundo enquanto o menu está aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between px-4 py-3.5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-brand-contrast">
            <GraduationCap className="h-4 w-4" aria-hidden />
          </span>
          <span className="font-display text-sm font-medium text-ink">{review.kicker}</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink"
        >
          {open ? <X className="h-4.5 w-4.5" aria-hidden /> : <Menu className="h-4.5 w-4.5" aria-hidden />}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav-drawer" className="border-t border-border bg-surface px-4 pb-5 pt-2">
          <nav aria-label="Navegação principal">
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const active = isActive(pathname, link.href);
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-control px-3 py-3 text-base font-medium",
                        active ? "bg-brand-soft text-brand-strong" : "text-ink-soft",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

/* ──────────────────────────────
   CASCA DA APLICAÇÃO
   ────────────────────────────── */

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ProgressProvider>
      <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] lg:flex-row">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader />
          <main className="min-w-0 flex-1">{children}</main>
          <footer className="border-t border-border px-4 py-6 text-center text-xs text-ink-faint sm:px-8 lg:px-12">
            {review.title} · {review.subtitle}
          </footer>
        </div>
      </div>
    </ProgressProvider>
  );
}
