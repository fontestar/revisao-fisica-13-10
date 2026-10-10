/* ============================================================================
   PEÇAS VISUAIS REUTILIZÁVEIS
   ============================================================================
   Componentes pequenos e sem estado usados em várias páginas:
   notação matemática (KaTeX), etiquetas, selo de status, vazio,
   dica de estudo, ícone da parte, barra de progresso, card de
   métrica, card de vídeo e o desenho decorativo da capa.
   ============================================================================ */

import katex from "katex";
import "katex/dist/katex.min.css";
import {
  Atom,
  Battery,
  BookOpen,
  Check,
  Circle,
  CircleDot,
  Flame,
  FlaskConical,
  Gauge,
  Inbox,
  Lightbulb,
  Magnet,
  Move,
  Orbit,
  PlayCircle,
  Radiation,
  Rocket,
  Ruler,
  Scale,
  Sun,
  Thermometer,
  Timer,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn, type PartIconName, type PartStatus, type Video } from "@/content";

/* ──────────────────────────────
   MATEMÁTICA (KaTeX)
   ────────────────────────────── */

/**
 * Renderiza uma expressão matemática (LaTeX) com KaTeX.
 * Funciona no servidor e no cliente — o KaTeX só gera uma string HTML.
 *
 * Chama-se MathExpr (e não Math) para não conflitar com o objeto
 * `Math` nativo do JavaScript.
 */
export function MathExpr({
  latex,
  display = false,
  className,
}: {
  latex: string;
  display?: boolean;
  className?: string;
}) {
  const html = katex.renderToString(latex, {
    throwOnError: false,
    displayMode: display,
    output: "html",
    strict: "ignore",
  });

  const Tag = display ? "div" : "span";

  return (
    <Tag
      className={cn(display ? "katex-display-block overflow-x-auto" : "katex-inline", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

type Segment =
  | { type: "text"; value: string }
  | { type: "math"; value: string }
  | { type: "display-math"; value: string };

function splitMath(text: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      segments.push({ type: "display-math", value: match[1] });
    } else if (match[2] !== undefined) {
      segments.push({ type: "math", value: match[2] });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}

/** Converte os trechos $...$ e $$...$$ de um texto em notação matemática. */
function renderMath(text: string, keyPrefix: string) {
  return splitMath(text).map((segment, i) => {
    const key = `${keyPrefix}-${i}`;
    if (segment.type === "math") return <MathExpr key={key} latex={segment.value} />;
    if (segment.type === "display-math") return <MathExpr key={key} latex={segment.value} display />;
    return <span key={key}>{segment.value}</span>;
  });
}

/**
 * Texto usado em teoria, flashcards, questões, alternativas e gabarito.
 *   $...$   → matemática na linha   ·   $$...$$ → matemática destacada
 *   **...** → negrito (os asteriscos somem da tela)
 * O negrito pode conter matemática: "**Ângulo ($i$)**".
 */
export function MathText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g); // índices ímpares = negrito
  return (
    <span className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold">
            {renderMath(part, `b${i}`)}
          </strong>
        ) : (
          <span key={i}>{renderMath(part, `t${i}`)}</span>
        ),
      )}
    </span>
  );
}

/* ──────────────────────────────
   ETIQUETA DE SEÇÃO
   ────────────────────────────── */

