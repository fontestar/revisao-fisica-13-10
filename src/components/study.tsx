"use client";

/* ============================================================================
   COMPONENTES DE ESTUDO
   ============================================================================
   As peças interativas da plataforma, na ordem em que aparecem:
   progresso, card de parte, abas, teoria, flashcards, questões
   objetivas, objetivos, cabeçalho/abas/navegação da parte,
   linha do gabarito e questões discursivas.
   ============================================================================ */

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  Info,
  Layers,
  PlaySquare,
  Quote,
  RotateCcw,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  cn,
  getPart,
  letterFor,
  percentage,
  type DiscursiveQuestion,
  type ExerciseLevel,
  type ExerciseOrigin,
  type Flashcard,
  type Objective,
  type Part,
  type Question,
  type TheoryBlock,
} from "@/content";
import { useOverallProgress, usePartProgress, useProgress } from "@/progress";
import { ConstructionChecklist, Diagram, InteractiveTool } from "./interactive";
import {
  EmptyState,
  MathExpr,
  MathText,
  PartIcon,
  ProgressBar,
  StatusPill,
  VideoCard,
} from "./ui";


/* ─────────────────
   PROGRESSO GERAL
   ───────────────── */

/**
 * "SEU PROGRESSO" — visão geral simples combinando partes,
 * flashcards, questões e objetivos. Sempre calculado a partir do
 * progresso salvo (localStorage) e dos dados de conteúdo reais.
 */
