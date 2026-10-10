"use client";

/* ============================================================================
   EASTER EGG (página inicial)
   ============================================================================
   Card discreto com um botão. Ao clicar, aparece a tela vermelha com a
   estrela e alguns confetes caem por poucos segundos.

   Fica isolado neste arquivo: para remover, apague o arquivo e a linha
   <EasterEgg /> em src/app/page.tsx. As animações estão no fim de
   src/app/globals.css (classes egg-*).
   ============================================================================ */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Star } from "lucide-react";
import { cn } from "@/content";

const RED = "#c80f1a";
const CONFETTI_COLORS = ["#ff3b3b", "#e01e26", "#b5000b", "#ff7a7a", "#8a0008"];
const CONFETTI_COUNT = 26;
const CONFETTI_MS = 3600;

/** Estrela de cinco pontas (viewBox 0 0 100 100). */
const STAR_POINTS = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 === 0 ? 48 : 19;
  const a = ((-90 + i * 36) * Math.PI) / 180;
  return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
}).join(" ");

/** Raios de sol atrás da estrela, como nos cartazes. */
const RAYS = Array.from({ length: 18 }, (_, i) => {
  const a0 = (i * 20 * Math.PI) / 180;
  const a1 = ((i * 20 + 10) * Math.PI) / 180;
  const p = (a: number) => `${(50 + 150 * Math.cos(a)).toFixed(2)} ${(50 + 150 * Math.sin(a)).toFixed(2)}`;
  return `M50 50 L${p(a0)} L${p(a1)} Z`;
});

interface Piece {
  id: number;
  style: CSSProperties;
}

/** Sorteia os confetes. Só roda dentro do clique, nunca durante a renderização. */
function makeConfetti(): Piece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, id) => {
    const size = 6 + Math.random() * 5;
    const round = Math.random() < 0.3;
    return {
      id,
      style: {
        left: `${Math.random() * 100}%`,
        width: `${size}px`,
        height: `${round ? size : size * 0.45}px`,
        borderRadius: round ? "999px" : "2px",
        background: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
        animationDelay: `${Math.random() * 0.7}s`,
        animationDuration: `${2.2 + Math.random() * 1.1}s`,
        "--drift": `${(Math.random() - 0.5) * 140}px`,
        "--spin": `${(Math.random() < 0.5 ? -1 : 1) * (240 + Math.random() * 360)}deg`,
      } as CSSProperties,
    };
  });
}

export function EasterEgg({ className }: { className?: string }) {
  const [revealed, setRevealed] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const revealRef = useRef<HTMLElement>(null);

  function reveal() {
    setRevealed(true);
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!calm) setPieces(makeConfetti());
  }

  // Leva a tela revelada para o centro e coloca o foco nela (teclado e leitor de tela).
  useEffect(() => {
    if (!revealed || !revealRef.current) return;
    revealRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    revealRef.current.focus({ preventScroll: true });
  }, [revealed]);

  // Some com os confetes depois de alguns instantes.
  useEffect(() => {
    if (pieces.length === 0) return;
    const t = window.setTimeout(() => setPieces([]), CONFETTI_MS);
    return () => window.clearTimeout(t);
  }, [pieces]);

  return (
    <div className={className}>
      {!revealed ? (
        <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="flex items-start gap-3 font-display text-base leading-snug text-ink sm:text-lg">
            <Star className="mt-1 h-4 w-4 shrink-0" style={{ color: RED }} fill={RED} aria-hidden />
            <span>
              Fórmula secreta pra ficar com 10 na média e continuar tendo acesso à uma faculdade pública{" "}
              <strong className="font-semibold" style={{ color: RED }}>
                de qualidade
              </strong>
            </span>
          </p>
          <button
            type="button"
            onClick={reveal}
            className="shrink-0 self-start rounded-control px-5 py-2.5 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.98] sm:self-auto"
            style={{ backgroundColor: RED }}
          >
            Descobrir
          </button>
        </div>
      ) : (
        <section
          ref={revealRef}
          tabIndex={-1}
          aria-live="polite"
          className="egg-reveal relative overflow-hidden rounded-card px-6 py-12 text-center text-white outline-none sm:py-16"
          style={{ background: "radial-gradient(circle at 50% 38%, #dc1520 0%, #c80f1a 55%, #a00a14 100%)" }}
        >
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid slice"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {RAYS.map((d) => (
              <path key={d} d={d} fill="#ffffff" opacity={0.07} />
            ))}
          </svg>
          <div aria-hidden className="pointer-events-none absolute inset-3 rounded-[0.6rem] border border-white/25" />

          <div className="relative flex flex-col items-center">
            <svg aria-hidden viewBox="0 0 100 100" className="egg-star h-20 w-20 drop-shadow-[0_6px_14px_rgba(0,0,0,0.25)] sm:h-24 sm:w-24">
              <polygon points={STAR_POINTS} fill="#ffffff" />
            </svg>

            <p className="mt-6 font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight sm:text-6xl">
              <span className="block">DIA 25,</span>{" "}
              <span className="mt-1 block">
                VOTE{" "}
                <span className="mx-1 inline-block rounded-md bg-white px-2.5 leading-[1.15] sm:px-3" style={{ color: RED }}>
                  13
                </span>{" "}
                VIU
              </span>
            </p>

            <p className="mt-6 text-lg font-semibold sm:text-xl">{"Salve o Brasil do ódio \u{1F61C} \u261D\uFE0F"}</p>
          </div>
        </section>
      )}

      {pieces.length > 0 ? (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {pieces.map((p) => (
            <span key={p.id} className={cn("egg-piece")} style={p.style} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