export function SectionLabel({
  children,
  className,
  tone = "brand",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "brand" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em]",
        tone === "brand" ? "text-brand" : "text-ink-faint",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ──────────────────────────────
   SELO DE STATUS
   ────────────────────────────── */

const STATUS_CONFIG: Record<PartStatus, { label: string; icon: LucideIcon; className: string }> = {
  "not-started": {
    label: "Não iniciado",
    icon: Circle,
    className: "bg-surface-muted text-ink-soft",
  },
  "in-progress": {
    label: "Em andamento",
    icon: CircleDot,
    className: "bg-warning-soft text-warning",
  },
  completed: {
    label: "Concluído",
    icon: Check,
    className: "bg-success-soft text-success",
  },
};

/** Mostra o estado de uma parte sem depender só de cor (tem ícone e texto). */
export function StatusPill({ status, className }: { status: PartStatus; className?: string }) {
  const { label, icon: Icon, className: toneClass } = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClass,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}

/* ──────────────────────────────
   ESTADO VAZIO
   ────────────────────────────── */

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  className,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-dashed border-border-strong bg-surface-muted/60 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink-faint">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-base font-medium text-ink">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm leading-relaxed text-ink-soft">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

/* ──────────────────────────────
   DICA DE ESTUDO
   ────────────────────────────── */

export function StudyTip({ tip, className }: { tip: string; className?: string }) {
  return (
    <div className={cn("flex gap-3 rounded-card border border-border bg-brand-soft/60 p-4", className)}>
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
      <div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brand">
          Dica de estudo
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{tip}</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────
   ÍCONE DA PARTE
   ────────────────────────────── */

const PART_ICONS: Record<PartIconName, LucideIcon> = {
  atom: Atom,
  rocket: Rocket,
  move: Move,
  orbit: Orbit,
  zap: Zap,
  magnet: Magnet,
  waves: Waves,
  sun: Sun,
  thermometer: Thermometer,
  flame: Flame,
  gauge: Gauge,
  battery: Battery,
  scale: Scale,
  ruler: Ruler,
  timer: Timer,
  radiation: Radiation,
  "flask-conical": FlaskConical,
  "book-open": BookOpen,
};

export function PartIcon({ name, className }: { name?: PartIconName; className?: string }) {
  const Icon = (name && PART_ICONS[name]) || BookOpen;
  return <Icon className={className} aria-hidden />;
}

/* ──────────────────────────────
   BARRA DE PROGRESSO
   ────────────────────────────── */

export function ProgressBar({
  value,
  className,
  trackClassName,
  barClassName,
  label,
}: {
  value: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
  label?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn("w-full", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-sunken", trackClassName)}>
        <div
          className={cn("h-full rounded-full bg-brand transition-[width] duration-500 ease-out", barClassName)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────
   CARD DE MÉTRICA
   ────────────────────────────── */

export function MetricCard({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon className="h-4.5 w-4.5" aria-hidden />
      </span>
      <div>
        <p className="font-display text-xl font-medium leading-none text-ink">{value}</p>
        <p className="mt-1 text-xs text-ink-faint">{label}</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────
   CARD DE VÍDEO
   ────────────────────────────── */

export function VideoCard({ video, eyebrow }: { video: Video; eyebrow?: string }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 rounded-card border border-border bg-surface p-5 transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="flex items-center justify-between gap-3">
        {eyebrow ? (
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            {eyebrow}
          </span>
        ) : (
          <span />
        )}
        <span className="flex items-center gap-2">
          {video.durationLabel ? <span className="text-xs text-ink-faint">{video.durationLabel}</span> : null}
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[0.68rem] font-medium text-ink-soft">
            {video.playlist ? "Playlist" : "Aula única"}
          </span>
        </span>
      </div>

      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand transition-transform group-hover:scale-105">
          <PlayCircle className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-display text-base font-medium leading-snug text-ink">{video.title}</h3>
          {video.description ? (
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{video.description}</p>
          ) : null}
          {video.author ? <p className="mt-2 text-xs text-ink-faint">{video.author}</p> : null}
          <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand">
            Abrir no YouTube
            <span aria-hidden>↗</span>
          </p>
        </div>
      </div>
    </a>
  );
}

/* ──────────────────────────────
   DESENHO DECORATIVO DA CAPA
   Onda, vetor de força e órbita — três ideias que atravessam
   quase toda a Física. Puramente decorativo (role="presentation").
   ────────────────────────────── */

export function HeroMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 420" fill="none" role="presentation" aria-hidden="true" className={className}>
      {/* Onda */}
      <path
        d="M40 90 Q70 30 100 90 T160 90 T220 90 T280 90"
        stroke="var(--color-brand)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.45"
      />
      <line
        x1="40"
        y1="90"
        x2="280"
        y2="90"
        stroke="var(--color-border-strong)"
        strokeWidth="1.5"
        strokeDasharray="4 6"
      />

      {/* Órbita com corpo central e satélite */}
      <ellipse
        cx="160"
        cy="225"
        rx="92"
        ry="46"
        stroke="var(--color-brand)"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
      <circle cx="160" cy="225" r="13" fill="var(--color-brand)" opacity="0.35" />
      <circle cx="252" cy="225" r="6" fill="var(--color-accent)" />

      {/* Vetor de força sobre um plano */}
      <line x1="46" y1="380" x2="274" y2="380" stroke="var(--color-border-strong)" strokeWidth="2" />
      <rect
        x="104"
        y="348"
        width="34"
        height="32"
        rx="4"
        stroke="var(--color-brand)"
        strokeWidth="2.5"
        fill="none"
        opacity="0.5"
      />
      <line
        x1="146"
        y1="364"
        x2="232"
        y2="364"
        stroke="var(--color-accent)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M232 364 L221 357 M232 364 L221 371"
        stroke="var(--color-accent)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