export function ProgressSummary({ compact = false }: { compact?: boolean }) {
  const progress = useOverallProgress();

  const rows = [
    { label: "Partes", done: progress.partsCompleted, total: progress.partsTotal },
    { label: "Flashcards", done: progress.flashcardsReviewed, total: progress.flashcardsTotal },
    { label: "Questões", done: progress.questionsAnswered, total: progress.questionsTotal },
    { label: "Objetivos", done: progress.objectivesDone, total: progress.objectivesTotal },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Seu progresso
        </p>
        <p className="font-display text-2xl font-medium text-ink">{progress.percent}%</p>
      </div>
      <ProgressBar value={progress.percent} className="mt-2" label="Progresso geral da revisão" />

      {!compact && (
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-xs text-ink-faint">{row.label}</dt>
              <dd className="text-sm font-medium text-ink">
                {row.done} / {row.total}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}


/* ───────────────────
   CARD DE UMA PARTE
   ─────────────────── */

export function PartCard({ part }: { part: Part }) {
  const progress = usePartProgress(part);

  return (
    <Link
      href={`/partes/${part.id}`}
      className="group flex flex-col justify-between gap-6 rounded-card border border-border bg-surface p-6 transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <PartIcon name={part.icon} className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Parte {String(part.number).padStart(2, "0")}
              </p>
              <h3 className="font-display text-lg font-medium text-ink">{part.title}</h3>
            </div>
          </div>
        </div>

        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-soft">
          <MathText text={part.description} />
        </p>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
          <span>{part.flashcards.length} flashcards</span>
          <span>{part.questions.length} questões</span>
          <span>{part.objectives.length} objetivos</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <StatusPill status={progress.status} />
          <span className="text-xs text-ink-faint">{progress.percent}%</span>
        </div>
        <ProgressBar value={progress.percent} className="mt-2" label={`Progresso da parte ${part.number}`} />
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
          Abrir parte
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}


/* ──────────────────────────────────────────────
   ABAS (acessíveis, com navegação por teclado)
   ────────────────────────────────────────────── */

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
  content: ReactNode;
}

/**
 * Sistema de abas acessível e reutilizável (usado na página de
 * cada parte: Teoria / Flashcards / Questões / Vídeos). Suporta
 * navegação por teclado (setas, Home, End) e não recarrega a página.
 */
export function Tabs({ tabs, defaultTabId }: { tabs: TabItem[]; defaultTabId?: string }) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id);
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === activeId),
  );

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") nextIndex = (activeIndex + 1) % tabs.length;
    else if (e.key === "ArrowLeft") nextIndex = (activeIndex - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = tabs.length - 1;

    if (nextIndex !== null) {
      e.preventDefault();
      setActiveId(tabs[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    }
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Conteúdo da parte"
        className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-border"
      >
        {tabs.map((tab, i) => {
          const active = tab.id === activeId;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setActiveId(tab.id)}
              onKeyDown={handleKeyDown}
              className={cn(
                "relative flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors",
                active ? "text-brand" : "text-ink-faint hover:text-ink-soft",
              )}
            >
              {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
              {tab.label}
              {typeof tab.badge === "number" ? (
                <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[0.65rem] text-ink-faint">
                  {tab.badge}
                </span>
              ) : null}
              {active ? (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== activeId}
          tabIndex={0}
          className="py-6"
        >
          {tab.id === activeId ? tab.content : null}
        </div>
      ))}
    </div>
  );
}


/* ────────
   TEORIA
   ──────── */

const CALLOUT_STYLES = {
  info: { icon: Info, className: "border-brand/30 bg-brand-soft/60 text-brand-strong" },
  warning: { icon: AlertTriangle, className: "border-warning/30 bg-warning-soft text-warning" },
  success: { icon: CheckCircle2, className: "border-success/30 bg-success-soft text-success" },
} as const;

function Block({ block }: { block: TheoryBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <h3 className="mt-10 font-display text-xl font-medium text-ink first:mt-0 sm:text-2xl">
          <MathText text={block.text} />
        </h3>
      );

    case "paragraph":
      return (
        <p className="mt-4 max-w-prose text-[1.05rem] leading-relaxed text-ink-soft">
          <MathText text={block.text} />
        </p>
      );

    case "list":
      return block.style === "number" ? (
        <ol className="mt-4 max-w-prose list-decimal space-y-2 pl-5 text-[1.05rem] leading-relaxed text-ink-soft">
          {block.items.map((item, i) => (
            <li key={i}>
              <MathText text={item} />
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mt-4 max-w-prose list-disc space-y-2 pl-5 text-[1.05rem] leading-relaxed text-ink-soft">
          {block.items.map((item, i) => (
            <li key={i}>
              <MathText text={item} />
            </li>
          ))}
        </ul>
      );

    case "definition":
      return (
        <div className="mt-5 max-w-prose rounded-card border border-border bg-surface-muted/70 p-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Definição · <MathText text={block.term} />
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            <MathText text={block.text} />
          </p>
        </div>
      );

    case "callout": {
      const style = CALLOUT_STYLES[block.variant ?? "info"];
      const Icon = style.icon;
      return (
        <div className={cn("mt-5 flex max-w-prose gap-3 rounded-card border p-4", style.className)}>
          <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden />
          <div>
            {block.title ? (
              <p className="text-sm font-semibold">
                <MathText text={block.title} />
              </p>
            ) : null}
            <p className="mt-1 text-sm leading-relaxed opacity-90">
              <MathText text={block.text} />
            </p>
          </div>
        </div>
      );
    }

    case "example":
      return (
        <div className="mt-5 max-w-prose rounded-card border border-dashed border-border-strong p-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-accent">
            <MathText text={block.title ?? "Exemplo"} />
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            <MathText text={block.text} />
          </p>
        </div>
      );

    case "formula":
      return (
        <div className="mt-5 max-w-full overflow-x-auto rounded-card bg-surface-sunken px-5 py-4 text-center">
          <MathExpr latex={block.text} display />
          {block.caption ? (
            <p className="mt-1.5 text-xs text-ink-faint">
              <MathText text={block.caption} />
            </p>
          ) : null}
        </div>
      );

    case "table":
      return (
        <div className="mt-5 max-w-full overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="bg-surface-muted">
                {block.headers.map((header, i) => (
                  <th key={i} className="border-b border-border px-4 py-2.5 text-left font-semibold text-ink">
                    <MathText text={header} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="odd:bg-surface even:bg-surface-muted/40">
                  {row.map((cell, j) => (
                    <td key={j} className="border-b border-border px-4 py-2.5 text-ink-soft last:border-b-0">
                      <MathText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "quote":
      return (
        <blockquote className="mt-5 max-w-prose border-l-2 border-brand py-1 pl-4">
          <div className="flex gap-2 text-ink">
            <Quote className="h-4 w-4 shrink-0 text-brand" aria-hidden />
            <p className="text-[1.05rem] italic leading-relaxed">
              <MathText text={block.text} />
            </p>
          </div>
          {block.source ? <cite className="mt-1 block pl-6 text-xs not-italic text-ink-faint">Fonte: {block.source}</cite> : null}
        </blockquote>
      );

    /* Legenda de uma fórmula: símbolo, significado e unidade. */
    case "quantities":
      return (
        <div className="mt-4 max-w-prose overflow-hidden rounded-card border border-border">
          <p className="border-b border-border bg-surface-muted px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            {block.title ?? "Onde"}
          </p>
          <dl className="divide-y divide-border">
            {block.items.map((item, i) => (
              <div key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5">
                <dt className="min-w-[2.5rem] font-medium text-ink">
                  <MathExpr latex={item.symbol} />
                </dt>
                <dd className="flex-1 text-sm text-ink-soft">
                  <MathText text={item.name} />
                </dd>
                {item.unit ? (
                  <dd className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                    <MathText text={item.unit} />
                  </dd>
                ) : null}
              </div>
            ))}
          </dl>
        </div>
      );

    /* Exemplo resolvido: enunciado → passos numerados → resposta. */
    case "solved-example":
      return (
        <div className="mt-6 max-w-prose rounded-card border border-border bg-surface p-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-accent">
            <MathText text={block.title ?? "Exemplo resolvido"} />
          </p>
          <p className="mt-2 text-[1.02rem] leading-relaxed text-ink">
            <MathText text={block.statement} />
          </p>

          <ol className="mt-4 space-y-3">
            {block.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[0.65rem] font-semibold text-ink-faint"
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <MathText text={step} />
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-4 rounded-control border border-success/30 bg-success-soft px-4 py-2.5 text-sm text-ink">
            <span className="font-semibold text-success">Resposta: </span>
            <MathText text={block.answer} />
          </p>
        </div>
      );

    /* Imagem, diagrama ou gráfico vindo da pasta public/. */
    case "image":
      return (
        <figure className="mt-5 max-w-prose">
          <Image
            src={block.src}
            alt={block.alt}
            width={block.width ?? 1200}
            height={block.height ?? 800}
            className="h-auto w-full rounded-card border border-border bg-surface"
          />
          {block.caption ? (
            <figcaption className="mt-2 text-xs leading-relaxed text-ink-faint">
              <MathText text={block.caption} />
            </figcaption>
          ) : null}
        </figure>
      );

    /* Ferramenta interativa embutida na teoria. */
    case "interactive":
      return (
        <div className="mt-6">
          {block.title ? (
            <h4 className="font-display text-base font-medium text-ink">{block.title}</h4>
          ) : null}
          {block.note ? (
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-soft">
              <MathText text={block.note} />
            </p>
          ) : null}
          <InteractiveTool tool={block.tool} template={block.template} />
        </div>
      );

    case "checklist":
      return (
        <div className="max-w-prose">
          <ConstructionChecklist items={block.items} />
        </div>
      );

    /* Desenho fixo do capítulo, com legenda. */
    case "diagram":
      return (
        <figure className="mt-5 max-w-3xl">
          <Diagram name={block.name} />
          {block.caption ? (
            <figcaption className="mt-2 max-w-prose text-xs leading-relaxed text-ink-faint">
              <MathText text={block.caption} />
            </figcaption>
          ) : null}
        </figure>
      );

    default:
      return null;
  }
}

/** Selos de nível e origem exibidos no cabeçalho de cada exercício. */
function ExerciseTags({ level, origin }: { level?: ExerciseLevel; origin?: ExerciseOrigin }) {
  const LEVEL_LABEL: Record<ExerciseLevel, string> = {
    1: "Nível 1 · conceito",
    2: "Nível 2 · fórmula direta",
    3: "Nível 3 · várias etapas",
    4: "Nível 4 · conceito + desenho",
    5: "Nível 5 · desafio",
  };
  if (!level && !origin) return null;
  return (
    <span className="flex flex-wrap items-center gap-2">
      {level ? (
        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[0.68rem] font-medium text-ink-soft">
          {LEVEL_LABEL[level]}
        </span>
      ) : null}
      {origin ? (
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[0.68rem] font-medium",
            origin === "professor" ? "bg-accent-soft text-accent" : "bg-brand-soft text-brand",
          )}
        >
          {origin === "professor" ? "Questão do professor" : "Criada para praticar"}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Renderiza a teoria de uma parte a partir de blocos estruturados
 * (heading, paragraph, list, callout...). Isso evita blocos gigantes
 * de texto e mantém a leitura confortável e escaneável.
 */
export function TheoryContent({ blocks }: { blocks: TheoryBlock[] }) {
  if (blocks.length === 0) {
    return (
      <EmptyState
        title="Teoria indisponível no momento."
        description="Veja as outras abas desta parte."
      />
    );
  }

  return (
    <div>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}


/* ─────────────────────────
   MARCADOR DE TEORIA LIDA
   ───────────────────────── */

/** Marca a teoria de uma parte como "visualizada" assim que a aba é aberta. */
export function TheoryViewTracker({ partId }: { partId: string }) {
  const { markTheoryViewed } = useProgress();

  useEffect(() => {
    markTheoryViewed(partId);
  }, [partId, markTheoryViewed]);

  return null;
}


/* ────────────
   FLASHCARDS
   ──────────── */

export function FlashcardDeck({ partId, flashcards }: { partId: string; flashcards: Flashcard[] }) {
  const { getFlashcardStatus, markFlashcard, resetPartFlashcards } = useProgress();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const total = flashcards.length;
  const current = flashcards[index];

  const stats = useMemo(() => {
    let known = 0;
    let unknown = 0;
    for (const card of flashcards) {
      const status = getFlashcardStatus(partId, card.id);
      if (status === "known") known += 1;
      else if (status === "unknown") unknown += 1;
    }
    return { known, unknown, reviewed: known + unknown };
  }, [flashcards, getFlashcardStatus, partId]);

  if (total === 0) {
    return (
      <EmptyState
        title="Nenhum flashcard disponível nesta parte."
        description="Esta parte não tem flashcards no momento."
      />
    );
  }

  function goTo(nextIndex: number) {
    setFlipped(false);
    setIndex(Math.max(0, Math.min(total - 1, nextIndex)));
  }

  function handleMark(status: "known" | "unknown") {
    markFlashcard(partId, current.id, status);
    if (index < total - 1) {
      goTo(index + 1);
    } else {
      setFlipped(false);
    }
  }

  function handleReset() {
    resetPartFlashcards(
      partId,
      flashcards.map((c) => c.id),
    );
    setIndex(0);
    setFlipped(false);
  }

  const currentStatus = getFlashcardStatus(partId, current.id);
  const allReviewed = stats.reviewed === total;

  return (
    <div>
      {/* Progresso */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {stats.reviewed} de {total} revisados
          <span className="mx-2 text-ink-faint">·</span>
          <span className="text-success">{stats.known} sei</span>
          <span className="mx-1 text-ink-faint">/</span>
          <span className="text-error">{stats.unknown} não sei</span>
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint hover:text-ink"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reiniciar flashcards
        </button>
      </div>
      <ProgressBar value={percentage(stats.reviewed, total)} className="mt-2" label="Progresso dos flashcards" />

      {/* Card */}
      <div className="mt-8 flex flex-col items-center">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Flashcard {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>

        <div className="flip-scene mt-4 h-64 w-full max-w-xl sm:h-72">
          <button
            type="button"
            onClick={() => setFlipped((v) => !v)}
            aria-pressed={flipped}
            aria-label={flipped ? "Ver pergunta" : "Virar card para ver a resposta"}
            className={cn(
              "flip-card relative h-full w-full text-left",
              flipped && "is-flipped",
            )}
          >
            <div className="flip-face absolute inset-0 flex flex-col justify-between rounded-card border border-border bg-surface p-6 shadow-[0_1px_0_rgba(32,29,23,0.03)] sm:p-8">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Pergunta
              </span>
              <p className="font-display text-xl leading-snug text-ink sm:text-2xl">
                <MathText text={current.question} />
              </p>
              <span className="text-xs text-ink-faint">Toque para virar</span>
            </div>
            <div className="flip-face flip-face-back absolute inset-0 flex flex-col justify-between rounded-card border border-brand/30 bg-brand-soft p-6 sm:p-8">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand">
                Resposta
              </span>
              <p className="text-lg leading-relaxed text-brand-strong sm:text-xl">
                <MathText text={current.answer} />
              </p>
              <span className="text-xs text-brand/70">Toque para voltar</span>
            </div>
          </button>
        </div>

        {currentStatus ? (
          <p
            className={cn(
              "mt-3 text-xs font-medium",
              currentStatus === "known" ? "text-success" : "text-error",
            )}
          >
            {currentStatus === "known" ? "Marcado como conhecido" : "Marcado para revisar de novo"}
          </p>
        ) : null}

        <div className="mt-6 flex w-full max-w-xl gap-3">
          <button
            type="button"
            onClick={() => handleMark("unknown")}
            className="flex flex-1 items-center justify-center gap-2 rounded-control border border-error/40 bg-error-soft px-4 py-3 text-sm font-medium text-error transition-colors hover:bg-error-soft/70"
          >
            <X className="h-4 w-4" aria-hidden />
            Não sei
          </button>
          <button
            type="button"
            onClick={() => handleMark("known")}
            className="flex flex-1 items-center justify-center gap-2 rounded-control border border-success/40 bg-success-soft px-4 py-3 text-sm font-medium text-success transition-colors hover:bg-success-soft/70"
          >
            <Check className="h-4 w-4" aria-hidden />
            Sei
          </button>
        </div>

        <div className="mt-4 flex w-full max-w-xl items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            className="rounded-control px-3 py-2 font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-30"
          >
            ← Anterior
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === total - 1}
            className="rounded-control px-3 py-2 font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-30"
          >
            Próximo →
          </button>
        </div>

        {allReviewed ? (
          <p className="mt-6 rounded-control bg-success-soft px-4 py-2.5 text-sm font-medium text-success">
            Você revisou todos os flashcards desta parte.
          </p>
        ) : null}
      </div>
    </div>
  );
}


/* ────────────────────
   QUESTÕES OBJETIVAS
   ──────────────────── */

export function QuestionRunner({ partId, questions }: { partId: string; questions: Question[] }) {
  const { getQuestionAnswer, answerQuestion, resetPartQuestions } = useProgress();
  const [index, setIndex] = useState(0);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [lastIndex, setLastIndex] = useState(index);

  const total = questions.length;
  const current = questions[index];

  if (index !== lastIndex) {
    setLastIndex(index);
    setPendingSelection(null);
  }

  const stats = useMemo(() => {
    let answered = 0;
    let correct = 0;
    for (const q of questions) {
      const answer = getQuestionAnswer(partId, q.id);
      if (answer) {
        answered += 1;
        if (answer.correct) correct += 1;
      }
    }
    return { answered, correct, incorrect: answered - correct };
  }, [questions, getQuestionAnswer, partId]);

  if (total === 0) {
    return (
      <EmptyState
        title="As questões desta parte aparecerão aqui."
        description="Esta parte não tem questões objetivas no momento."
      />
    );
  }

  const storedAnswer = getQuestionAnswer(partId, current.id);
  const isConfirmed = Boolean(storedAnswer);
  const selectedId = isConfirmed ? storedAnswer!.alternativeId : pendingSelection;

  function confirmAnswer() {
    if (!pendingSelection) return;
    const correct = pendingSelection === current.correctAlternativeId;
    answerQuestion(partId, current.id, pendingSelection, correct);
  }

  function redoQuestion() {
    resetPartQuestions(partId, [current.id]);
    setPendingSelection(null);
  }

  function resetAttempt() {
    resetPartQuestions(
      partId,
      questions.map((q) => q.id),
    );
    setPendingSelection(null);
    setIndex(0);
  }

  return (
    <div>
      {/* Progresso */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {stats.answered} / {total} respondidas
          <span className="mx-2 text-ink-faint">·</span>
          <span className="text-success">acertos: {stats.correct}</span>
          <span className="mx-1 text-ink-faint">/</span>
          <span className="text-error">erros: {stats.incorrect}</span>
        </p>
        <button
          type="button"
          onClick={resetAttempt}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint hover:text-ink"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reiniciar tentativa
        </button>
      </div>
      <ProgressBar value={percentage(stats.answered, total)} className="mt-2" label="Progresso das questões" />

      {/* Questão */}
      <fieldset className="mt-8 rounded-card border border-border bg-surface p-5 sm:p-7">
        <legend className="px-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Questão {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </legend>

        <div className="mt-2">
          <ExerciseTags level={current.level} origin={current.origin} />
        </div>

        <p className="mt-3 max-w-prose text-[1.05rem] leading-relaxed text-ink">
          <MathText text={current.statement} />
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          {current.alternatives.map((alt, i) => {
            const isSelected = selectedId === alt.id;
            const isCorrectAlt = alt.id === current.correctAlternativeId;
            let stateClass = "border-border bg-surface hover:border-border-strong";
            if (isConfirmed) {
              if (isCorrectAlt) {
                stateClass = "border-success/50 bg-success-soft";
              } else if (isSelected) {
                stateClass = "border-error/50 bg-error-soft";
              } else {
                stateClass = "border-border bg-surface opacity-70";
              }
            } else if (isSelected) {
              stateClass = "border-brand bg-brand-soft";
            }

            return (
              <label
                key={alt.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-control border px-4 py-3 text-sm transition-colors",
                  isConfirmed && "cursor-default",
                  stateClass,
                )}
              >
                <input
                  type="radio"
                  name={`question-${current.id}`}
                  value={alt.id}
                  checked={isSelected}
                  disabled={isConfirmed}
                  onChange={() => setPendingSelection(alt.id)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    isSelected || (isConfirmed && isCorrectAlt)
                      ? "border-transparent bg-brand text-brand-contrast"
                      : "border-border-strong text-ink-faint",
                    isConfirmed && isCorrectAlt && "bg-success",
                    isConfirmed && isSelected && !isCorrectAlt && "bg-error",
                  )}
                >
                  {letterFor(i)}
                </span>
                <span className="pt-0.5 leading-relaxed text-ink-soft">
                  <MathText text={alt.text} />
                </span>
                {isConfirmed && isCorrectAlt ? (
                  <Check className="ml-auto mt-1 h-4 w-4 shrink-0 text-success" aria-hidden />
                ) : null}
                {isConfirmed && isSelected && !isCorrectAlt ? (
                  <X className="ml-auto mt-1 h-4 w-4 shrink-0 text-error" aria-hidden />
                ) : null}
              </label>
            );
          })}
        </div>

        {!isConfirmed ? (
          <button
            type="button"
            onClick={confirmAnswer}
            disabled={!pendingSelection}
            className="mt-6 rounded-control bg-brand px-5 py-2.5 text-sm font-medium text-brand-contrast transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Confirmar resposta
          </button>
        ) : (
          <div className="mt-6">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold",
                storedAnswer!.correct ? "bg-success-soft text-success" : "bg-error-soft text-error",
              )}
            >
              {storedAnswer!.correct ? <Check className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
              {storedAnswer!.correct ? "Correta" : "Incorreta"}
            </div>

            {current.explanation ? (
              <div className="mt-4 max-w-prose rounded-control bg-surface-muted p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  Explicação
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  <MathText text={current.explanation ?? ""} />
                </p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={redoQuestion}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Refazer esta questão
            </button>
          </div>
        )}
      </fieldset>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="rounded-control px-3 py-2 font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-30"
        >
          ← Anterior
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
          disabled={index === total - 1}
          className="rounded-control px-3 py-2 font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-30"
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}


/* ───────────────────────────
   OBJETIVOS DE APRENDIZAGEM
   ─────────────────────────── */

/**
 * Lista de objetivos de aprendizagem de uma parte. O estudante
 * pode marcar/desmarcar cada objetivo conforme avança nos estudos.
 */
export function ObjectivesList({ partId, objectives }: { partId: string; objectives: Objective[] }) {
  const { isObjectiveDone, toggleObjective } = useProgress();

  if (objectives.length === 0) {
    return (
      <EmptyState
        title="Esta parte não tem objetivos listados."
        description="Use a teoria e os exercícios para guiar o estudo."
      />
    );
  }

  const done = objectives.filter((o) => isObjectiveDone(partId, o.id)).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Objetivos
        </p>
        <p className="text-xs text-ink-faint">
          {done} / {objectives.length} concluídos
        </p>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {objectives.map((objective) => {
          const checked = isObjectiveDone(partId, objective.id);
          return (
            <li key={objective.id}>
              <button
                type="button"
                onClick={() => toggleObjective(partId, objective.id)}
                aria-pressed={checked}
                className="flex w-full items-start gap-3 rounded-control border border-border bg-surface px-3.5 py-2.5 text-left text-sm transition-colors hover:border-border-strong"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                    checked ? "border-brand bg-brand text-brand-contrast" : "border-border-strong",
                  )}
                >
                  {checked ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                </span>
                <span className={cn("leading-relaxed", checked ? "text-ink-faint line-through" : "text-ink-soft")}>
                  <MathText text={objective.text} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


/* ────────────────────
   CABEÇALHO DA PARTE
   ──────────────────── */

export function PartHeader({ part }: { part: Part }) {
  return (
    <header className="border-b border-border pb-8">
      <Link href="/partes" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-faint hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Todas as partes
      </Link>

      <div className="mt-5 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <PartIcon name={part.icon} className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Parte {String(part.number).padStart(2, "0")}
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">
            {part.title}
          </h1>
          <p className="mt-3 max-w-prose text-base leading-relaxed text-ink-soft">
            <MathText text={part.description} />
          </p>

          {/* Videoaulas desta parte: a mais específica vem primeiro */}
          {part.videos.length > 0 ? (
            <div className="mt-5">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">Videoaulas desta parte</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {part.videos.map((video, i) => (
                  <a
                    key={video.id}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-control border px-3 py-2 text-sm font-medium transition-colors",
                      i === 0
                        ? "border-brand bg-brand text-brand-contrast hover:opacity-90"
                        : "border-border text-ink-soft hover:border-border-strong hover:text-ink",
                    )}
                  >
                    <PlaySquare className="h-4 w-4" aria-hidden />
                    {video.title}
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
                    <span className="sr-only">(abre o YouTube em nova aba)</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {part.objectives.length > 0 ? (
        <div className="mt-6 max-w-xl">
          <ObjectivesList partId={part.id} objectives={part.objectives} />
        </div>
      ) : null}
    </header>
  );
}


/* ─────────────────────────────────────────────────────────
   ABAS DA PARTE (teoria / flashcards / questões / vídeos)
   ───────────────────────────────────────────────────────── */

/**
 * Composição das abas de uma parte: Teoria, Flashcards, Questões e,
 * quando existirem, Vídeos. Todo o conteúdo vem de `part`, então
 * esta estrutura funciona igual para 1 parte ou para 20 partes.
 */
export function PartTabs({ part }: { part: Part }) {
  const tabs = [
    {
      id: "teoria",
      label: "Teoria",
      icon: BookOpen,
      content: (
        <>
          <TheoryViewTracker partId={part.id} />
          <TheoryContent blocks={part.theory} />
        </>
      ),
    },
    {
      id: "flashcards",
      label: "Flashcards",
      icon: Layers,
      badge: part.flashcards.length,
      content: <FlashcardDeck partId={part.id} flashcards={part.flashcards} />,
    },
    {
      id: "questoes",
      label: "Questões",
      icon: HelpCircle,
      badge: part.questions.length,
      content: <QuestionRunner partId={part.id} questions={part.questions} />,
    },
  ];

  if (part.videos.length > 0) {
    tabs.push({
      id: "videos",
      label: "Vídeos",
      icon: PlaySquare,
      badge: part.videos.length,
      content: (
        <div className="grid gap-4 sm:grid-cols-2">
          {part.videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ),
    });
  } else {
    tabs.push({
      id: "videos",
      label: "Vídeos",
      icon: PlaySquare,
      content: (
        <EmptyState
          title="Sem videoaulas para esta parte."
          description="Veja a página Videoaulas para as aulas gerais."
        />
      ),
    });
  }

  return <Tabs tabs={tabs} />;
}


/* ────────────────────────
   NAVEGAÇÃO ENTRE PARTES
   ──────────────────────── */

export function PartNavigation({ prev, next }: { prev?: Part; next?: Part }) {
  if (!prev && !next) return null;

  return (
    <nav aria-label="Navegação entre partes" className="mt-10 flex items-stretch gap-3 border-t border-border pt-6">
      {prev ? (
        <Link
          href={`/partes/${prev.id}`}
          className="flex flex-1 flex-col gap-1 rounded-card border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
        >
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Parte anterior
          </span>
          <span className="truncate text-sm font-medium text-ink">{prev.title}</span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {next ? (
        <Link
          href={`/partes/${next.id}`}
          className="flex flex-1 flex-col items-end gap-1 rounded-card border border-border bg-surface px-4 py-3 text-right transition-colors hover:border-border-strong"
        >
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint">
            Próxima parte
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="truncate text-sm font-medium text-ink">{next.title}</span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}


/* ───────────────────
   LINHA DO GABARITO
   ─────────────────── */

export function AnswerRow({
  number,
  letter,
  question,
}: {
  number: number;
  letter: string;
  question: Question;
}) {
  const [open, setOpen] = useState(false);
  const hasExplanation = Boolean(question.explanation);

  return (
    <li className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-4 py-3.5">
        <span className="w-8 shrink-0 font-display text-sm text-ink-faint">
          {String(number).padStart(2, "0")}
        </span>
        <p className="min-w-0 flex-1 truncate text-sm text-ink-soft">
          <MathText text={question.statement} />
        </p>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
          {letter}
        </span>
        {hasExplanation ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-ink-faint hover:text-ink"
          >
            Explicação
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
        ) : null}
      </div>
      {open && hasExplanation ? (
        <p className="max-w-prose pb-4 pl-12 text-sm leading-relaxed text-ink-soft">
          <MathText text={question.explanation ?? ""} />
        </p>
      ) : null}
    </li>
  );
}


/* ──────────────────────
   QUESTÕES DISCURSIVAS
   ────────────────────── */

/**
 * Card de uma questão discursiva. O enunciado fica sempre visível;
 * a resolução passo a passo só aparece depois que o estudante
 * escolhe revelá-la — para que ele tente resolver antes.
 */
export function DiscursiveCard({
  question,
  number,
}: {
  question: DiscursiveQuestion;
  number: number;
}) {
  const [showSolution, setShowSolution] = useState(false);
  const { isDiscursiveDone, toggleDiscursive } = useProgress();
  const done = isDiscursiveDone(question.id);
  const part = question.relatedPartId ? getPart(question.relatedPartId) : undefined;

  return (
    <article
      className={cn(
        "rounded-card border bg-surface p-5 transition-colors sm:p-7",
        done ? "border-success/40" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Questão {String(number).padStart(2, "0")}
          </span>
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
            {question.topic}
          </span>
          <ExerciseTags level={question.level} origin={question.origin} />
        </div>

        <button
          type="button"
          onClick={() => toggleDiscursive(question.id)}
          aria-pressed={done}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-control border px-3 py-1.5 text-xs font-medium transition-colors",
            done
              ? "border-success/40 bg-success-soft text-success"
              : "border-border text-ink-soft hover:border-border-strong hover:text-ink",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded border",
              done ? "border-transparent bg-success text-white" : "border-border-strong",
            )}
          >
            {done ? <Check className="h-3 w-3" aria-hidden /> : null}
          </span>
          {done ? "Resolvida" : "Marcar como resolvida"}
        </button>
      </div>

      {/* Enunciado — quebras de linha do texto viram parágrafos */}
      <div className="mt-4 max-w-prose space-y-2 text-[1.05rem] leading-relaxed text-ink">
        {question.statement.split("\n").map((line, i) =>
          line.trim() === "" ? null : (
            <p key={i}>
              <MathText text={line} />
            </p>
          ),
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setShowSolution((v) => !v)}
          aria-expanded={showSolution}
          className="inline-flex items-center gap-1.5 rounded-control bg-brand px-4 py-2.5 text-sm font-medium text-brand-contrast transition-opacity hover:opacity-90"
        >
          {showSolution ? "Ocultar resolução" : "Ver resolução"}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", showSolution && "rotate-180")}
            aria-hidden
          />
        </button>

        {part ? (
          <Link
            href={`/partes/${part.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-ink-faint hover:text-ink"
          >
            Revisar Parte {String(part.number).padStart(2, "0")}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>

      {question.checklist && question.checklist.length > 0 ? (
        <ConstructionChecklist items={question.checklist} />
      ) : null}

      {showSolution ? (
        <div className="mt-5 border-t border-border pt-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Resolução passo a passo
          </p>
          <ol className="mt-3 max-w-prose space-y-3">
            {question.solutionSteps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[0.65rem] font-semibold text-ink-faint"
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <MathText text={step} />
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-5 max-w-prose rounded-control border border-success/30 bg-success-soft p-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-success">
              Resposta
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">
              <MathText text={question.finalAnswer} />
            </p>
          </div>
        </div>
      ) : null}
    </article>
  );
}


/* ───────────────────────────
   PROGRESSO DAS DISCURSIVAS
   ─────────────────────────── */

/** Progresso local da área de questões discursivas. */
export function DiscursiveProgress({ questions }: { questions: DiscursiveQuestion[] }) {
  const { isDiscursiveDone } = useProgress();
  const done = questions.filter((q) => isDiscursiveDone(q.id)).length;
  const percent = percentage(done, questions.length);

  return (
    <div className="rounded-card border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-ink-soft">
          {done} de {questions.length} resolvidas
        </p>
        <p className="font-display text-xl font-medium text-ink">{percent}%</p>
      </div>
      <ProgressBar value={percent} className="mt-2" label="Progresso das questões discursivas" />
    </div>
  );
}
